import pytest
import respx
import httpx
from axon.client import AxonClient

TEST_BASE = "http://localhost:8000"

@pytest.mark.asyncio
@respx.mock
async def test_send_message_returns_status(axon):
    respx.post(f"{TEST_BASE}/v1/messages/send").mock(
        return_value=httpx.Response(200, json={
            "message_id": "msg-abc-123",
            "status": "sent",
            "created_at": "2026-06-14T21:00:00Z"
        })
    )

    result = await axon.messages.send(
        recipient_id="agent-xyz",
        topic="alerts",
        payload={"event": "db_down"}
    )
    
    assert result["message_id"] == "msg-abc-123"
    assert result["status"] == "sent"


@pytest.mark.asyncio
@respx.mock
async def test_get_inbox_returns_messages(axon):
    respx.get(f"{TEST_BASE}/v1/messages/inbox").mock(
        return_value=httpx.Response(200, json={
            "messages": [
                {
                    "id": "msg-1",
                    "sender_id": "agent-1",
                    "recipient_id": "agent-2",
                    "project_id": "proj-1",
                    "topic": "alerts",
                    "payload": {"info": "restarting"},
                    "status": "sent",
                    "created_at": "2026-06-14T21:00:00Z"
                }
            ]
        })
    )

    result = await axon.messages.get_inbox(topic="alerts", limit=10)
    assert len(result) == 1
    assert result[0]["id"] == "msg-1"
    assert result[0]["topic"] == "alerts"


@pytest.mark.asyncio
@respx.mock
async def test_ack_message_updates_status(axon):
    respx.post(f"{TEST_BASE}/v1/messages/ack").mock(
        return_value=httpx.Response(200, json={
            "acknowledged": True,
            "message_id": "msg-1"
        })
    )

    result = await axon.messages.ack(message_id="msg-1")
    assert result is True
