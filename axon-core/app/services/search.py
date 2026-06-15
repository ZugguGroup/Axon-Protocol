import json
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from app.models.memory import Memory
from app.config import settings

_chroma_client = None

def get_chroma_client():
    global _chroma_client
    if _chroma_client is None:
        import chromadb
        _chroma_client = chromadb.PersistentClient(path=settings.CHROMA_PATH)
    return _chroma_client

def get_chroma_collection():
    client = get_chroma_client()
    return client.get_or_create_collection("axon_memories")

async def semantic_search(
    db: AsyncSession,
    query_embedding: list[float],
    project_id: str,
    scope: str = None,
    limit: int = 10,
    min_similarity: float = 0.5,
) -> list[dict]:
    if settings.AXON_MODE == "local":
        try:
            collection = get_chroma_collection()
            
            # Construct Chroma metadata filter
            where_clause = {"project_id": str(project_id)}
            if scope:
                where_clause["scope"] = scope
                
            results = collection.query(
                query_embeddings=[[float(x) for x in query_embedding]],
                n_results=limit,
                where=where_clause
            )
            
            formatted_results = []
            if results and results.get("ids") and len(results["ids"]) > 0:
                ids = results["ids"][0]
                documents = results["documents"][0]
                metadatas = results["metadatas"][0]
                # ChromaDB returns cosine distance: distance = 1 - similarity
                # similarity = 1 - distance
                distances = results["distances"][0] if results.get("distances") else [0.0] * len(ids)
                
                for i in range(len(ids)):
                    similarity = 1.0 - float(distances[i])
                    if similarity >= min_similarity:
                        meta = metadatas[i] or {}
                        tags_json = meta.get("tags_json", "{}")
                        try:
                            tags = json.loads(tags_json)
                        except Exception:
                            tags = {}
                            
                        formatted_results.append({
                            "id": ids[i],
                            "content": documents[i],
                            "tags": tags,
                            "scope": meta.get("scope", "project"),
                            "agent_id": meta.get("agent_id", ""),
                            "created_at": meta.get("created_at", datetime.now().isoformat()),
                            "similarity": round(similarity, 4),
                        })
            
            # Sort by similarity descending
            formatted_results.sort(key=lambda x: x["similarity"], reverse=True)
            return formatted_results[:limit]
        except Exception as e:
            print(f"Error in ChromaDB semantic search: {e}")
            return []

    # pgvector cosine distance operator <=> (lower = more similar)
    # Similarity = 1 - cosine_distance
    
    embedding_str = "[" + ",".join(str(x) for x in query_embedding) + "]"
    
    scope_filter = ""
    if scope:
        scope_filter = f"AND m.scope = '{scope}'"
    
    # Subquery format to avoid PostgreSQL 'HAVING' without 'GROUP BY' syntax errors
    query = text(f"""
        SELECT * FROM (
            SELECT 
                m.id,
                m.content,
                m.tags,
                m.scope,
                m.agent_id,
                m.created_at,
                1 - (m.embedding <=> '{embedding_str}'::vector) AS similarity
            FROM memories m
            WHERE m.project_id = :project_id
            {scope_filter}
            AND (m.expires_at IS NULL OR m.expires_at > NOW())
        ) sub
        WHERE sub.similarity >= :min_similarity
        ORDER BY sub.similarity DESC
        LIMIT :limit
    """)
    
    result = await db.execute(
        query,
        {"project_id": project_id, "min_similarity": min_similarity, "limit": limit}
    )
    
    rows = result.fetchall()
    return [
        {
            "id": str(row.id),
            "content": row.content,
            "tags": row.tags,
            "scope": row.scope,
            "agent_id": str(row.agent_id),
            "created_at": row.created_at.isoformat(),
            "similarity": round(float(row.similarity), 4),
        }
        for row in rows
    ]
