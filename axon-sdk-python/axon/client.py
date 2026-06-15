import httpx
from axon.memory import MemoryClient, SyncMemoryClient
from axon.coordination import CoordinationClient, SyncCoordinationClient
from axon.receipts import ReceiptsClient, SyncReceiptsClient
from axon.events import EventsClient, SyncEventsClient
from axon.messages import MessagesClient, SyncMessagesClient


class AxonClient:
    """
    Async entry point for the Axon Protocol Python SDK.
    """

    def __init__(
        self,
        api_key: str,
        project_id: str,
        agent_token: str = None,
        agent_id: str = None,
        base_url: str = "http://localhost:8000",
        timeout: float = 30.0,
    ):
        self.api_key = api_key
        self.project_id = project_id
        self.agent_token = agent_token
        self.agent_id = agent_id
        self.base_url = base_url.rstrip("/")

        headers = {}
        if api_key:
            headers["X-API-Key"] = api_key
        if agent_token:
            headers["Authorization"] = f"Bearer {agent_token}"

        self._http = httpx.AsyncClient(
            headers=headers,
            timeout=httpx.Timeout(timeout),
            limits=httpx.Limits(
                max_connections=20,
                max_keepalive_connections=10,
                keepalive_expiry=30,
            ),
        )

        self.memory = MemoryClient(self._http, self.base_url)
        self.lock = CoordinationClient(self._http, self.base_url)
        self.receipts = ReceiptsClient(self._http, self.base_url)
        self.events = EventsClient(self.base_url, api_key, project_id)
        self.messages = MessagesClient(self._http, self.base_url)

    async def ping(self) -> bool:
        """
        Check if the Axon server is reachable (async).
        """
        try:
            response = await self._http.get(f"{self.base_url}/v1/health")
            return response.status_code == 200
        except Exception:
            return False

    async def close(self):
        """Close the underlying HTTP connection pool."""
        await self._http.aclose()

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close()


class AxonSyncClient:
    """
    Sync entry point for the Axon Protocol Python SDK.
    """

    def __init__(
        self,
        api_key: str,
        project_id: str,
        agent_token: str = None,
        agent_id: str = None,
        base_url: str = "http://localhost:8000",
        timeout: float = 30.0,
    ):
        self.api_key = api_key
        self.project_id = project_id
        self.agent_token = agent_token
        self.agent_id = agent_id
        self.base_url = base_url.rstrip("/")

        headers = {}
        if api_key:
            headers["X-API-Key"] = api_key
        if agent_token:
            headers["Authorization"] = f"Bearer {agent_token}"

        self._http = httpx.Client(
            headers=headers,
            timeout=httpx.Timeout(timeout),
            limits=httpx.Limits(
                max_connections=20,
                max_keepalive_connections=10,
                keepalive_expiry=30,
            ),
        )

        self.memory = SyncMemoryClient(self._http, self.base_url)
        self.lock = SyncCoordinationClient(self._http, self.base_url)
        self.receipts = SyncReceiptsClient(self._http, self.base_url)
        self.events = SyncEventsClient(self.base_url, api_key, project_id)
        self.messages = SyncMessagesClient(self._http, self.base_url)

    def ping(self) -> bool:
        """
        Check if the Axon server is reachable (sync).
        """
        try:
            response = self._http.get(f"{self.base_url}/v1/health")
            return response.status_code == 200
        except Exception:
            return False

    def close(self):
        """Close the underlying HTTP connection pool."""
        self._http.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()
