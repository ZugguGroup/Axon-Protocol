from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid
from app.database import get_db
from app.models.project import Project
from app.models.user import User
from app.schemas.auth import ProjectCreateRequest, ProjectInfo
from app.middleware.auth import get_current_user, generate_api_key, hash_api_key

router = APIRouter(prefix="/v1/projects", tags=["projects"])

@router.post("", response_model=ProjectInfo)
async def create_project(
    request: ProjectCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Enforce project limit check for Free users in endpoint (Pro gets unlimited/10)
    # Check current project count
    result = await db.execute(select(Project).where(Project.owner_id == current_user.id))
    projects = result.scalars().all()
    
    # Load user's subscription
    from app.models.subscription import Subscription
    sub_result = await db.execute(select(Subscription).where(Subscription.user_id == current_user.id))
    sub = sub_result.scalar_one_or_none()
    
    plan = sub.plan if sub else "free"
    limit = 1 if plan == "free" else 10
    
    if len(projects) >= limit:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"Project limit reached for your plan ({plan}). Upgrade to Pro for more projects."
        )

    raw_api_key = generate_api_key()
    
    project = Project(
        name=request.name,
        owner_id=current_user.id,
        api_key_hash=hash_api_key(raw_api_key)
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)
    
    return ProjectInfo(
        id=project.id,
        name=project.name,
        api_key=raw_api_key,
        created_at=project.created_at
    )

@router.get("", response_model=list[ProjectInfo])
async def list_projects(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Project)
        .where(Project.owner_id == current_user.id)
        .order_by(Project.created_at.desc())
    )
    projects = result.scalars().all()
    return projects

@router.post("/{project_id}/rotate-key", response_model=ProjectInfo)
async def rotate_project_key(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.owner_id == current_user.id
        )
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    raw_api_key = generate_api_key()
    project.api_key_hash = hash_api_key(raw_api_key)
    
    await db.commit()
    await db.refresh(project)
    
    return ProjectInfo(
        id=project.id,
        name=project.name,
        api_key=raw_api_key,
        created_at=project.created_at
    )

@router.delete("/{project_id}")
async def delete_project(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.owner_id == current_user.id
        )
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    await db.delete(project)
    await db.commit()
    return {"deleted": True, "id": str(project_id)}
