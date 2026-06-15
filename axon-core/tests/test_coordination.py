import pytest
from httpx import AsyncClient
from app.config import settings

import uuid

@pytest.fixture
async def agents_same_project(client: AsyncClient):
    """Register two test agents in the same project for lock collision checks."""
    project_id = f"coord-proj-{uuid.uuid4().hex[:6]}"
    reg_a = await client.post(
        "/v1/agents/register",
        json={"name": "Agent Alpha", "project_id": project_id}
    )
    reg_b = await client.post(
        "/v1/agents/register",
        json={"name": "Agent Beta", "project_id": project_id}
    )
    return {
        "agent_a_headers": {
            "X-API-Key": reg_a.json()["api_key"],
            "X-Agent-ID": reg_a.json()["id"]
        },
        "agent_a_id": reg_a.json()["id"],
        "agent_b_headers": {
            "X-API-Key": reg_b.json()["api_key"],
            "X-Agent-ID": reg_b.json()["id"]
        },
        "agent_b_id": reg_b.json()["id"]
    }

@pytest.mark.asyncio
async def test_lock_acquire_conflict_and_release_flow(client: AsyncClient, agents_same_project: dict):
    headers_a = agents_same_project["agent_a_headers"]
    headers_b = agents_same_project["agent_b_headers"]
    agent_a_id = agents_same_project["agent_a_id"]

    resource = "db_migration_lock"

    # 1. Inspect status (should be unlocked)
    status_resp = await client.get(f"/v1/lock/status/{resource}", headers=headers_a)
    assert status_resp.status_code == 200
    assert status_resp.json()["locked"] is False

    # 2. Agent Alpha acquires lock
    acq_resp = await client.post(
        "/v1/lock/acquire",
        headers=headers_a,
        json={"resource_id": resource, "timeout": 120}
    )
    assert acq_resp.status_code == 200
    acq_data = acq_resp.json()
    assert "lock_id" in acq_data
    assert acq_data["resource_id"] == resource

    # 3. Check status is locked by Alpha
    status_resp2 = await client.get(f"/v1/lock/status/{resource}", headers=headers_b)
    assert status_resp2.status_code == 200
    assert status_resp2.json()["locked"] is True
    assert status_resp2.json()["holder_agent_id"] == agent_a_id

    # 4. Agent Beta tries to acquire lock on the same resource (conflict 409)
    acq_resp2 = await client.post(
        "/v1/lock/acquire",
        headers=headers_b,
        json={"resource_id": resource, "timeout": 120}
    )
    assert acq_resp2.status_code == 409

    # 5. Agent Beta tries to release Alpha's lock (fails 403)
    release_fail = await client.post(
        f"/v1/lock/release?resource_id={resource}",
        headers=headers_b
    )
    assert release_fail.status_code == 403

    # 6. Agent Alpha releases the lock (success 200)
    release_ok = await client.post(
        f"/v1/lock/release?resource_id={resource}",
        headers=headers_a
    )
    assert release_ok.status_code == 200

    # 7. Check status is unlocked again
    status_resp3 = await client.get(f"/v1/lock/status/{resource}", headers=headers_b)
    assert status_resp3.json()["locked"] is False

@pytest.mark.asyncio
async def test_release_non_existent_lock(client: AsyncClient, agents_same_project: dict):
    headers_a = agents_same_project["agent_a_headers"]
    response = await client.post(
        "/v1/lock/release?resource_id=ghost_lock",
        headers=headers_a
    )
    assert response.status_code == 404
