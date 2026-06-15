import pytest
from httpx import AsyncClient
from app.config import settings

@pytest.mark.asyncio
async def test_register_agent_success(client: AsyncClient):
    response = await client.post(
        "/v1/agents/register",
        json={
            "name": "Test Builder Agent",
            "project_id": "test-project",
            "org_id": "test-org",
            "capabilities": ["code", "reasoning"]
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert data["name"] == "Test Builder Agent"
    assert data["project_id"] == "test-project"
    assert "api_key" in data
    assert data["api_key"].startswith("axon-")
    assert "token" in data
    assert "created_at" in data

@pytest.mark.asyncio
async def test_get_me_unauthorized(client: AsyncClient):
    response = await client.get("/v1/agents/me")
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_get_me_with_api_key(client: AsyncClient):
    # Register first
    import uuid
    project_id = str(uuid.uuid4())
    reg = await client.post(
        "/v1/agents/register",
        json={"name": "API Key Agent", "project_id": project_id}
    )
    assert reg.status_code == 200
    reg_data = reg.json()
    api_key = reg_data["api_key"]
    agent_id = reg_data["id"]

    # Call me with X-API-Key and X-Agent-ID
    response = await client.get(
        "/v1/agents/me",
        headers={"X-API-Key": api_key, "X-Agent-ID": agent_id}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "API Key Agent"
    assert data["project_id"] == project_id

@pytest.mark.asyncio
async def test_get_me_with_jwt_token(client: AsyncClient):
    # Register first
    import uuid
    project_id = str(uuid.uuid4())
    reg = await client.post(
        "/v1/agents/register",
        json={"name": "JWT Agent", "project_id": project_id}
    )
    assert reg.status_code == 200
    reg_data = reg.json()
    token = reg_data["token"]

    # Call me with Bearer token
    response = await client.get(
        "/v1/agents/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "JWT Agent"
    assert data["project_id"] == project_id
