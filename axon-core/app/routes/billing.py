from fastapi import APIRouter, Depends, HTTPException, Request, Header, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import json
import uuid
from app.database import get_db
from app.models.user import User
from app.models.subscription import Subscription
from app.middleware.auth import get_current_user
from app.config import settings
from datetime import datetime, timedelta

router = APIRouter(prefix="/v1/billing", tags=["billing"])

@router.post("/checkout")
async def create_checkout_session(
    plan: str = "pro",
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if settings.BILLING_PROVIDER == "stripe" and settings.STRIPE_API_KEY:
        try:
            import stripe
            stripe.api_key = settings.STRIPE_API_KEY
            
            # Find or create Stripe Customer
            result = await db.execute(select(Subscription).where(Subscription.user_id == current_user.id))
            sub = result.scalar_one_or_none()
            customer_id = sub.customer_id if sub else None
            
            if not customer_id:
                customer = stripe.Customer.create(email=current_user.email)
                customer_id = customer.id
                if sub:
                    sub.customer_id = customer_id
                    await db.commit()
            
            # Create Stripe Checkout Session
            session = stripe.checkout.Session.create(
                customer=customer_id,
                payment_method_types=['card'],
                line_items=[{
                    'price': settings.STRIPE_PRO_PRICE_ID or 'price_pro_plan_placeholder', # Replace with real price ID
                    'quantity': 1,
                }],
                mode='subscription',
                success_url='http://localhost:5173/#/billing?session_id={CHECKOUT_SESSION_ID}',
                cancel_url='http://localhost:5173/#/billing',
            )
            return {"checkout_url": session.url}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Stripe error: {str(e)}")
    else:
        # Mock checkout URL that redirects back to dashboard with checkout_session=mock_success
        return {
            "checkout_url": "http://localhost:5173/#/billing?checkout_session=mock_success"
        }

@router.post("/portal")
async def create_portal_session(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Subscription).where(Subscription.user_id == current_user.id))
    sub = result.scalar_one_or_none()
    
    if settings.BILLING_PROVIDER == "stripe" and settings.STRIPE_API_KEY and sub and sub.customer_id:
        try:
            import stripe
            stripe.api_key = settings.STRIPE_API_KEY
            session = stripe.billing_portal.Session.create(
                customer=sub.customer_id,
                return_url='http://localhost:5173/#/billing',
            )
            return {"portal_url": session.url}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Stripe portal error: {str(e)}")
    else:
        # Mock portal URL
        return {
            "portal_url": "http://localhost:5173/#/billing?portal_session=mock_success"
        }

@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: str | None = Header(None),
    db: AsyncSession = Depends(get_db)
):
    payload = await request.body()
    event = None

    if settings.BILLING_PROVIDER == "stripe" and settings.STRIPE_API_KEY:
        try:
            import stripe
            stripe.api_key = settings.STRIPE_API_KEY
            event = stripe.Webhook.construct_event(
                payload, stripe_signature, settings.STRIPE_WEBHOOK_SECRET
            )
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Webhook error: {str(e)}")
    else:
        # Fallback to direct json loading for simulated testing webhook calls
        try:
            event = json.loads(payload.decode('utf-8'))
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid JSON body")

    event_type = event.get("type")
    data_object = event.get("data", {}).get("object", {})

    if event_type in ["customer.subscription.created", "customer.subscription.updated"]:
        cust_id = data_object.get("customer")
        sub_id = data_object.get("id")
        status_str = data_object.get("status")
        
        # Look up subscription by customer ID or subscription ID
        result = await db.execute(select(Subscription).where(Subscription.customer_id == cust_id))
        sub = result.scalar_one_or_none()
        if not sub:
            result = await db.execute(select(Subscription).where(Subscription.subscription_id == sub_id))
            sub = result.scalar_one_or_none()
            
        if sub:
            sub.subscription_id = sub_id
            sub.plan = "pro" if status_str == "active" else "free"
            sub.status = status_str
            if data_object.get("current_period_end"):
                sub.current_period_end = datetime.utcfromtimestamp(data_object.get("current_period_end"))
            await db.commit()

    elif event_type == "customer.subscription.deleted":
        cust_id = data_object.get("customer")
        result = await db.execute(select(Subscription).where(Subscription.customer_id == cust_id))
        sub = result.scalar_one_or_none()
        if sub:
            sub.plan = "free"
            sub.status = "canceled"
            await db.commit()

    # Mock/simplified event handlers (for testing without Stripe)
    elif event_type == "subscription.updated":
        user_id = event.get("user_id")
        if user_id:
            user_uuid = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
            result = await db.execute(select(Subscription).where(Subscription.user_id == user_uuid))
            sub = result.scalar_one_or_none()
            if sub:
                sub.plan = event.get("plan", "pro")
                sub.status = "active"
                await db.commit()

    elif event_type == "subscription.deleted":
        user_id = event.get("user_id")
        if user_id:
            user_uuid = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
            result = await db.execute(select(Subscription).where(Subscription.user_id == user_uuid))
            sub = result.scalar_one_or_none()
            if sub:
                sub.plan = "free"
                sub.status = "canceled"
                await db.commit()

    return {"status": "success"}

@router.post("/simulate-upgrade")
async def simulate_upgrade(
    plan: str = "pro",
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Simulates upgrade to Pro tier for development and testing without Stripe."""
    result = await db.execute(select(Subscription).where(Subscription.user_id == current_user.id))
    sub = result.scalar_one_or_none()
    
    if not sub:
        sub = Subscription(user_id=current_user.id)
        db.add(sub)
        
    sub.plan = plan
    sub.status = "active"
    sub.current_period_end = datetime.utcnow() + timedelta(days=30)
    await db.commit()
    await db.refresh(sub)
    
    return {
        "message": f"Successfully simulated subscription upgrade to plan '{plan}'",
        "plan": sub.plan,
        "status": sub.status,
        "current_period_end": sub.current_period_end.isoformat()
    }
