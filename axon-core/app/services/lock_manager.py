import uuid
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.exc import IntegrityError
from app.models.lock import Lock
from app.config import settings

async def acquire_lock(
    db: AsyncSession,
    resource_id: str,
    project_id: str,
    agent_id: uuid.UUID,
    timeout: int = None,
    metadata: dict = None,
) -> dict | None:
    timeout = timeout or settings.DEFAULT_LOCK_TIMEOUT
    # Use timezone-naive UTC datetime
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    expires_at = now + timedelta(seconds=timeout)
    
    # Check if lock already exists and is valid
    result = await db.execute(
        select(Lock).where(
            Lock.resource_id == resource_id,
            Lock.project_id == project_id,
        )
    )
    existing = result.scalar_one_or_none()
    
    if existing:
        # Check if expired
        existing_expires = existing.expires_at
        if existing_expires.tzinfo is not None:
            existing_expires = existing_expires.replace(tzinfo=None)
            
        if existing_expires > now:
            return None  # Lock is active, cannot acquire
        else:
            # Lock expired, delete and proceed
            await db.delete(existing)
            await db.commit()
    
    # Create new lock
    lock = Lock(
        resource_id=resource_id,
        project_id=project_id,
        agent_id=agent_id,
        metadata_=metadata or {},
        expires_at=expires_at,
    )
    
    try:
        db.add(lock)
        await db.commit()
        await db.refresh(lock)
        return {
            "lock_id": str(lock.id),
            "resource_id": lock.resource_id,
            "expires_at": lock.expires_at.isoformat(),
        }
    except IntegrityError:
        await db.rollback()
        return None  # Race condition — another agent acquired it
 
async def release_lock(
    db: AsyncSession,
    resource_id: str,
    project_id: str,
    agent_id: uuid.UUID,
) -> bool:
    result = await db.execute(
        select(Lock).where(
            Lock.resource_id == resource_id,
            Lock.project_id == project_id,
        )
    )
    lock = result.scalar_one_or_none()
    
    if not lock:
        return False  # Lock does not exist
    
    if lock.agent_id != agent_id:
        raise PermissionError("Agent does not own this lock")
    
    await db.delete(lock)
    await db.commit()
    return True
 
async def cleanup_expired_locks(db: AsyncSession):
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    await db.execute(
        delete(Lock).where(Lock.expires_at < now)
    )
    await db.commit()
