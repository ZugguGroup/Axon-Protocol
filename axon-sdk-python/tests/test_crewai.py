import pytest
from unittest.mock import MagicMock
from axon.integrations.crewai import AxonMemoryTool, AxonLockTool, AxonReceiptCallbackHandler

def test_crewai_memory_tool():
    mock_client = MagicMock()
    mock_search_res = MagicMock()
    mock_result = MagicMock(content="Peanuts are a legume", similarity=0.95)
    mock_search_res.results = [mock_result]
    mock_client.memory.search.return_value = mock_search_res

    tool = AxonMemoryTool(client=mock_client)
    res = tool._run("allergies")
    
    assert "Peanuts are a legume" in res
    assert "0.950" in res
    mock_client.memory.search.assert_called_once_with(query="allergies")


def test_crewai_lock_tool_acquire():
    mock_client = MagicMock()
    mock_lock_res = MagicMock(lock_id="lock-1", expires_at="2026-06-14")
    mock_client.lock.acquire.return_value = mock_lock_res

    tool = AxonLockTool(client=mock_client)
    res = tool._run("acquire:db_write")
    
    assert "lock-1" in res
    assert "db_write" in res
    mock_client.lock.acquire.assert_called_once_with("db_write")


def test_crewai_lock_tool_release():
    mock_client = MagicMock()
    mock_client.lock.release.return_value = True

    tool = AxonLockTool(client=mock_client)
    res = tool._run("release:db_write")
    
    assert "released successfully" in res
    mock_client.lock.release.assert_called_once_with("db_write")


def test_crewai_callback_handler():
    mock_client = MagicMock()
    mock_client.receipts.create.return_value = MagicMock()

    handler = AxonReceiptCallbackHandler(client=mock_client, input_text="Find weather")
    
    # Simulate events
    handler.on_llm_start({}, ["What is the weather?"])
    handler.on_tool_start({"name": "weather_api"}, "New York")
    handler.on_tool_end("72 degrees")
    
    mock_llm_response = MagicMock()
    mock_generation = MagicMock(text="It is 72 degrees in New York")
    mock_llm_response.generations = [[mock_generation]]
    handler.on_llm_end(mock_llm_response)
    
    handler.on_chain_end({"output": "It is 72 degrees"})

    # Check that client.receipts.create was called
    mock_client.receipts.create.assert_called_once()
    args, kwargs = mock_client.receipts.create.call_args
    assert kwargs["input"] == "Find weather"
    assert "What is the weather?" in kwargs["steps"][0]["thought"]
    assert kwargs["steps"][1]["tool_called"] == "weather_api"
    assert kwargs["steps"][1]["result"] == "72 degrees"
