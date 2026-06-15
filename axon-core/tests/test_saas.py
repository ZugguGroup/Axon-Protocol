import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
import uuid

from app.models.user import User
from app.models.project import Project
from app.models.subscription import Subscription
from app.models.agent import Agent
from app.models.memory import Memory

@pytest.mark.asyncio
async def test_auth_signup_and_login(client: AsyncClient, db: AsyncSession):
    email = f"test-{uuid.uuid4().hex[:6]}@example.com"
    password = "securepassword123"

    # 1. Signup
    signup_resp = await client.post(
        "/v1/auth/signup",
        json={"email": email, "password": password}
    )
    assert signup_resp.status_code == 200
    signup_data = signup_resp.json()
    assert "token" in signup_data
    assert signup_data["email"] == email
    assert "user_id" in signup_data
    user_id = uuid.UUID(signup_data["user_id"])

    # Verify user and default subscription in DB
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    assert user is not None
    assert user.email == email

    sub_result = await db.execute(select(Subscription).where(Subscription.user_id == user_id))
    sub = sub_result.scalar_one_or_none()
    assert sub is not None
    assert sub.plan == "free"
    assert sub.status == "active"

    # 2. Login
    login_resp = await client.post(
        "/v1/auth/login",
        json={"email": email, "password": password}
    )
    assert login_resp.status_code == 200
    login_data = login_resp.json()
    assert "token" in login_data
    assert login_data["email"] == email

    # 3. Login fail
    login_fail_resp = await client.post(
        "/v1/auth/login",
        json={"email": email, "password": "wrongpassword"}
    )
    assert login_fail_resp.status_code == 401


@pytest.mark.asyncio
async def test_project_crud_and_rotation(client: AsyncClient):
    email = f"proj-{uuid.uuid4().hex[:6]}@example.com"
    signup_resp = await client.post(
        "/v1/auth/signup",
        json={"email": email, "password": "password123"}
    )
    token = signup_resp.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create project
    create_resp = await client.post(
        "/v1/projects",
        headers=headers,
        json={"name": "Alpha Project"}
    )
    assert create_resp.status_code == 200
    proj_data = create_resp.json()
    assert proj_data["name"] == "Alpha Project"
    assert "api_key" in proj_data
    assert proj_data["api_key"].startswith("axon-")
    proj_id = proj_data["id"]

    # 2. List projects
    list_resp = await client.get("/v1/projects", headers=headers)
    assert list_resp.status_code == 200
    proj_list = list_resp.json()
    assert len(proj_list) == 1
    assert proj_list[0]["id"] == proj_id
    assert proj_list[0]["api_key"] is None # Hidden in listing

    # 3. Rotate key
    rotate_resp = await client.post(
        f"/v1/projects/{proj_id}/rotate-key",
        headers=headers
    )
    assert rotate_resp.status_code == 200
    rotate_data = rotate_resp.json()
    assert rotate_data["id"] == proj_id
    assert rotate_data["api_key"] is not None
    assert rotate_data["api_key"] != proj_data["api_key"]


@pytest.mark.asyncio
async def test_database_cascades(client: AsyncClient, db: AsyncSession):
    email = f"cascade-{uuid.uuid4().hex[:6]}@example.com"
    signup_resp = await client.post(
        "/v1/auth/signup",
        json={"email": email, "password": "password123"}
    )
    user_id = uuid.UUID(signup_resp.json()["user_id"])
    token = signup_resp.json()["token"]
    
    # Create project
    await client.post(
        "/v1/projects",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "Cascade Proj"}
    )

    # Fetch records
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one()
    
    # Delete User
    await db.delete(user)
    await db.flush()

    # Verify cascade deleted subscription and projects
    sub_res = await db.execute(select(Subscription).where(Subscription.user_id == user_id))
    assert sub_res.scalar_one_or_none() is None

    proj_res = await db.execute(select(Project).where(Project.owner_id == user_id))
    assert proj_res.scalar_one_or_none() is None


@pytest.mark.asyncio
async def test_quota_limits(client: AsyncClient, db: AsyncSession):
    email = f"limits-{uuid.uuid4().hex[:6]}@example.com"
    signup_resp = await client.post(
        "/v1/auth/signup",
        json={"email": email, "password": "password123"}
    )
    user_id = uuid.UUID(signup_resp.json()["user_id"])
    token = signup_resp.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create first project (allowed on free plan)
    p1 = await client.post("/v1/projects", headers=headers, json={"name": "Proj 1"})
    assert p1.status_code == 200
    p1_data = p1.json()
    p1_key = p1_data["api_key"]
    p1_id = p1_data["id"]

    # 2. Attempt second project (blocked on free plan - max 1 project)
    p2 = await client.post("/v1/projects", headers=headers, json={"name": "Proj 2"})
    assert p2.status_code == 402
    assert "Project limit reached" in p2.json()["detail"]

    # 3. Test Agent limits (free plan: max 3 agents)
    a1 = await client.post("/v1/agents/register", headers={"X-API-Key": p1_key}, json={"name": "A1", "project_id": p1_id})
    a2 = await client.post("/v1/agents/register", headers={"X-API-Key": p1_key}, json={"name": "A2", "project_id": p1_id})
    a3 = await client.post("/v1/agents/register", headers={"X-API-Key": p1_key}, json={"name": "A3", "project_id": p1_id})
    assert a1.status_code == 200
    assert a2.status_code == 200
    assert a3.status_code == 200
    
    a4 = await client.post("/v1/agents/register", headers={"X-API-Key": p1_key}, json={"name": "A4", "project_id": p1_id})
    assert a4.status_code == 402
    assert "Agent registration limit reached" in a4.json()["detail"]


@pytest.mark.asyncio
async def test_billing_webhook(client: AsyncClient):
    email = f"webhook-{uuid.uuid4().hex[:6]}@example.com"
    signup_resp = await client.post(
        "/v1/auth/signup",
        json={"email": email, "password": "password123"}
    )
    user_id = signup_resp.json()["user_id"]

    # Trigger mock webhook upgrade
    webhook_resp = await client.post(
        "/v1/billing/webhook",
        json={"type": "subscription.updated", "user_id": user_id}
    )
    assert webhook_resp.status_code == 200

    # Verify plan upgraded to pro using a fresh DB session
    try:
        from conftest import TEST_DATABASE_URL
    except ImportError:
        from tests.conftest import TEST_DATABASE_URL
    from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession as AS
    engine = create_async_engine(
        TEST_DATABASE_URL,
        echo=False
    )
    SessionLocal = async_sessionmaker(engine, class_=AS, expire_on_commit=False)
    async with SessionLocal() as fresh_db:
        result = await fresh_db.execute(select(Subscription).where(Subscription.user_id == uuid.UUID(user_id)))
        sub = result.scalar_one()
        assert sub.plan == "pro"
        assert sub.status == "active"
    await engine.dispose()

    # Trigger mock webhook cancel/downgrade
    webhook_cancel = await client.post(
        "/v1/billing/webhook",
        json={"type": "subscription.deleted", "user_id": user_id}
    )
    assert webhook_cancel.status_code == 200

    # Verify plan downgraded back to free
    engine2 = create_async_engine(
        TEST_DATABASE_URL,
        echo=False
    )
    SessionLocal2 = async_sessionmaker(engine2, class_=AS, expire_on_commit=False)
    async with SessionLocal2() as fresh_db2:
        result2 = await fresh_db2.execute(select(Subscription).where(Subscription.user_id == uuid.UUID(user_id)))
        sub2 = result2.scalar_one()
        assert sub2.plan == "free"
        assert sub2.status == "canceled"
    await engine2.dispose()

