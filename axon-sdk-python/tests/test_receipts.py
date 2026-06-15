import pytest
import respx
import httpx
from axon.types import ReasoningStep, StepsLogger
from axon.exceptions import NotFoundError

TEST_BASE = "http://localhost:8000"

RECEIPT_RESPONSE = {
    "receipt_id": "rec-abc-123",
    "chain_hash": "a1b2c3d4e5f6",
    "signature": "sig-abc123",
    "created_at": "2025-01-01T00:00:00"
}


@pytest.mark.asyncio
@respx.mock
async def test_create_receipt_with_reasoning_step_objects(axon):
    respx.post(f"{TEST_BASE}/v1/receipts/create").mock(
        return_value=httpx.Response(200, json=RECEIPT_RESPONSE)
    )

    receipt = await axon.receipts.create(
        input="Fix the login bug in auth.py",
        steps=[
            ReasoningStep(thought="Read the login function"),
            ReasoningStep(
                thought="Found missing token validation",
                tool_called="read_file",
                result="Null check missing at line 47"
            ),
            ReasoningStep(
                thought="Applied the fix",
                tool_called="write_file",
                result="Added null check"
            ),
        ],
        output="Bug fixed: added null check in auth.py line 47"
    )

    assert receipt.receipt_id == "rec-abc-123"
    assert receipt.chain_hash == "a1b2c3d4e5f6"


@pytest.mark.asyncio
@respx.mock
async def test_create_receipt_with_plain_dicts(axon):
    respx.post(f"{TEST_BASE}/v1/receipts/create").mock(
        return_value=httpx.Response(200, json=RECEIPT_RESPONSE)
    )

    receipt = await axon.receipts.create(
        input="Analyze sales data",
        steps=[
            {"thought": "Loaded the CSV file", "tool_called": "read_csv"},
            {"thought": "Calculated totals", "result": "Q4 revenue: 1.2M"},
        ],
        output="Q4 revenue is 1.2M, up 15% from Q3"
    )

    assert receipt.receipt_id == "rec-abc-123"


@pytest.mark.asyncio
@respx.mock
async def test_verify_receipt_valid(axon):
    respx.post(f"{TEST_BASE}/v1/receipts/verify").mock(
        return_value=httpx.Response(200, json={
            "receipt_id": "rec-abc-123",
            "valid": True,
            "chain_hash": "a1b2c3d4e5f6",
            "recomputed_hash": "a1b2c3d4e5f6",
            "message": "Receipt is valid and untampered"
        })
    )

    result = await axon.receipts.verify("rec-abc-123")
    assert result.valid is True
    assert result.chain_hash == result.recomputed_hash


@pytest.mark.asyncio
@respx.mock
async def test_verify_receipt_tampered(axon):
    respx.post(f"{TEST_BASE}/v1/receipts/verify").mock(
        return_value=httpx.Response(200, json={
            "receipt_id": "rec-abc-123",
            "valid": False,
            "chain_hash": "original-hash",
            "recomputed_hash": "different-hash",
            "message": "Receipt has been tampered with"
        })
    )

    result = await axon.receipts.verify("rec-abc-123")
    assert result.valid is False
    assert result.chain_hash != result.recomputed_hash


@pytest.mark.asyncio
@respx.mock
async def test_track_decorator_creates_receipt(axon):
    respx.post(f"{TEST_BASE}/v1/receipts/create").mock(
        return_value=httpx.Response(200, json=RECEIPT_RESPONSE)
    )

    create_was_called = False
    original_create = axon.receipts.create

    async def track_create(*args, **kwargs):
        nonlocal create_was_called
        create_was_called = True
        return await original_create(*args, **kwargs)

    axon.receipts.create = track_create

    @axon.receipts.track(input_param="task")
    async def agent_function(task: str, steps_logger=None) -> str:
        steps_logger.add(thought="Analyzing the task")
        steps_logger.add(thought="Completed", result="All done")
        return f"Done: {task}"

    result = await agent_function(task="analyze the codebase")
    assert result == "Done: analyze the codebase"
    assert create_was_called is True


@pytest.mark.asyncio
async def test_track_decorator_does_not_fail_if_receipt_fails(axon):
    """Function should still return normally even if receipt creation fails."""

    @axon.receipts.track(input_param="task")
    async def agent_function(task: str, steps_logger=None) -> str:
        steps_logger.add(thought="Did work")
        return "result"

    # Even if server is not running, function should not raise
    result = await agent_function(task="do something")
    assert result == "result"


@pytest.mark.asyncio
async def test_steps_logger_records_steps():
    logger = StepsLogger()

    logger.add(thought="Reading file")
    logger.add(thought="Processing data", tool_called="parse_json", result="3 records found")
    logger.add(thought="Writing output")

    steps = logger.get_steps()
    assert len(steps) == 3
    assert steps[0] == {"thought": "Reading file"}
    assert steps[1]["tool_called"] == "parse_json"
    assert steps[1]["result"] == "3 records found"
    assert steps[2] == {"thought": "Writing output"}


@pytest.mark.asyncio
async def test_steps_logger_get_steps_returns_copy():
    logger = StepsLogger()
    logger.add(thought="Step 1")

    steps = logger.get_steps()
    steps.append({"thought": "Injected step"})

    assert len(logger.get_steps()) == 1
    assert logger.get_steps()[0] == {"thought": "Step 1"}


# Sync Receipt Test
@respx.mock
def test_sync_track_decorator_creates_receipt(axon_sync):
    respx.post(f"{TEST_BASE}/v1/receipts/create").mock(
        return_value=httpx.Response(200, json=RECEIPT_RESPONSE)
    )

    @axon_sync.receipts.track(input_param="task")
    def sync_agent_function(task: str, steps_logger=None) -> str:
        steps_logger.add(thought="Sync steps")
        return f"Done: {task}"

    result = sync_agent_function(task="sync-task")
    assert result == "Done: sync-task"
