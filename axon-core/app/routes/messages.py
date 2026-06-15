import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.agent import Agent
from app.models.message import Message
from app.schemas.message import MessageSendRequest, MessageSendResponse, MessageInfo
from app.middleware.auth import get_current_agent
from app.services.pubsub import publish

router = APIRouter(prefix="/v1/messages", tags=["messages"])

@router.post("/send", response_model=MessageSendResponse)
async def send_message(
    request: MessageSendRequest,
    current_agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    recipient_id = request.recipient_id
    if recipient_id:
        # Verify recipient agent exists in the same project
        result = await db.execute(
            select(Agent).where(
                Agent.id == recipient_id,
                Agent.project_id == current_agent.project_id
            )
        )
        recipient = result.scalar_one_or_none()
        if not recipient:
            raise HTTPException(status_code=404, detail="Recipient agent not found in this project")

    # Create and save message
    message = Message(
        sender_id=current_agent.id,
        recipient_id=recipient_id,
        project_id=current_agent.project_id,
        topic=request.topic,
        payload=request.payload,
        status="sent"
    )
    db.add(message)
    await db.commit()
    await db.refresh(message)

    # Publish real-time notification to project event stream
    event_payload = {
        "message_id": str(message.id),
        "sender_id": str(current_agent.id),
        "recipient_id": str(recipient_id) if recipient_id else None,
        "topic": request.topic,
        "payload": request.payload,
        "created_at": message.created_at.isoformat()
    }
    
    await publish(
        project_id=current_agent.project_id,
        event_type="agent.message",
        payload=event_payload,
        agent_id=str(current_agent.id)
    )

    return MessageSendResponse(
        message_id=message.id,
        status=message.status,
        created_at=message.created_at
    )

@router.get("/inbox")
async def get_inbox(
    topic: str | None = None,
    limit: int = 50,
    current_agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db)
):
    # Query messages where current agent is recipient OR the message is matching a topic in the project (if query topic provided or for general project)
    query = select(Message).where(Message.project_id == current_agent.project_id)
    
    if topic:
        query = query.where(Message.topic == topic)
    else:
        # Default inbox view: direct messages to current agent
        query = query.where(Message.recipient_id == current_agent.id)

    query = query.order_by(Message.created_at.desc()).limit(limit)
    result = await db.execute(query)
    messages = result.scalars().all()

    return {
        "messages": [
            {
                "id": str(m.id),
                "sender_id": str(m.sender_id),
                "recipient_id": str(m.recipient_id) if m.recipient_id else None,
                "project_id": m.project_id,
                "topic": m.topic,
                "payload": m.payload,
                "status": m.status,
                "created_at": m.created_at.isoformat()
            }
            for m in messages
        ]
    }

@router.post("/ack")
async def acknowledge_message(
    message_id: uuid.UUID,
    current_agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db)
):
    # Retrieve message
    result = await db.execute(
        select(Message).where(
            Message.id == message_id,
            Message.project_id == current_agent.project_id
        )
    )
    message = result.scalar_one_or_none()
    
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
        
    # Verify agent owns the inbox (recipient or topic subscriber)
    if message.recipient_id and message.recipient_id != current_agent.id:
        raise HTTPException(status_code=403, detail="Not authorized to acknowledge this message")

    message.status = "acknowledged"
    await db.commit()

    # Publish read ack event
    await publish(
        project_id=current_agent.project_id,
        event_type="message.acknowledged",
        payload={"message_id": str(message_id)},
        agent_id=str(current_agent.id)
    )

    return {"acknowledged": True, "message_id": str(message_id)}
