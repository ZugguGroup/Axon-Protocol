import json
import time
import asyncio
from typing import AsyncIterator, Iterator
import websockets
from websockets.sync.client import connect as ws_sync_connect
from axon.exceptions import AxonConnectionError


class EventsClient:
    """
    Connects to the Axon server via WebSocket and streams real-time events (async).
    """

    def __init__(self, base_url: str, api_key: str, project_id: str):
        ws_base = base_url.replace("https://", "wss://").replace("http://", "ws://")
        self._ws_url = ws_base.rstrip("/")
        self._api_key = api_key
        self._project_id = project_id

    async def listen(self, reconnect: bool = True) -> AsyncIterator[dict]:
        url = f"{self._ws_url}/v1/events/{self._project_id}"

        while True:
            try:
                async with websockets.connect(
                    url,
                    additional_headers={"X-API-Key": self._api_key},
                    ping_interval=30,
                    ping_timeout=10,
                ) as ws:
                    async for raw_message in ws:
                        try:
                            event = json.loads(raw_message)

                            # Skip heartbeat pings
                            if event.get("type") == "ping":
                                continue

                            yield event

                        except json.JSONDecodeError:
                            continue

            except websockets.exceptions.ConnectionClosed:
                if not reconnect:
                    return
                await asyncio.sleep(2)

            except Exception as e:
                if not reconnect:
                    raise AxonConnectionError(
                        f"WebSocket connection failed: {str(e)}"
                    )
                await asyncio.sleep(2)

    async def listen_once(self, timeout: float = 10.0) -> dict | None:
        try:
            async with asyncio.timeout(timeout):
                async for event in self.listen(reconnect=False):
                    return event
        except (asyncio.TimeoutError, StopAsyncIteration):
            return None


class SyncEventsClient:
    """
    Connects to the Axon server via WebSocket and streams real-time events (sync).
    """

    def __init__(self, base_url: str, api_key: str, project_id: str):
        ws_base = base_url.replace("https://", "wss://").replace("http://", "ws://")
        self._ws_url = ws_base.rstrip("/")
        self._api_key = api_key
        self._project_id = project_id

    def listen(self, reconnect: bool = True) -> Iterator[dict]:
        url = f"{self._ws_url}/v1/events/{self._project_id}"

        while True:
            try:
                with ws_sync_connect(
                    url,
                    additional_headers={"X-API-Key": self._api_key},
                ) as ws:
                    for raw_message in ws:
                        try:
                            event = json.loads(raw_message)

                            # Skip heartbeat pings
                            if event.get("type") == "ping":
                                continue

                            yield event

                        except json.JSONDecodeError:
                            continue

            except Exception as e:
                if not reconnect:
                    raise AxonConnectionError(
                        f"WebSocket connection failed: {str(e)}"
                    )
                time.sleep(2)

    def listen_once(self, timeout: float = 10.0) -> dict | None:
        iterator = self.listen(reconnect=False)
        start_time = time.time()
        while time.time() - start_time < timeout:
            try:
                return next(iterator)
            except StopIteration:
                return None
            except Exception:
                raise
        return None
