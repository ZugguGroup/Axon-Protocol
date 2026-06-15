from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
from app.database import get_db
from app.models.agent import Agent
from app.models.lock import Lock
from app.schemas.lock import LockAcquireRequest, LockAcquireResponse, LockStatusResponse
from app.middleware.auth import get_current_agent
from app.middleware.billing import check_lock_rate_limit
from app.services.lock_manager import acquire_lock, release_lock
from app.services.pubsub import publish

router = APIRouter(prefix="/v1/lock", tags=["coordination"])

@router.post("/acquire", response_model=LockAcquireResponse)
async def acquire(
    request: LockAcquireRequest,
    current_agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
    _: None = Depends(check_lock_rate_limit),
):
    result = await acquire_lock(
        db=db,
        resource_id=request.resource_id,
        project_id=current_agent.project_id,
        agent_id=current_agent.id,
        timeout=request.timeout,
        metadata=request.metadata,
    )
    
    if result is None:
        raise HTTPException(
            status_code=409,
            detail=f"Resource '{request.resource_id}' is already locked by another agent",
        )
    
    await publish(
        project_id=current_agent.project_id,
        event_type="lock.acquired",
        payload={"resource_id": request.resource_id, **result},
        agent_id=str(current_agent.id),
    )
    
    return LockAcquireResponse(**result)

@router.post("/release")
async def release(
    resource_id: str,
    current_agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    try:
        released = await release_lock(
            db=db,
            resource_id=resource_id,
            project_id=current_agent.project_id,
            agent_id=current_agent.id,
        )
    except PermissionError:
        raise HTTPException(status_code=403, detail="You do not own this lock")
    
    if not released:
        raise HTTPException(status_code=404, detail="Lock not found")
    
    await publish(
        project_id=current_agent.project_id,
        event_type="lock.released",
        payload={"resource_id": resource_id},
        agent_id=str(current_agent.id),
    )
    
    return {"released": True, "resource_id": resource_id}

@router.get("/status/{resource_id:path}", response_model=LockStatusResponse)
async def lock_status(
    resource_id: str,
    current_agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Lock).where(
            Lock.resource_id == resource_id,
            Lock.project_id == current_agent.project_id,
        )
    )
    lock = result.scalar_one_or_none()
    
    if not lock:
        return LockStatusResponse(locked=False, resource_id=resource_id)
    
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    lock_expires = lock.expires_at
    if lock_expires.tzinfo is not None:
        lock_expires = lock_expires.replace(tzinfo=None)
        
    if lock_expires < now:
        return LockStatusResponse(locked=False, resource_id=resource_id)
    
    return LockStatusResponse(
        locked=True,
        resource_id=resource_id,
        holder_agent_id=str(lock.agent_id),
        locked_at=lock.locked_at,
        expires_at=lock.expires_at,
    )

@router.get("/list")
async def list_locks(
    current_agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    result = await db.execute(
        select(Lock).where(
            Lock.project_id == current_agent.project_id,
            Lock.expires_at > now,
        )
    )
    locks = result.scalars().all()
    return {
        "locks": [
            {
                "id": str(l.id),
                "resource_id": l.resource_id,
                "agent_id": str(l.agent_id),
                "locked_at": l.locked_at.isoformat(),
                "expires_at": l.expires_at.isoformat(),
            }
            for l in locks
        ]
    }
