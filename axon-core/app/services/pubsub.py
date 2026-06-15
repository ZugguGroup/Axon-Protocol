import json
import uuid
import socket
import urllib.parse
import asyncio
from datetime import datetime, timezone
from typing import Dict, Set
import redis.asyncio as aioredis
from app.config import settings

# In-memory pub/sub implementation for local mode
class MemoryPubSub:
    def __init__(self, manager: 'MemoryPubSubManager', project_id: str):
        self.manager = manager
        self.project_id = project_id
        self.queue = asyncio.Queue()
        
    async def listen(self):
        while True:
            msg = await self.queue.get()
            yield {"type": "message", "data": msg}
            self.queue.task_done()
            
    async def unsubscribe(self):
        self.manager.unsubscribe(self.project_id, self)
        
    async def close(self):
        pass

class MemoryPubSubManager:
    def __init__(self):
        self.subscribers: Dict[str, Set[MemoryPubSub]] = {}
        
    def subscribe(self, project_id: str) -> MemoryPubSub:
        ps = MemoryPubSub(self, project_id)
        if project_id not in self.subscribers:
            self.subscribers[project_id] = set()
        self.subscribers[project_id].add(ps)
        return ps
        
    def unsubscribe(self, project_id: str, ps: MemoryPubSub):
        if project_id in self.subscribers:
            self.subscribers[project_id].discard(ps)
            if not self.subscribers[project_id]:
                del self.subscribers[project_id]
                
    async def publish(self, project_id: str, message: str):
        if project_id in self.subscribers:
            for ps in list(self.subscribers[project_id]):
                await ps.queue.put(message)

memory_pubsub_manager = MemoryPubSubManager()

_redis: aioredis.Redis | None = None
_redis_available: bool | None = None

async def is_redis_available() -> bool:
    global _redis_available
    if settings.AXON_MODE == "local":
        return True
        
    if _redis_available is not None:
        return _redis_available
        
    try:
        parsed = urllib.parse.urlparse(settings.REDIS_URL)
        host = parsed.hostname or "localhost"
        port = parsed.port or 6379
        # Quick TCP ping
        with socket.create_connection((host, port), timeout=0.5):
            _redis_available = True
    except Exception:
        _redis_available = False
        print(f"Warning: Redis is not available at {settings.REDIS_URL}. Real-time PubSub is disabled.")
        
    return _redis_available

async def get_redis() -> aioredis.Redis:
    global _redis
    if settings.AXON_MODE == "local":
        raise RuntimeError("Redis is disabled in local mode")
        
    if _redis is None:
        _redis = aioredis.from_url(
            settings.REDIS_URL,
            decode_responses=True,
            socket_connect_timeout=1.0,
            socket_timeout=1.0
        )
    return _redis

async def publish(project_id: str, event_type: str, payload: dict, agent_id: str = None):
    event = {
        "event_id": str(uuid.uuid4()),
        "event_type": event_type,
        "project_id": str(project_id),
        "agent_id": str(agent_id) if agent_id else None,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "data": payload,
    }
    
    if settings.AXON_MODE == "local":
        await memory_pubsub_manager.publish(str(project_id), json.dumps(event))
        return
        
    if not await is_redis_available():
        return
    try:
        r = await get_redis()
        channel = f"axon:{project_id}"
        await r.publish(channel, json.dumps(event))
    except Exception as e:
        print(f"Warning: Failed to publish event to Redis: {e}")

async def get_pubsub(project_id: str):
    if settings.AXON_MODE == "local":
        return memory_pubsub_manager.subscribe(project_id)
        
    if not await is_redis_available():
        return None
    r = await get_redis()
    pubsub = r.pubsub()
    await pubsub.subscribe(f"axon:{project_id}")
    return pubsub
