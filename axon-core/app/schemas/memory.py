from pydantic import BaseModel, Field
from datetime import datetime
import uuid

class MemoryStoreRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=10000)
    tags: dict = {}
    scope: str = "project"  # private / project / org
    ttl: int | None = None  # seconds, None = forever

class MemoryStoreResponse(BaseModel):
    id: uuid.UUID
    created_at: datetime

class MemorySearchRequest(BaseModel):
    query: str = Field(..., min_length=1)
    limit: int = Field(default=10, ge=1, le=50)
    scope: str | None = None
    min_similarity: float = Field(default=0.5, ge=0.0, le=1.0)

class MemorySearchResult(BaseModel):
    id: str
    content: str
    tags: dict
    scope: str
    agent_id: str
    similarity: float
    created_at: str

class MemorySearchResponse(BaseModel):
    results: list[MemorySearchResult]
    query: str
    total_found: int

class MemoryItem(BaseModel):
    id: uuid.UUID
    content: str
    tags: dict
    scope: str
    agent_id: uuid.UUID
    created_at: datetime
