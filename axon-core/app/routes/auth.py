from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.user import User
from app.models.subscription import Subscription
from app.schemas.auth import UserSignupRequest, UserLoginRequest, UserAuthResponse
from app.middleware.auth import hash_password, _verify, create_user_jwt_token

router = APIRouter(prefix="/v1/auth", tags=["auth"])

@router.post("/signup", response_model=UserAuthResponse)
async def signup(request: UserSignupRequest, db: AsyncSession = Depends(get_db)):
    # 1. Check if user already exists
    result = await db.execute(select(User).where(User.email == request.email.lower()))
    existing_user = result.scalar_one_or_none()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered"
        )
        
    # 2. Hash password and save User
    password_hash = hash_password(request.password)
    user = User(
        email=request.email.lower(),
        password_hash=password_hash
    )
    db.add(user)
    await db.flush() # flush to generate user.id before subscription assignment
    
    # 3. Create a default Free subscription
    sub = Subscription(
        user_id=user.id,
        plan="free",
        status="active"
    )
    db.add(sub)
    await db.commit()
    await db.refresh(user)
    
    token = create_user_jwt_token(str(user.id), user.email)
    
    return UserAuthResponse(
        token=token,
        email=user.email,
        user_id=user.id
    )

@router.post("/login", response_model=UserAuthResponse)
async def login(request: UserLoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == request.email.lower()))
    user = result.scalar_one_or_none()
    
    if not user or not _verify(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
        
    token = create_user_jwt_token(str(user.id), user.email)
    
    return UserAuthResponse(
        token=token,
        email=user.email,
        user_id=user.id
    )
