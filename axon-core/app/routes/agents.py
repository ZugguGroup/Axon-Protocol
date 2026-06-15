from fastapi import APIRouter, Depends, HTTPException, Security
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid
from app.database import get_db
from app.models.agent import Agent
from app.models.project import Project
from app.models.user import User
from app.models.subscription import Subscription
from app.schemas.agent import AgentRegisterRequest, AgentRegisterResponse, AgentInfo
from app.middleware.auth import (
    get_current_agent, hash_api_key, generate_api_key, create_jwt_token,
    api_key_header, verify_api_key, hash_password
)
from app.middleware.billing import check_agent_limit

router = APIRouter(prefix="/v1/agents", tags=["agents"])

@router.post("/register", response_model=AgentRegisterResponse)
async def register_agent(
    request: AgentRegisterRequest,
    api_key: str = Security(api_key_header),
    db: AsyncSession = Depends(get_db)
):
    project = None
    returned_api_key = ""
    if not api_key:
        # Legacy fallback: resolve/create default legacy user & project
        # 1. Resolve or create default user
        result = await db.execute(select(User).where(User.email == "legacy-default@axon.local"))
        default_user = result.scalar_one_or_none()
        if not default_user:
            default_user = User(
                email="legacy-default@axon.local",
                password_hash=hash_password("legacy-default-password")
            )
            db.add(default_user)
            await db.flush()
            
            # Create subscription
            subscription = Subscription(
                user_id=default_user.id,
                plan="free",
                status="active"
            )
            db.add(subscription)
            await db.flush()
            
        # 2. Resolve or create project
        try:
            project_uuid = uuid.UUID(request.project_id)
            result = await db.execute(select(Project).where(Project.id == project_uuid))
        except ValueError:
            result = await db.execute(select(Project).where(
                Project.name == request.project_id,
                Project.owner_id == default_user.id
            ))
            
        project = result.scalar_one_or_none()
            
        if not project:
            # Create default project
            try:
                new_project_uuid = uuid.UUID(request.project_id)
            except ValueError:
                new_project_uuid = uuid.uuid4()
            
            raw_project_key = generate_api_key()
            project = Project(
                id=new_project_uuid,
                name=request.project_id,
                owner_id=default_user.id,
                api_key_hash=hash_api_key(raw_project_key)
            )
            db.add(project)
            await db.flush()
            returned_api_key = raw_project_key
        else:
            returned_api_key = "legacy-fallback-key"
    else:
        # Standard registration flow with api_key
        try:
            project_uuid = uuid.UUID(request.project_id)
            result = await db.execute(select(Project).where(Project.id == project_uuid))
        except ValueError:
            result = await db.execute(select(Project).where(Project.name == request.project_id))
            
        project = result.scalar_one_or_none()
        if not project or not verify_api_key(api_key, project.api_key_hash):
            raise HTTPException(status_code=401, detail="Invalid Project API Key")
        returned_api_key = api_key

    # Enforce agent limits
    await check_agent_limit(str(project.id), db)

    agent = Agent(
        name=request.name,
        project_id=project.id,
        org_id=request.org_id,
        capabilities=request.capabilities,
    )
    db.add(agent)
    await db.commit()
    await db.refresh(agent)
    
    token = create_jwt_token(str(agent.id), str(agent.project_id))
    
    return AgentRegisterResponse(
        id=agent.id,
        name=agent.name,
        project_id=request.project_id,
        api_key=returned_api_key,
        token=token,
        created_at=agent.created_at,
    )

@router.get("/me", response_model=AgentInfo)
async def get_me(current_agent: Agent = Depends(get_current_agent)):
    return AgentInfo(
        id=current_agent.id,
        name=current_agent.name,
        project_id=str(current_agent.project_id),
        capabilities=current_agent.capabilities,
        status=current_agent.status,
        last_seen_at=current_agent.last_seen_at,
        created_at=current_agent.created_at,
    )

@router.get("/list")
async def list_agents(
    current_agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Agent)
        .where(Agent.project_id == current_agent.project_id)
        .order_by(Agent.created_at.desc())
    )
    agents = result.scalars().all()
    return {
        "agents": [
            {
                "id": str(a.id),
                "name": a.name,
                "project_id": str(a.project_id),
                "capabilities": a.capabilities,
                "status": a.status,
                "last_seen_at": a.last_seen_at.isoformat() if a.last_seen_at else None,
                "created_at": a.created_at.isoformat(),
            }
            for a in agents
        ]
    }

