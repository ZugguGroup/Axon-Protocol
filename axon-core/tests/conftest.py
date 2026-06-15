import pytest
import asyncio
import os
from typing import AsyncGenerator, Generator
from httpx import AsyncClient, ASGITransport
import sqlalchemy as sa
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.main import app
from app.database import Base, get_db

# Import all models to ensure they register on Base.metadata
from app.models import User, Subscription, Project, Agent, Memory, Lock, Receipt, Message

from app.config import settings

if settings.AXON_MODE == "local":
    TEST_DATABASE_URL = "sqlite+aiosqlite:///test_temp.db"
    settings.CHROMA_PATH = "test_chroma_db"
else:
    TEST_DATABASE_URL = "postgresql+asyncpg://postgres:8VpcSrnxK7XK_GG@db.tepgtjepsxywwblvbouh.supabase.co:5432/postgres"

def _enable_sqlite_fks(engine):
    if TEST_DATABASE_URL.startswith("sqlite"):
        @sa.event.listens_for(engine.sync_engine, "connect")
        def set_sqlite_pragma(dbapi_connection, connection_record):
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()

test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
_enable_sqlite_fks(test_engine)
TestSessionLocal = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)

async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    _enable_sqlite_fks(engine)
    SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with SessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
    await engine.dispose()

# Override FastAPI dependency
app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Create and yield a session-scoped event loop."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session", autouse=True)
def cleanup_test_files():
    """Clean up test SQLite database and ChromaDB files at the end of the session."""
    yield
    import shutil
    if settings.AXON_MODE == "local":
        if os.path.exists("test_temp.db"):
            try:
                os.remove("test_temp.db")
            except Exception:
                pass
        if os.path.exists("test_chroma_db"):
            try:
                shutil.rmtree("test_chroma_db")
            except Exception:
                pass

@pytest.fixture(scope="function", autouse=True)
async def setup_test_db():
    """Create pgvector extension and database schema for each test."""
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    _enable_sqlite_fks(engine)
    try:
        async with engine.begin() as conn:
            # Enable pgvector if postgresql
            if not TEST_DATABASE_URL.startswith("sqlite"):
                await conn.execute(sa.text("CREATE EXTENSION IF NOT EXISTS vector"))
            # Recreate all tables
            await conn.run_sync(Base.metadata.drop_all)
            await conn.run_sync(Base.metadata.create_all)
    except Exception as e:
        pytest.exit(
            f"Test database setup failed! Error: {e}"
        )
    yield
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
    except Exception:
        pass
    await engine.dispose()

@pytest.fixture(autouse=True)
def clean_chroma():
    """Clean ChromaDB collection before each test in local mode."""
    if settings.AXON_MODE == "local":
        try:
            import chromadb
            client = chromadb.PersistentClient(path=settings.CHROMA_PATH)
            try:
                client.delete_collection("axon_memories")
            except Exception:
                pass
        except Exception:
            pass
    yield

@pytest.fixture
async def db() -> AsyncGenerator[AsyncSession, None]:
    """Function-scoped database session running inside a transactional rollback block."""
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with SessionLocal() as session:
        transaction = await session.begin()
        try:
            yield session
        finally:
            await transaction.rollback()
            await session.close()
    await engine.dispose()

@pytest.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    """Function-scoped HTTP AsyncClient using ASGI Transport."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
