from contextlib import asynccontextmanager, contextmanager
from axon._base import _BaseClient, _BaseSyncClient
from axon.types import LockInfo, LockStatus


class CoordinationClient(_BaseClient):

    async def acquire(
        self,
        resource_id: str,
        timeout: int = 300,
        metadata: dict = None,
    ) -> LockInfo:
        """
        Acquire an exclusive lock on a resource (async).
        """
        body = {"resource_id": resource_id, "timeout": timeout}
        if metadata is not None:
            body["metadata"] = metadata

        data = await self._request("POST", "/v1/lock/acquire", json=body)
        return LockInfo(
            lock_id=data["lock_id"],
            resource_id=data["resource_id"],
            expires_at=data["expires_at"],
        )

    async def release(self, resource_id: str) -> bool:
        """
        Release a lock that you hold (async).
        """
        data = await self._request(
            "POST",
            "/v1/lock/release",
            params={"resource_id": resource_id},
        )
        return data.get("released", False)

    async def status(self, resource_id: str) -> LockStatus:
        """
        Check lock status of a resource (async).
        """
        data = await self._request("GET", f"/v1/lock/status/{resource_id}")
        return LockStatus(
            locked=data["locked"],
            resource_id=data["resource_id"],
            holder_agent_id=data.get("holder_agent_id"),
            locked_at=data.get("locked_at"),
            expires_at=data.get("expires_at"),
        )

    async def list_active(self) -> list[dict]:
        """
        List all active locks in the project (async).
        """
        data = await self._request("GET", "/v1/lock/list")
        return data.get("locks", [])

    @asynccontextmanager
    async def hold(
        self,
        resource_id: str,
        timeout: int = 300,
        metadata: dict = None,
    ):
        """
        Context manager that acquires a lock and automatically releases it on exit (async).
        """
        lock_info = await self.acquire(resource_id, timeout=timeout, metadata=metadata)
        try:
            yield lock_info
        finally:
            try:
                await self.release(resource_id)
            except Exception:
                pass

    def __call__(self, resource_id: str, timeout: int = 300, metadata: dict = None):
        """
        Redirect axon.lock("resource_id") to hold(resource_id)
        """
        return self.hold(resource_id, timeout=timeout, metadata=metadata)


class SyncCoordinationClient(_BaseSyncClient):

    def acquire(
        self,
        resource_id: str,
        timeout: int = 300,
        metadata: dict = None,
    ) -> LockInfo:
        """
        Acquire an exclusive lock on a resource (sync).
        """
        body = {"resource_id": resource_id, "timeout": timeout}
        if metadata is not None:
            body["metadata"] = metadata

        data = self._request("POST", "/v1/lock/acquire", json=body)
        return LockInfo(
            lock_id=data["lock_id"],
            resource_id=data["resource_id"],
            expires_at=data["expires_at"],
        )

    def release(self, resource_id: str) -> bool:
        """
        Release a lock that you hold (sync).
        """
        data = self._request(
            "POST",
            "/v1/lock/release",
            params={"resource_id": resource_id},
        )
        return data.get("released", False)

    def status(self, resource_id: str) -> LockStatus:
        """
        Check lock status of a resource (sync).
        """
        data = self._request("GET", f"/v1/lock/status/{resource_id}")
        return LockStatus(
            locked=data["locked"],
            resource_id=data["resource_id"],
            holder_agent_id=data.get("holder_agent_id"),
            locked_at=data.get("locked_at"),
            expires_at=data.get("expires_at"),
        )

    def list_active(self) -> list[dict]:
        """
        List all active locks in the project (sync).
        """
        data = self._request("GET", "/v1/lock/list")
        return data.get("locks", [])

    @contextmanager
    def hold(
        self,
        resource_id: str,
        timeout: int = 300,
        metadata: dict = None,
    ):
        """
        Context manager that acquires a lock and automatically releases it on exit (sync).
        """
        lock_info = self.acquire(resource_id, timeout=timeout, metadata=metadata)
        try:
            yield lock_info
        finally:
            try:
                self.release(resource_id)
            except Exception:
                pass

    def __call__(self, resource_id: str, timeout: int = 300, metadata: dict = None):
        """
        Redirect axon.lock("resource_id") to hold(resource_id)
        """
        return self.hold(resource_id, timeout=timeout, metadata=metadata)
