import json
import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.pubsub import get_pubsub

router = APIRouter(tags=["events"])

@router.websocket("/v1/events/{project_id}")
async def events_websocket(websocket: WebSocket, project_id: str):
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
