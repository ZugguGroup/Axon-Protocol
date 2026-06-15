import asyncio
import logging
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import init_db
from app.services.embedding import load_model
from app.services.lock_manager import cleanup_expired_locks
from app.database import AsyncSessionLocal

from app.routes import health, agents, memory, coordination, receipts, events, messages, auth, billing, dashboard_projects

logging.basicConfig(level=settings.LOG_LEVEL)
logger = logging.getLogger(__name__)

async def lock_cleanup_task():
    while True:
        await asyncio.sleep(30)
        async with AsyncSessionLocal() as db:
            try:
                await cleanup_expired_locks(db)
            except Exception as e:
                logger.error(f"Error in lock cleanup background task: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting Axon Protocol server...")
    try:
        await init_db()
        logger.info("Database initialized")
    except Exception as e:
        logger.error(f"Failed to initialize database extensions on startup: {e}")
        
    try:
        load_model()
        logger.info("Embedding model loaded")
    except Exception as e:
        logger.error(f"Failed to load embedding model: {e}")
        
    cleanup_task = asyncio.create_task(lock_cleanup_task())
    logger.info("Lock cleanup task started")
    
    logger.info(f"Axon Protocol v{settings.APP_VERSION} is ready")
    
    yield
    
    # Shutdown
    cleanup_task.cancel()
    logger.info("Axon Protocol server shutting down")

app = FastAPI(
    title="Axon Protocol",
    version=settings.APP_VERSION,
    description="Open infrastructure for persistent memory, coordination, and reasoning receipts in multi-agent AI systems",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(agents.router)
app.include_router(memory.router)
app.include_router(coordination.router)
app.include_router(receipts.router)
app.include_router(events.router)
app.include_router(messages.router)
app.include_router(auth.router)
app.include_router(billing.router)
app.include_router(dashboard_projects.router)

# Serve dashboard static files at root (catch-all)
static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")
else:
    @app.get("/")
    async def root():
        return {
            "service": "axon-protocol",
            "version": settings.APP_VERSION,
            "status": "operational",
            "docs": "/docs",
        }
