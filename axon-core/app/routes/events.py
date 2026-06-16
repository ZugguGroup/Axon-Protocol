import json
import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, Header
from app.services.pubsub import get_pubsub
from app.models.project import Project
from sqlalchemy import select
from app.middleware.auth import verify_api_key
from app.database import AsyncSessionLocal

router = APIRouter(tags=["events"])

@router.websocket("/v1/events/{project_id}")
async def events_websocket(
    websocket: WebSocket, 
    project_id: str,
    token: str | None = Query(None),
    x_api_key: str | None = Header(None, alias="X-API-Key")
):
    # WS token check
    auth_token = token or x_api_key
    if not auth_token:
        await websocket.close(code=1008, reason="Missing authentication token")
        return
        
    # Verify the API key against the database
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Project))
        projects = result.scalars().all()
        is_valid = False
        for p in projects:
            if str(p.id) == project_id and verify_api_key(auth_token, p.api_key_hash):
                is_valid = True
                break
                
        if not is_valid:
            await websocket.close(code=1008, reason="Invalid authentication token")
            return

    await websocket.accept()
    pubsub = await get_pubsub(project_id)
    
    try:
        await websocket.send_json({"type": "connected", "project_id": project_id})
        
        async def heartbeat():
            while True:
                await asyncio.sleep(30)
                try:
                    await websocket.send_json({"type": "ping"})
                except:
                    break
        
        heartbeat_task = asyncio.create_task(heartbeat())
        
        async for message in pubsub.listen():
            if message["type"] == "message":
                data = json.loads(message["data"])
                await websocket.send_json(data)
                
    except WebSocketDisconnect:
        pass
    finally:
        heartbeat_task.cancel()
        await pubsub.unsubscribe()
        await pubsub.close()
