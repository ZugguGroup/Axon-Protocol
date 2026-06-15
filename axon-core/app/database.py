from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import text, event
from app.config import settings

# Create engine conditionally depending on database URL type
if settings.DATABASE_URL.startswith("sqlite"):
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=False,
    )
    
    # Enable SQLite foreign key constraints
    @event.listens_for(engine.sync_engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()
else:
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=False,
        pool_size=10,
        max_overflow=20,
    )

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

async def init_db():
    import uuid
    from sqlalchemy import select
    
    if settings.DATABASE_URL.startswith("sqlite"):
        # Create all tables natively for SQLite
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            
        # Seed default project if it doesn't exist
        async with AsyncSessionLocal() as session:
            # We import here to avoid circular imports (since models import Base)
            from app.models.user import User
            from app.models.project import Project
            from app.models.subscription import Subscription
            from app.middleware.auth import hash_api_key, hash_password
            
            result = await session.execute(select(User))
            user = result.scalars().first()
            if not user:
                # Create default local user
                user = User(
                    email="local@axon.dev",
                    password_hash=hash_password("password123")
                )
                session.add(user)
                await session.flush()
                
                # Create default Pro subscription for local mode
                sub = Subscription(
                    user_id=user.id,
                    plan="pro",
                    status="active"
                )
                session.add(sub)
                
                # Create default project with fixed ID and easy key
                dev_key = "axon-local-dev-key-384729"
                project = Project(
                    id=uuid.UUID("00000000-0000-0000-0000-000000000000"),
                    name="Default Project",
                    owner_id=user.id,
                    api_key_hash=hash_api_key(dev_key)
                )
                session.add(project)
                await session.commit()
                print("\n" + "="*60)
                print("AXON LOCAL MODE STARTED")
                print("Default Project ID: 00000000-0000-0000-0000-000000000000")
                print("Default API Key:    axon-local-dev-key-384729")
                print("="*60 + "\n")
    else:
        async with engine.begin() as conn:
            # Enable pgvector extension
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            await conn.commit()
