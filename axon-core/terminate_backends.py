import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

TEST_DATABASE_URL = "postgresql+asyncpg://postgres:8VpcSrnxK7XK_GG@db.tepgtjepsxywwblvbouh.supabase.co:5432/postgres"

async def main():
    engine = create_async_engine(TEST_DATABASE_URL, echo=True)
    async with engine.begin() as conn:
        print("Terminating other database connections...")
        # Terminate other connections except our own
        res = await conn.execute(text(
            "SELECT pg_terminate_backend(pid) FROM pg_stat_activity "
            "WHERE pid <> pg_backend_pid() AND usename = current_user;"
        ))
        rows = res.all()
        print(f"Done. Terminated connections count: {len(rows)}")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
