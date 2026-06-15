from pydantic import BaseModel, EmailStr, Field
import uuid
from datetime import datetime

class UserSignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserAuthResponse(BaseModel):
    token: str
    email: str
    user_id: uuid.UUID

class ProjectCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)

class ProjectInfo(BaseModel):
    id: uuid.UUID
    name: str
    api_key: str | None = None # Only returned on creation/rotation
    created_at: datetime

    class Config:
        from_attributes = True
