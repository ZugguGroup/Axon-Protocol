from pydantic import BaseModel, Field
from datetime import datetime
import uuid

class LockAcquireRequest(BaseModel):
    resource_id: str = Field(..., min_length=1, max_length=500)
    timeout: int = Field(default=300, ge=1, le=3600)
    metadata: dict = {}

class LockAcquireResponse(BaseModel):
    lock_id: str
    resource_id: str
    expires_at: str

class LockStatusResponse(BaseModel):
    locked: bool
    resource_id: str
    holder_agent_id: str | None = None
    locked_at: datetime | None = None
    expires_at: datetime | None = None
