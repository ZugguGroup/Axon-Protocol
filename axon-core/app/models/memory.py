import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Text, Integer, JSON, ForeignKey, func, Index, Uuid as UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base
from app.config import settings

# Conditionally select type of vector column
if settings.AXON_MODE == "local":
    VectorType = JSON
else:
    from pgvector.sqlalchemy import Vector
    VectorType = Vector(settings.EMBEDDING_DIM)

class Memory(Base):
    __tablename__ = "memories"
    
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    agent_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    org_id: Mapped[str] = mapped_column(String(100), nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    embedding: Mapped[list] = mapped_column(VectorType, nullable=False)
    tags: Mapped[dict] = mapped_column(JSON, default=dict)
    scope: Mapped[str] = mapped_column(String(20), default="project")  # private / project / org
    ttl: Mapped[int] = mapped_column(Integer, nullable=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )
    
    __table_args__ = (
        Index("ix_memories_project_scope", "project_id", "scope"),
    )
