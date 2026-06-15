import uuid
import json
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException
from app.config import settings
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.agent import Agent
from app.models.memory import Memory
from app.schemas.memory import (
    MemoryStoreRequest, MemoryStoreResponse,
    MemorySearchRequest, MemorySearchResponse, MemoryItem
)
from app.middleware.auth import get_current_agent
from app.middleware.billing import check_memory_limit
from app.services.embedding import encode
from app.services.search import semantic_search

router = APIRouter(prefix="/v1/memory", tags=["memory"])

@router.post("/store", response_model=MemoryStoreResponse)
async def store_memory(
    request: MemoryStoreRequest,
    current_agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
    _: None = Depends(check_memory_limit),
):
    embedding = encode(request.content)
    
    expires_at = None
    if request.ttl:
        expires_at = (datetime.now(timezone.utc) + timedelta(seconds=request.ttl)).replace(tzinfo=None)
    
    memory = Memory(
        agent_id=current_agent.id,
        project_id=current_agent.project_id,
        org_id=current_agent.org_id,
        content=request.content,
        embedding=embedding,
        tags=request.tags,
        scope=request.scope,
        ttl=request.ttl,
        expires_at=expires_at,
    )
    db.add(memory)
    await db.commit()
    await db.refresh(memory)
    
    # Store in ChromaDB in local mode
    if settings.AXON_MODE == "local":
        try:
            from app.services.search import get_chroma_collection
            collection = get_chroma_collection()
            metadata = {
                "project_id": str(memory.project_id),
                "scope": memory.scope or "project",
                "agent_id": str(memory.agent_id),
                "tags_json": json.dumps(memory.tags or {}),
                "created_at": memory.created_at.isoformat() if memory.created_at else datetime.now().isoformat(),
            }
            collection.add(
                ids=[str(memory.id)],
                embeddings=[[float(x) for x in embedding]],
                documents=[memory.content],
                metadatas=[metadata]
            )
        except Exception as e:
            print(f"Warning: Failed to add memory to ChromaDB: {e}")
            
    return MemoryStoreResponse(id=memory.id, created_at=memory.created_at)

@router.post("/search", response_model=MemorySearchResponse)
async def search_memories(
    request: MemorySearchRequest,
    current_agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    query_embedding = encode(request.query)
    
    results = await semantic_search(
        db=db,
        query_embedding=query_embedding,
        project_id=current_agent.project_id,
        scope=request.scope,
        limit=request.limit,
        min_similarity=request.min_similarity,
    )
    
    return MemorySearchResponse(
        results=results,
        query=request.query,
        total_found=len(results),
    )

@router.get("/list")
async def list_memories(
    limit: int = 50,
    current_agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Memory)
        .where(Memory.project_id == current_agent.project_id)
        .order_by(Memory.created_at.desc())
        .limit(limit)
    )
    memories = result.scalars().all()
    return {
        "memories": [
            {
                "id": str(m.id),
                "content": m.content,
                "tags": m.tags,
                "scope": m.scope,
                "agent_id": str(m.agent_id),
                "created_at": m.created_at.isoformat(),
            }
            for m in memories
        ],
        "total": len(memories)
    }

@router.get("/{memory_id}", response_model=MemoryItem)
async def get_memory(
    memory_id: uuid.UUID,
    current_agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Memory).where(
            Memory.id == memory_id,
            Memory.project_id == current_agent.project_id,
        )
    )
    memory = result.scalar_one_or_none()
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")
    return memory

@router.delete("/{memory_id}")
async def delete_memory(
    memory_id: uuid.UUID,
    current_agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Memory).where(
            Memory.id == memory_id,
            Memory.project_id == current_agent.project_id,
        )
    )
    memory = result.scalar_one_or_none()
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")
    await db.delete(memory)
    await db.commit()
    
    # Delete from ChromaDB in local mode
    if settings.AXON_MODE == "local":
        try:
            from app.services.search import get_chroma_collection
            collection = get_chroma_collection()
            collection.delete(ids=[str(memory_id)])
        except Exception as e:
            print(f"Warning: Failed to delete memory from ChromaDB: {e}")
            
    return {"deleted": True, "id": str(memory_id)}
