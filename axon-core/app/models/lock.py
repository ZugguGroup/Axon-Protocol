import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, JSON, UniqueConstraint, ForeignKey, func, Uuid as UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

class Lock(Base):
    __tablename__ = "locks"
    
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    resource_id: Mapped[str] = mapped_column(String(500), nullable=False)
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    agent_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    metadata_: Mapped[dict] = mapped_column("metadata", JSON, default=dict)
    locked_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    
    __table_args__ = (
        UniqueConstraint("resource_id", "project_id", name="uq_lock_resource_project"),
    )
