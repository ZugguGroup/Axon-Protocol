from unittest.mock import patch
import pytest
from httpx import AsyncClient
from app.config import settings

@pytest.fixture(autouse=True)
def mock_embedding_encode():
    """Mock encoding step to return a static 384-dimensional list to speed up tests."""
    with patch("app.routes.memory.encode") as mock:
        mock.return_value = [0.05] * settings.EMBEDDING_DIM
        yield mock

import uuid

@pytest.fixture
async def auth_headers(client: AsyncClient):
    """Fixture registering a test agent and returning auth header."""
    project_id = f"mem-test-{uuid.uuid4().hex[:6]}"
    reg = await client.post(
        "/v1/agents/register",
        json={"name": "Memory Tester Agent", "project_id": project_id}
    )
    assert reg.status_code == 200
    return {
        "X-API-Key": reg.json()["api_key"],
        "X-Agent-ID": reg.json()["id"]
    }

@pytest.mark.asyncio
async def test_store_memory_success(client: AsyncClient, auth_headers: dict):
    response = await client.post(
        "/v1/memory/store",
        headers=auth_headers,
        json={
            "content": "Storing structural logs is a best practice for receipt validation.",
            "tags": {"relevance": "high"},
            "scope": "project",
            "ttl": 3600
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert "created_at" in data

@pytest.mark.asyncio
async def test_get_and_delete_memory(client: AsyncClient, auth_headers: dict):
    # 1. Store memory
    store = await client.post(
        "/v1/memory/store",
        headers=auth_headers,
        json={"content": "Temporary agent state memory", "scope": "project"}
    )
    assert store.status_code == 200
    memory_id = store.json()["id"]

    # 2. Get memory
    get_resp = await client.get(f"/v1/memory/{memory_id}", headers=auth_headers)
    assert get_resp.status_code == 200
    get_data = get_resp.json()
    assert get_data["content"] == "Temporary agent state memory"
    assert get_data["scope"] == "project"

    # 3. Delete memory
    del_resp = await client.delete(f"/v1/memory/{memory_id}", headers=auth_headers)
    assert del_resp.status_code == 200
    assert del_resp.json() == {"deleted": True, "id": memory_id}

    # 4. Get again (should fail 404)
    get_resp2 = await client.get(f"/v1/memory/{memory_id}", headers=auth_headers)
    assert get_resp2.status_code == 404

@pytest.mark.asyncio
async def test_search_memories(client: AsyncClient, auth_headers: dict):
    # Store memory
    await client.post(
        "/v1/memory/store",
        headers=auth_headers,
        json={"content": "Axon Core runs on standard ports.", "scope": "project"}
    )

    # Search memory
    response = await client.post(
        "/v1/memory/search",
        headers=auth_headers,
        json={
            "query": "Where does Axon run?",
            "limit": 5,
            "min_similarity": 0.1
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    assert len(data["results"]) >= 1
    assert data["results"][0]["content"] == "Axon Core runs on standard ports."
    assert data["results"][0]["similarity"] > 0.0
