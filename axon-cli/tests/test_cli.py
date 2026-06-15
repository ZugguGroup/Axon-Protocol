import os
import json
import pytest
from unittest.mock import patch, MagicMock
from click.testing import CliRunner
from axon_cli.main import cli
from axon_cli.config import CONFIG_FILENAME

@pytest.fixture
def runner():
    return CliRunner()

@pytest.fixture
def clean_config():
    # Ensure config file doesn't exist before test
    if os.path.exists(CONFIG_FILENAME):
        os.remove(CONFIG_FILENAME)
    yield
    if os.path.exists(CONFIG_FILENAME):
        os.remove(CONFIG_FILENAME)

@pytest.fixture
def configured_env():
    # Write a valid .axon config file before test
    with open(CONFIG_FILENAME, "w", encoding="utf-8") as f:
        json.dump({
            "base_url": "http://localhost:8000",
            "api_key": "test-api-key-123",
            "project_id": "test-project-abc"
        }, f)
    yield
    if os.path.exists(CONFIG_FILENAME):
        os.remove(CONFIG_FILENAME)

def test_init_command(runner, clean_config):
    result = runner.invoke(cli, [
        "init", 
        "--no-interactive", 
        "--base-url", "http://test-server:8000", 
        "--api-key", "test-key-123", 
        "--project-id", "test-project-abc"
    ])
    assert result.exit_code == 0
    assert "saved successfully" in result.output
    
    # Verify file content
    assert os.path.exists(CONFIG_FILENAME)
    with open(CONFIG_FILENAME, "r") as f:
        data = json.load(f)
        assert data["base_url"] == "http://test-server:8000"
        assert data["api_key"] == "test-key-123"
        assert data["project_id"] == "test-project-abc"

@patch("httpx.Client.request")
def test_doctor_command(mock_request, runner):
    # Mock ready endpoint response
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "status": "ready",
        "checks": {
            "database": "ok",
            "redis": "ok",
            "embedding_model": "ok"
        }
    }
    mock_request.return_value = mock_response

    result = runner.invoke(cli, ["doctor"])
    assert result.exit_code == 0
    assert "System Health Overview" in result.output
    assert "Database" in result.output
    assert "Redis" in result.output
    assert "Embedding Model" in result.output
    assert "fully operational" in result.output

@patch("httpx.Client.request")
def test_agent_register(mock_request, runner, clean_config):
    # Mock registration endpoint
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "id": "agent-uuid-123",
        "name": "test-agent",
        "project_id": "test-project",
        "api_key": "new-api-key-xyz",
        "token": "jwt-token-header.body.signature",
        "created_at": "2026-06-14T21:00:00Z"
    }
    mock_request.return_value = mock_response

    # Setup pre-existing config with base_url
    with open(CONFIG_FILENAME, "w", encoding="utf-8") as f:
        json.dump({"base_url": "http://localhost:8000", "api_key": "", "project_id": ""}, f)

    result = runner.invoke(cli, ["agent", "register", "test-agent", "--project-id", "test-project"])
    assert result.exit_code == 0
    assert "Agent Registered" in result.output
    assert "new-api-key-xyz" in result.output
    
    # Config file should be updated with new API key and project
    with open(CONFIG_FILENAME, "r") as f:
        data = json.load(f)
        assert data["api_key"] == "new-api-key-xyz"
        assert data["project_id"] == "test-project"

@patch("httpx.Client.request")
def test_agent_me(mock_request, runner, configured_env):
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "id": "agent-123",
        "name": "test-agent",
        "project_id": "test-project",
        "capabilities": ["memory", "planning"],
        "status": "active",
        "last_seen_at": "2026-06-14T21:30:00Z",
        "created_at": "2026-06-14T21:00:00Z"
    }
    mock_request.return_value = mock_response

    result = runner.invoke(cli, ["agent", "me"])
    assert result.exit_code == 0
    assert "Agent Profile" in result.output
    assert "agent-123" in result.output
    assert "memory, planning" in result.output

