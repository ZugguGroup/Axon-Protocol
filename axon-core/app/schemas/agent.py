from pydantic import BaseModel
from datetime import datetime
import uuid

class AgentRegisterRequest(BaseModel):
    name: str
    project_id: str
    org_id: str | None = None
    capabilities: list[str] = []

class AgentRegisterResponse(BaseModel):
    id: uuid.UUID
    name: str
    project_id: str
    api_key: str  # shown only once
    token: str    # JWT for immediate use
    created_at: datetime

class AgentInfo(BaseModel):
    id: uuid.UUID
    name: str
    project_id: str
    capabilities: list[str]
    status: str
    last_seen_at: datetime | None
    created_at: datetime
