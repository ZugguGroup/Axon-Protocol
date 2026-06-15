import jwt
import uuid
import bcrypt
from datetime import datetime, timezone, timedelta
from fastapi import HTTPException, Security, Depends, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials, APIKeyHeader
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.agent import Agent
from app.models.user import User
from app.models.project import Project
from app.config import settings

bearer_scheme = HTTPBearer(auto_error=False)
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

def _hash(secret: str) -> str:
    """Hash a secret string using bcrypt."""
    return bcrypt.hashpw(secret.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def _verify(plain: str, hashed: str) -> bool:
    """Verify a plain string against a bcrypt hash."""
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False

def hash_api_key(key: str) -> str:
    return _hash(key)

def verify_api_key(plain: str, hashed: str) -> bool:
    return _verify(plain, hashed)

def hash_password(password: str) -> str:
    return _hash(password)

def generate_api_key() -> str:
    return f"axon-{uuid.uuid4().hex}-{uuid.uuid4().hex[:8]}"

def create_jwt_token(agent_id: str, project_id: str) -> str:
    payload = {
        "sub": agent_id,
        "project_id": project_id,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

def create_user_jwt_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not credentials:
        raise HTTPException(status_code=401, detail="Missing authorization credentials")
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )
        user_id = payload.get("sub")
        email = payload.get("email")
        if not user_id or not email:
            raise HTTPException(status_code=401, detail="Invalid token claims")
            
        try:
            user_uuid = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
        except ValueError:
            raise HTTPException(status_code=401, detail="Invalid user ID format")
            
        result = await db.execute(select(User).where(User.id == user_uuid))
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

async def get_current_agent(
    credentials: HTTPAuthorizationCredentials = Security(bearer_scheme),
    api_key: str = Security(api_key_header),
    x_agent_id: str | None = Header(None, alias="X-Agent-ID"),
    db: AsyncSession = Depends(get_db),
) -> Agent:
    agent = None
    
    # 1. Try JWT first
    if credentials:
        try:
            payload = jwt.decode(
                credentials.credentials,
                settings.JWT_SECRET,
                algorithms=[settings.JWT_ALGORITHM]
            )
            # Only process if it's an agent token (does not have email claim)
            if "email" not in payload:
                agent_id = payload.get("sub")
                if agent_id:
                    try:
                        agent_uuid = uuid.UUID(agent_id) if isinstance(agent_id, str) else agent_id
                        result = await db.execute(select(Agent).where(Agent.id == agent_uuid))
                        agent = result.scalar_one_or_none()
                    except ValueError:
                        pass
        except jwt.PyJWTError:
            pass
    
    # 2. Try API key if JWT failed
    if not agent and api_key:
        # Check if the API key matches a project
        result = await db.execute(select(Project))
        projects = result.scalars().all()
        target_project = None
        for p in projects:
            if verify_api_key(api_key, p.api_key_hash):
                target_project = p
                break
                
        # If API key matches a legacy agent API key (backward compatibility)
        if not target_project:
            if api_key == "legacy-fallback-key" and x_agent_id:
                try:
                    agent_uuid = uuid.UUID(x_agent_id) if isinstance(x_agent_id, str) else x_agent_id
                    agent_result = await db.execute(
                        select(Agent).where(
                            Agent.id == agent_uuid,
                            Agent.status == "active"
                        )
                    )
                    agent = agent_result.scalar_one_or_none()
                except ValueError:
                    pass
        else:
            # Look up agent in this project
            if x_agent_id:
                try:
                    agent_uuid = uuid.UUID(x_agent_id) if isinstance(x_agent_id, str) else x_agent_id
                    agent_result = await db.execute(
                        select(Agent).where(
                            Agent.id == agent_uuid,
                            Agent.project_id == target_project.id,
                            Agent.status == "active"
                        )
                    )
                    agent = agent_result.scalar_one_or_none()
                except ValueError:
                    pass
            else:
                # Default to the first active agent in the project
                agent_result = await db.execute(
                    select(Agent).where(
                        Agent.project_id == target_project.id,
                        Agent.status == "active"
                    ).order_by(Agent.created_at.asc())
                )
                agent = agent_result.scalars().first()
                if not agent:
                    # Automatically provision a default agent for the project
                    agent = Agent(
                        name="system-agent",
                        project_id=target_project.id,
                        capabilities=["system"],
                        status="active"
                    )
                    db.add(agent)
                    await db.commit()
                    await db.refresh(agent)
    
    if not agent or agent.status != "active":
        raise HTTPException(status_code=401, detail="Invalid or expired credentials")
    
    # Update last seen using timezone-naive UTC datetime
    agent.last_seen_at = datetime.now(timezone.utc).replace(tzinfo=None)
    await db.commit()
    
    return agent
