from axon._base import _BaseClient, _BaseSyncClient
from axon.types import MemoryResult, MemorySearchResponse, StoredMemory


class MemoryClient(_BaseClient):

    async def store(
        self,
        content: str,
        tags: dict = None,
        scope: str = "project",
        ttl: int = None,
    ) -> StoredMemory:
        """
        Store a memory in the Axon server (async).
        """
        body = {"content": content, "scope": scope}
        if tags is not None:
            body["tags"] = tags
        if ttl is not None:
            body["ttl"] = ttl

        data = await self._request("POST", "/v1/memory/store", json=body)
        return StoredMemory(id=data["id"], created_at=data["created_at"])

    async def search(
        self,
        query: str,
        limit: int = 10,
        scope: str = None,
        min_similarity: float = 0.5,
    ) -> MemorySearchResponse:
        """
        Semantically search stored memories (async).
        """
        body = {
            "query": query,
            "limit": limit,
            "min_similarity": min_similarity,
        }
        if scope is not None:
            body["scope"] = scope

        data = await self._request("POST", "/v1/memory/search", json=body)

        results = [
            MemoryResult(
                id=r["id"],
                content=r["content"],
                tags=r.get("tags", {}),
                scope=r["scope"],
                agent_id=r["agent_id"],
                similarity=r["similarity"],
                created_at=r["created_at"],
            )
            for r in data["results"]
        ]

        return MemorySearchResponse(
            results=results,
            query=data["query"],
            total_found=data["total_found"],
        )

    async def get(self, memory_id: str) -> dict:
        """
        Get a specific memory by its ID (async).
        """
        return await self._request("GET", f"/v1/memory/{memory_id}")

    async def forget(self, memory_id: str) -> bool:
        """
        Delete a memory permanently (async).
        """
        data = await self._request("DELETE", f"/v1/memory/{memory_id}")
        return data.get("deleted", False)


class SyncMemoryClient(_BaseSyncClient):

    def store(
        self,
        content: str,
        tags: dict = None,
        scope: str = "project",
        ttl: int = None,
    ) -> StoredMemory:
        """
        Store a memory in the Axon server (sync).
        """
        body = {"content": content, "scope": scope}
        if tags is not None:
            body["tags"] = tags
        if ttl is not None:
            body["ttl"] = ttl

        data = self._request("POST", "/v1/memory/store", json=body)
        return StoredMemory(id=data["id"], created_at=data["created_at"])

    def search(
        self,
        query: str,
        limit: int = 10,
        scope: str = None,
        min_similarity: float = 0.5,
    ) -> MemorySearchResponse:
        """
        Semantically search stored memories (sync).
        """
        body = {
            "query": query,
            "limit": limit,
            "min_similarity": min_similarity,
        }
        if scope is not None:
            body["scope"] = scope

        data = self._request("POST", "/v1/memory/search", json=body)

        results = [
            MemoryResult(
                id=r["id"],
                content=r["content"],
                tags=r.get("tags", {}),
                scope=r["scope"],
                agent_id=r["agent_id"],
                similarity=r["similarity"],
                created_at=r["created_at"],
            )
            for r in data["results"]
        ]

        return MemorySearchResponse(
            results=results,
            query=data["query"],
            total_found=data["total_found"],
        )

    def get(self, memory_id: str) -> dict:
        """
        Get a specific memory by its ID (sync).
        """
        return self._request("GET", f"/v1/memory/{memory_id}")

    def forget(self, memory_id: str) -> bool:
        """
        Delete a memory permanently (sync).
        """
        data = self._request("DELETE", f"/v1/memory/{memory_id}")
        return data.get("deleted", False)
