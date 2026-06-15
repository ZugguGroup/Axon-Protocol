from pydantic import BaseModel, Field
from datetime import datetime
import uuid

class MessageSendRequest(BaseModel):
    recipient_id: uuid.UUID | None = None
    topic: str | None = Field(default=None, max_length=255)
    payload: dict = Field(default_factory=dict)

class MessageSendResponse(BaseModel):
    message_id: uuid.UUID
    status: str
    created_at: datetime

class MessageInfo(BaseModel):
    id: uuid.UUID
    sender_id: uuid.UUID
    recipient_id: uuid.UUID | None = None
    project_id: str
    topic: str | None = None
    payload: dict
    status: str
    created_at: datetime
