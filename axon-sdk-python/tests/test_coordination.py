import pytest
import respx
import httpx
from axon.exceptions import LockConflictError, AxonPermissionError

TEST_BASE = "http://localhost:8000"

LOCK_RESPONSE = {
    "lock_id": "lock-abc-123",
    "resource_id": "file:main.py",
    "expires_at": "2025-01-01T01:00:00"
}

RELEASE_RESPONSE = {
    "released": True,
    "resource_id": "file:main.py"
}


@pytest.mark.asyncio
@respx.mock
async def test_acquire_lock_returns_lock_info(axon):
    respx.post(f"{TEST_BASE}/v1/lock/acquire").mock(
        return_value=httpx.Response(200, json=LOCK_RESPONSE)
    )

    lock = await axon.lock.acquire("file:main.py", timeout=300)
    assert lock.lock_id == "lock-abc-123"
    assert lock.resource_id == "file:main.py"


@pytest.mark.asyncio
@respx.mock
async def test_acquire_already_locked_raises_conflict(axon):
    respx.post(f"{TEST_BASE}/v1/lock/acquire").mock(
        return_value=httpx.Response(409, json={
            "detail": "Resource 'file:main.py' is locked by another agent"
        })
    )

    with pytest.raises(LockConflictError) as exc_info:
        await axon.lock.acquire("file:main.py")

    assert exc_info.value.status_code == 409


@pytest.mark.asyncio
@respx.mock
async def test_release_lock(axon):
    respx.post(f"{TEST_BASE}/v1/lock/release").mock(
        return_value=httpx.Response(200, json=RELEASE_RESPONSE)
    )

    result = await axon.lock.release("file:main.py")
    assert result is True


@pytest.mark.asyncio
@respx.mock
async def test_release_lock_not_owned_raises_permission_error(axon):
    respx.post(f"{TEST_BASE}/v1/lock/release").mock(
        return_value=httpx.Response(403, json={"detail": "You do not own this lock"})
    )

    with pytest.raises(AxonPermissionError):
        await axon.lock.release("file:main.py")


@pytest.mark.asyncio
@respx.mock
async def test_lock_status_when_locked(axon):
    respx.get(f"{TEST_BASE}/v1/lock/status/file:main.py").mock(
        return_value=httpx.Response(200, json={
            "locked": True,
            "resource_id": "file:main.py",
            "holder_agent_id": "agent-xyz",
            "locked_at": "2025-01-01T00:00:00",
            "expires_at": "2025-01-01T00:05:00"
        })
    )

    status = await axon.lock.status("file:main.py")
    assert status.locked is True
    assert status.holder_agent_id == "agent-xyz"


@pytest.mark.asyncio
@respx.mock
async def test_lock_status_when_free(axon):
    respx.get(f"{TEST_BASE}/v1/lock/status/file:free.py").mock(
        return_value=httpx.Response(200, json={
            "locked": False,
            "resource_id": "file:free.py"
        })
    )

    status = await axon.lock.status("file:free.py")
    assert status.locked is False
    assert status.holder_agent_id is None


@pytest.mark.asyncio
@respx.mock
async def test_hold_context_manager_acquires_and_releases(axon):
    acquire_mock = respx.post(f"{TEST_BASE}/v1/lock/acquire").mock(
        return_value=httpx.Response(200, json=LOCK_RESPONSE)
    )
    release_mock = respx.post(f"{TEST_BASE}/v1/lock/release").mock(
        return_value=httpx.Response(200, json=RELEASE_RESPONSE)
    )

    async with axon.lock("file:main.py") as lock_info:
        assert lock_info.lock_id == "lock-abc-123"

    assert acquire_mock.called
    assert release_mock.called


@pytest.mark.asyncio
@respx.mock
async def test_hold_releases_lock_even_when_exception_occurs(axon):
    respx.post(f"{TEST_BASE}/v1/lock/acquire").mock(
        return_value=httpx.Response(200, json=LOCK_RESPONSE)
    )
    release_mock = respx.post(f"{TEST_BASE}/v1/lock/release").mock(
        return_value=httpx.Response(200, json=RELEASE_RESPONSE)
    )

    with pytest.raises(RuntimeError):
        async with axon.lock("file:main.py"):
            raise RuntimeError("Agent crashed mid-task")

    # Lock should still be released even though an exception was raised
    assert release_mock.called


# Sync Lock Context Manager Test
@respx.mock
def test_sync_hold_context_manager(axon_sync):
    acquire_mock = respx.post(f"{TEST_BASE}/v1/lock/acquire").mock(
        return_value=httpx.Response(200, json=LOCK_RESPONSE)
    )
    release_mock = respx.post(f"{TEST_BASE}/v1/lock/release").mock(
        return_value=httpx.Response(200, json=RELEASE_RESPONSE)
    )

    with axon_sync.lock("file:main.py") as lock_info:
        assert lock_info.lock_id == "lock-abc-123"

    assert acquire_mock.called
    assert release_mock.called
