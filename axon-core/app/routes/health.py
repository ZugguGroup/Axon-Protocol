from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.database import get_db
from app.services.pubsub import get_redis
from app.services.embedding import get_model

from app.config import settings

router = APIRouter(prefix="/v1", tags=["health"])

@router.get("/health")
async def health():
    return {"status": "ok", "service": "axon"}

@router.get("/health/ready")
async def readiness(db: AsyncSession = Depends(get_db)):
    checks = {}
    
    try:
        await db.execute(text("SELECT 1"))
        checks["database"] = "ok"
    except Exception as e:
        checks["database"] = f"error: {str(e)}"
    
    if settings.AXON_MODE == "local":
        checks["redis"] = "ok"
    else:
        try:
            r = await get_redis()
            await r.ping()
            checks["redis"] = "ok"
        except Exception as e:
            checks["redis"] = f"error: {str(e)}"
    
    try:
        get_model()
        checks["embedding_model"] = "ok"
    except Exception as e:
        checks["embedding_model"] = f"error: {str(e)}"
    
    all_ok = all(v == "ok" for v in checks.values())
    return {"status": "ready" if all_ok else "degraded", "checks": checks}
