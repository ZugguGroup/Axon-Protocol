import pytest
from httpx import AsyncClient
from app.config import settings

import uuid

@pytest.fixture
async def auth_headers(client: AsyncClient):
    """Fixture registering a test agent and returning auth header."""
    project_id = f"receipt-test-{uuid.uuid4().hex[:6]}"
    reg = await client.post(
        "/v1/agents/register",
        json={"name": "Receipt Tester Agent", "project_id": project_id}
    )
    assert reg.status_code == 200
    return {
        "X-API-Key": reg.json()["api_key"],
        "X-Agent-ID": reg.json()["id"]
    }

@pytest.mark.asyncio
async def test_receipt_lifecycle_flow(client: AsyncClient, auth_headers: dict):
    # 1. Create receipt
    payload = {
        "input": "Execute code validation test",
        "steps": [
            {"thought": "Inspect directory elements.", "tool_called": "ls", "result": "requirements.txt"},
            {"thought": "Analyze dependencies.", "tool_called": None, "result": None}
        ],
        "output": "Ready to execute code."
    }

    create_resp = await client.post(
        "/v1/receipts/create",
        headers=auth_headers,
        json=payload
    )
    assert create_resp.status_code == 200
    created_data = create_resp.json()
    assert "receipt_id" in created_data
    assert "chain_hash" in created_data
    assert "signature" in created_data

    receipt_id = created_data["receipt_id"]

    # 2. Get receipt details
    get_resp = await client.get(
        f"/v1/receipts/{receipt_id}",
        headers=auth_headers
    )
    assert get_resp.status_code == 200
    get_data = get_resp.json()
    assert get_data["input_text"] == "Execute code validation test"
    assert get_data["output_text"] == "Ready to execute code."
    assert len(get_data["reasoning_steps"]) == 2
    assert get_data["reasoning_steps"][0]["thought"] == "Inspect directory elements."

    # 3. Verify receipt integrity via API
    verify_resp = await client.post(
        f"/v1/receipts/verify?receipt_id={receipt_id}",
        headers=auth_headers
    )
    assert verify_resp.status_code == 200
    verify_data = verify_resp.json()
    assert verify_data["valid"] is True
    assert verify_data["receipt_id"] == receipt_id
    assert verify_data["chain_hash"] == created_data["chain_hash"]
    assert verify_data["recomputed_hash"] == created_data["chain_hash"]
    assert "untampered" in verify_data["message"]

@pytest.mark.asyncio
async def test_verify_non_existent_receipt(client: AsyncClient, auth_headers: dict):
    import uuid
    ghost_id = str(uuid.uuid4())
    response = await client.post(
        f"/v1/receipts/verify?receipt_id={ghost_id}",
        headers=auth_headers
    )
    assert response.status_code == 404