@patch("httpx.Client.request")
def test_memory_store(mock_request, runner, configured_env):
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "id": "mem-123",
        "created_at": "2026-06-14T21:30:00Z"
    }
    mock_request.return_value = mock_response

    result = runner.invoke(cli, ["memory", "store", "Remember to feed the cat", "-t", "type=chore", "-t", "priority=high"])
    assert result.exit_code == 0
    assert "Memory stored successfully" in result.output
    assert "mem-123" in result.output
    
    # Check JSON payload built correctly
    args, kwargs = mock_request.call_args
    assert kwargs["json"]["content"] == "Remember to feed the cat"
    assert kwargs["json"]["tags"] == {"type": "chore", "priority": "high"}

@patch("httpx.Client.request")
def test_memory_search(mock_request, runner, configured_env):
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "query": "cat",
        "total_found": 1,
        "results": [
            {
                "id": "mem-123",
                "content": "Remember to feed the cat",
                "tags": {"type": "chore"},
                "scope": "project",
                "agent_id": "agent-123",
                "similarity": 0.895,
                "created_at": "2026-06-14T21:30:00Z"
            }
        ]
    }
    mock_request.return_value = mock_response

    result = runner.invoke(cli, ["memory", "search", "cat"])
    assert result.exit_code == 0
    assert "Search Results for 'cat'" in result.output
    assert "0.8950" in result.output
    assert "Remember" in result.output and "feed" in result.output and "cat" in result.output

@patch("httpx.Client.request")
def test_lock_acquire(mock_request, runner, configured_env):
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "lock_id": "lock-uuid-789",
        "resource_id": "shared-resource",
        "expires_at": "2026-06-14T22:00:00Z"
    }
    mock_request.return_value = mock_response

    result = runner.invoke(cli, ["lock", "acquire", "shared-resource", "--timeout", "120"])
    assert result.exit_code == 0
    assert "Lock Acquired" in result.output
    assert "lock-uuid-789" in result.output
    assert "shared-resource" in result.output

@patch("httpx.Client.request")
def test_receipt_verify(mock_request, runner, configured_env):
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "receipt_id": "rec-123",
        "valid": True,
        "chain_hash": "abc123chainhash",
        "recomputed_hash": "abc123chainhash",
        "message": "Receipt is valid and untampered"
    }
    mock_request.return_value = mock_response

    result = runner.invoke(cli, ["receipt", "verify", "rec-123"])
    assert result.exit_code == 0
    assert "Verification Result" in result.output
    assert "VALID & UNTAMPERED" in result.output
    assert "Receipt integrity verified" in result.output

@patch("httpx.Client.request")
def test_message_send(mock_request, runner, configured_env):
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "message_id": "msg-123",
        "status": "sent",
        "created_at": "2026-06-14T21:30:00Z"
    }
    mock_request.return_value = mock_response

    result = runner.invoke(cli, ["message", "send", "recipient-agent-123", "Hello there"])
    assert result.exit_code == 0
    assert "Message sent successfully" in result.output
    assert "msg-123" in result.output

    # Check payload built correctly
    args, kwargs = mock_request.call_args
    assert kwargs["json"]["recipient_id"] == "recipient-agent-123"
    assert kwargs["json"]["payload"] == {"text": "Hello there"}

@patch("httpx.Client.request")
def test_message_inbox(mock_request, runner, configured_env):
    from axon_cli.display import console
    original_width = console.width
    console.width = 150
    try:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "messages": [
                {
                    "id": "msg-123",
                    "sender_id": "sender-agent-123",
                    "recipient_id": "me",
                    "project_id": "project-abc",
                    "topic": "alerts",
                    "payload": {"text": "System Alert"},
                    "status": "sent",
                    "created_at": "2026-06-14T21:30:00Z"
                }
            ]
        }
        mock_request.return_value = mock_response

        result = runner.invoke(cli, ["message", "inbox", "--topic", "alerts"])
        assert result.exit_code == 0
        assert "Agent Inbox" in result.output
        assert "sender-agent-123" in result.output
        assert "System Alert" in result.output
    finally:
        console.width = original_width

@patch("httpx.Client.request")
def test_message_ack(mock_request, runner, configured_env):
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "acknowledged": True,
        "message_id": "msg-123"
    }
    mock_request.return_value = mock_response

    result = runner.invoke(cli, ["message", "ack", "msg-123"])
    assert result.exit_code == 0
    assert "Message msg-123 acknowledged successfully" in result.output

