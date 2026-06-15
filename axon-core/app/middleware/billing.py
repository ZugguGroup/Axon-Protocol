from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
import uuid
from typing import Any
from app.database import get_db
from app.models.agent import Agent
from app.models.project import Project
from app.models.subscription import Subscription
from app.models.memory import Memory
from app.middleware.auth import get_current_agent

async def get_project_subscription(project_id: str | uuid.UUID | Any, db: AsyncSession) -> tuple[str, str]:
    """Helper to retrieve plan and status for a project's owner subscription."""
    if isinstance(project_id, uuid.UUID):
        project_uuid = project_id
    elif isinstance(project_id, str):
        try:
            project_uuid = uuid.UUID(project_id)
        except ValueError:
            return "free", "active"
    else:
        try:
            project_uuid = uuid.UUID(str(project_id))
        except ValueError:
            return "free", "active"
        
    result = await db.execute(select(Project).where(Project.id == project_uuid))
    project = result.scalar_one_or_none()
    if not project:
        return "free", "active"
        
    sub_result = await db.execute(select(Subscription).where(Subscription.user_id == project.owner_id))
    sub = sub_result.scalar_one_or_none()
    if not sub:
        return "free", "active"
        
    return sub.plan, sub.status

async def check_memory_limit(
    current_agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db)
):
    plan, status_str = await get_project_subscription(current_agent.project_id, db)
    if status_str != "active":
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Subscription is inactive. Please update your billing details."
        )
        
    limit = 1000 if plan == "free" else 100000
    
    count_result = await db.execute(
        select(func.count(Memory.id)).where(Memory.project_id == current_agent.project_id)
    )
    count = count_result.scalar() or 0
    
    if count >= limit:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"Memory storage limit reached for plan '{plan}' ({limit} units). Upgrade your subscription to increase capacity."
        )

async def check_agent_limit(
    project_id: str | uuid.UUID,
    db: AsyncSession
):
    if isinstance(project_id, str):
        try:
            project_uuid = uuid.UUID(project_id)
        except ValueError:
            project_uuid = uuid.uuid4()
    else:
        project_uuid = project_id

    plan, status_str = await get_project_subscription(project_uuid, db)
    if status_str != "active":
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Subscription is inactive."
        )
        
    limit = 3 if plan == "free" else 50
    
    count_result = await db.execute(
        select(func.count(Agent.id)).where(
            Agent.project_id == project_uuid,
            Agent.status == "active"
        )
    )
    count = count_result.scalar() or 0
    
    if count >= limit:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"Agent registration limit reached for plan '{plan}' ({limit} agents). Upgrade to Pro to add more agents."
        )

async def check_lock_rate_limit(
    current_agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db)
):
    from app.config import settings
    from app.services.pubsub import get_redis, is_redis_available
    
    # Skip rate limit checks in local mode or offline/mock testing mode if Redis is down
    if settings.AXON_MODE == "local" or not await is_redis_available():
        return
        
    plan, status_str = await get_project_subscription(current_agent.project_id, db)
    limit = 5 if plan == "free" else 300
    
    try:
        r = await get_redis()
        key = f"rate:lock:{current_agent.project_id}"
        
        current_val = await r.get(key)
        if current_val and int(current_val) >= limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Lock coordination rate limit exceeded for plan '{plan}' ({limit} requests/min). Please try again later or upgrade your subscription."
            )
            
        await r.incr(key)
        if not current_val:
            await r.expire(key, 60)
    except HTTPException:
        raise
    except Exception:
        # Non-blocking log for transient Redis errors
        pass
