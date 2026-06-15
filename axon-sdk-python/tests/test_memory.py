import pytest
import respx
import httpx
from axon.exceptions import NotFoundError, AuthError

TEST_BASE = "http://localhost:8000"


@pytest.mark.asyncio
@respx.mock
async def test_store_memory_returns_stored_memory(axon):
    respx.post(f"{TEST_BASE}/v1/memory/store").mock(
        return_value=httpx.Response(200, json={
            "id": "mem-abc-123",
            "created_at": "2025-01-01T00:00:00"
        })
    )

    result = await axon.memory.store("Agent learned that Python is faster than Ruby")
    assert result.id == "mem-abc-123"
    assert result.created_at == "2025-01-01T00:00:00"


@pytest.mark.asyncio
@respx.mock
async def test_store_memory_with_tags_and_ttl(axon):
    respx.post(f"{TEST_BASE}/v1/memory/store").mock(
        return_value=httpx.Response(200, json={
            "id": "mem-tagged",
            "created_at": "2025-01-01T00:00:00"
        })
    )

    result = await axon.memory.store(
        "User is allergic to peanuts",
        tags={"category": "health", "priority": "high"},
        scope="private",
        ttl=86400
    )
    assert result.id == "mem-tagged"


@pytest.mark.asyncio
@respx.mock
async def test_search_memory_returns_ranked_results(axon):
    respx.post(f"{TEST_BASE}/v1/memory/search").mock(
        return_value=httpx.Response(200, json={
            "results": [
                {
                    "id": "mem-1",
                    "content": "User prefers dark mode in all applications",
                    "tags": {"category": "ui"},
                    "scope": "project",
                    "agent_id": "agent-xyz",
                    "similarity": 0.92,
                    "created_at": "2025-01-01T00:00:00"
                },
                {
                    "id": "mem-2",
                    "content": "User wants large font size",
                    "tags": {},
                    "scope": "project",
                    "agent_id": "agent-xyz",
                    "similarity": 0.71,
                    "created_at": "2025-01-01T00:00:00"
                }
            ],
            "query": "user interface preferences",
            "total_found": 2
        })
    )

    response = await axon.memory.search("user interface preferences")
    assert response.total_found == 2
    assert response.results[0].similarity == 0.92
    assert response.results[0].content == "User prefers dark mode in all applications"
    assert response.results[1].id == "mem-2"


@pytest.mark.asyncio
@respx.mock
async def test_search_with_min_similarity_filter(axon):
    respx.post(f"{TEST_BASE}/v1/memory/search").mock(
        return_value=httpx.Response(200, json={
            "results": [],
            "query": "unrelated topic",
            "total_found": 0
        })
    )

    response = await axon.memory.search("unrelated topic", min_similarity=0.9)
    assert response.total_found == 0
    assert response.results == []


@pytest.mark.asyncio
@respx.mock
async def test_forget_memory_returns_true(axon):
    respx.delete(f"{TEST_BASE}/v1/memory/mem-to-delete").mock(
        return_value=httpx.Response(200, json={
            "deleted": True,
            "id": "mem-to-delete"
        })
    )

    result = await axon.memory.forget("mem-to-delete")
    assert result is True


@pytest.mark.asyncio
@respx.mock
async def test_get_memory_not_found_raises_error(axon):
    respx.get(f"{TEST_BASE}/v1/memory/nonexistent-id").mock(
        return_value=httpx.Response(404, json={"detail": "Memory not found"})
    )

    with pytest.raises(NotFoundError) as exc_info:
        await axon.memory.get("nonexistent-id")

    assert exc_info.value.status_code == 404


@pytest.mark.asyncio
@respx.mock
async def test_auth_error_on_bad_key(axon):
    respx.post(f"{TEST_BASE}/v1/memory/store").mock(
        return_value=httpx.Response(401, json={"detail": "Invalid credentials"})
    )

    with pytest.raises(AuthError):
        await axon.memory.store("test")


# Sync Test Coverage
@respx.mock
def test_sync_store_memory(axon_sync):
    respx.post(f"{TEST_BASE}/v1/memory/store").mock(
        return_value=httpx.Response(200, json={
            "id": "mem-sync-123",
            "created_at": "2025-01-01T00:00:00"
        })
    )

    result = axon_sync.memory.store("Learn python sync context managers")
    assert result.id == "mem-sync-123"
