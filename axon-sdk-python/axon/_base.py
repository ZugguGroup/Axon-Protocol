import httpx
import time
import asyncio
from axon.exceptions import (
    AuthError,
    NotFoundError,
    AxonPermissionError,
    LockConflictError,
    RateLimitError,
    ServerError,
    AxonConnectionError,
)


class _BaseClient:
    def __init__(self, http: httpx.AsyncClient, base_url: str):
        self._http = http
        self._base_url = base_url.rstrip("/")

    async def _request(self, method: str, path: str, **kwargs) -> dict:
        url = f"{self._base_url}{path}"
        retries = 3
        backoff = 0.5

        for attempt in range(retries):
            try:
                response = await self._http.request(method, url, **kwargs)
                if response.status_code >= 500 and attempt < retries - 1:
                    await asyncio.sleep(backoff * (2 ** attempt))
                    continue
                break
            except httpx.ConnectError:
                if attempt == retries - 1:
                    raise AxonConnectionError(
                        f"Cannot connect to Axon server at {self._base_url}. "
                        f"Make sure the server is running."
                    )
                await asyncio.sleep(backoff * (2 ** attempt))
            except httpx.TimeoutException:
                if attempt == retries - 1:
                    raise AxonConnectionError(
                        f"Request to {url} timed out. Server may be overloaded."
                    )
                await asyncio.sleep(backoff * (2 ** attempt))

        # Success
        if response.status_code == 200:
            return response.json()

        # Parse error detail from response body
        try:
            detail = response.json().get("detail", response.text)
        except Exception:
            detail = response.text

        # Map status codes to specific exceptions
        if response.status_code == 401:
            raise AuthError(f"Authentication failed: {detail}", 401)
        elif response.status_code == 403:
            raise AxonPermissionError(f"Permission denied: {detail}", 403)
        elif response.status_code == 404:
            raise NotFoundError(f"Not found: {detail}", 404)
        elif response.status_code == 409:
            raise LockConflictError("", detail=detail)
        elif response.status_code == 429:
            retry_after = int(response.headers.get("Retry-After", 60))
            raise RateLimitError(retry_after)
        elif response.status_code >= 500:
            raise ServerError(
                f"Server error ({response.status_code}): {detail}",
                response.status_code,
            )
        else:
            raise ServerError(
                f"Unexpected status {response.status_code}: {detail}",
                response.status_code,
            )


class _BaseSyncClient:
    def __init__(self, http: httpx.Client, base_url: str):
        self._http = http
        self._base_url = base_url.rstrip("/")

    def _request(self, method: str, path: str, **kwargs) -> dict:
        url = f"{self._base_url}{path}"
        retries = 3
        backoff = 0.5

        for attempt in range(retries):
            try:
                response = self._http.request(method, url, **kwargs)
                if response.status_code >= 500 and attempt < retries - 1:
                    time.sleep(backoff * (2 ** attempt))
                    continue
                break
            except httpx.ConnectError:
                if attempt == retries - 1:
                    raise AxonConnectionError(
                        f"Cannot connect to Axon server at {self._base_url}. "
                        f"Make sure the server is running."
                    )
                time.sleep(backoff * (2 ** attempt))
            except httpx.TimeoutException:
                if attempt == retries - 1:
                    raise AxonConnectionError(
                        f"Request to {url} timed out. Server may be overloaded."
                    )
                time.sleep(backoff * (2 ** attempt))

        # Success
        if response.status_code == 200:
            return response.json()

        # Parse error detail from response body
        try:
            detail = response.json().get("detail", response.text)
        except Exception:
            detail = response.text

        # Map status codes to specific exceptions
        if response.status_code == 401:
            raise AuthError(f"Authentication failed: {detail}", 401)
        elif response.status_code == 403:
            raise AxonPermissionError(f"Permission denied: {detail}", 403)
        elif response.status_code == 404:
            raise NotFoundError(f"Not found: {detail}", 404)
        elif response.status_code == 409:
            raise LockConflictError("", detail=detail)
        elif response.status_code == 429:
            retry_after = int(response.headers.get("Retry-After", 60))
            raise RateLimitError(retry_after)
        elif response.status_code >= 500:
            raise ServerError(
                f"Server error ({response.status_code}): {detail}",
                response.status_code,
            )
        else:
            raise ServerError(
                f"Unexpected status {response.status_code}: {detail}",
                response.status_code,
            )
