from axon._base import _BaseClient, _BaseSyncClient

class MessagesClient(_BaseClient):
    async def send(
        self,
        recipient_id: str = None,
        topic: str = None,
        payload: dict = None,
    ) -> dict:
        """
        Send a direct message or publish to a topic (async).
        """
        body = {}
        if recipient_id is not None:
            body["recipient_id"] = recipient_id
        if topic is not None:
            body["topic"] = topic
        if payload is not None:
            body["payload"] = payload

        return await self._request("POST", "/v1/messages/send", json=body)

    async def get_inbox(self, topic: str = None, limit: int = 50) -> list[dict]:
        """
        Retrieve direct messages or topic updates in the inbox (async).
        """
        params = {"limit": limit}
        if topic is not None:
            params["topic"] = topic
        data = await self._request("GET", "/v1/messages/inbox", params=params)
        return data.get("messages", [])

    async def ack(self, message_id: str) -> bool:
        """
        Acknowledge a received message (async).
        """
        data = await self._request(
            "POST",
            "/v1/messages/ack",
            params={"message_id": message_id}
        )
        return data.get("acknowledged", False)


class SyncMessagesClient(_BaseSyncClient):
    def send(
        self,
        recipient_id: str = None,
        topic: str = None,
        payload: dict = None,
    ) -> dict:
        """
        Send a direct message or publish to a topic (sync).
        """
        body = {}
        if recipient_id is not None:
            body["recipient_id"] = recipient_id
        if topic is not None:
            body["topic"] = topic
        if payload is not None:
            body["payload"] = payload

        return self._request("POST", "/v1/messages/send", json=body)

    def get_inbox(self, topic: str = None, limit: int = 50) -> list[dict]:
        """
        Retrieve direct messages or topic updates in the inbox (sync).
        """
        params = {"limit": limit}
        if topic is not None:
            params["topic"] = topic
        data = self._request("GET", "/v1/messages/inbox", params=params)
        return data.get("messages", [])

    def ack(self, message_id: str) -> bool:
        """
        Acknowledge a received message (sync).
        """
        data = self._request(
            "POST",
            "/v1/messages/ack",
            params={"message_id": message_id}
        )
        return data.get("acknowledged", False)
