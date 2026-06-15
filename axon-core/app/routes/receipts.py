import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.agent import Agent
from app.models.receipt import Receipt
from app.schemas.receipt import (
    ReceiptCreateRequest, ReceiptCreateResponse,
    ReceiptFullResponse, ReceiptVerifyResponse
)
from app.middleware.auth import get_current_agent
from app.services.hashing import hash_text, hash_steps, build_chain, sign_chain, verify_signature

router = APIRouter(prefix="/v1/receipts", tags=["receipts"])

@router.post("/create", response_model=ReceiptCreateResponse)
async def create_receipt(
    request: ReceiptCreateRequest,
    current_agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    input_hash = hash_text(request.input)
    steps_data = [step.model_dump() for step in request.steps]
    steps_hash = hash_steps(steps_data)
    output_hash = hash_text(request.output)
    chain_hash = build_chain(input_hash, steps_hash, output_hash)
    signature = sign_chain(chain_hash)
    
    receipt = Receipt(
        agent_id=current_agent.id,
        project_id=current_agent.project_id,
        org_id=current_agent.org_id,
        input_text=request.input,
        input_hash=input_hash,
        reasoning_steps=steps_data,
        steps_hash=steps_hash,
        output_text=request.output,
        output_hash=output_hash,
        chain_hash=chain_hash,
        signature=signature,
        parent_receipt_id=request.parent_receipt_id,
    )
    db.add(receipt)
    await db.commit()
    await db.refresh(receipt)
    
    return ReceiptCreateResponse(
        receipt_id=receipt.id,
        chain_hash=chain_hash,
        signature=signature,
        created_at=receipt.created_at,
    )

@router.get("/list")
async def list_receipts(
    limit: int = 50,
    current_agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Receipt)
        .where(Receipt.project_id == current_agent.project_id)
        .order_by(Receipt.created_at.desc())
        .limit(limit)
    )
    receipts = result.scalars().all()
    return {
        "receipts": [
            {
                "id": str(r.id),
                "agent_id": str(r.agent_id),
                "input_text": r.input_text[:100],
                "chain_hash": r.chain_hash,
                "signature": r.signature,
                "created_at": r.created_at.isoformat(),
            }
            for r in receipts
        ]
    }

@router.get("/{receipt_id}", response_model=ReceiptFullResponse)
async def get_receipt(
    receipt_id: uuid.UUID,
    current_agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Receipt).where(
            Receipt.id == receipt_id,
            Receipt.project_id == current_agent.project_id,
        )
    )
    receipt = result.scalar_one_or_none()
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    return receipt

@router.post("/verify", response_model=ReceiptVerifyResponse)
async def verify_receipt(
    receipt_id: uuid.UUID,
    current_agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Receipt).where(
            Receipt.id == receipt_id,
            Receipt.project_id == current_agent.project_id,
        )
    )
    receipt = result.scalar_one_or_none()
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    
    # Recompute hashes from stored data
    recomputed_input_hash = hash_text(receipt.input_text)
    recomputed_steps_hash = hash_steps(receipt.reasoning_steps)
    recomputed_output_hash = hash_text(receipt.output_text)
    recomputed_chain = build_chain(recomputed_input_hash, recomputed_steps_hash, recomputed_output_hash)
    
    is_valid = (
        recomputed_chain == receipt.chain_hash
        and verify_signature(receipt.chain_hash, receipt.signature)
    )
    
    return ReceiptVerifyResponse(
        receipt_id=str(receipt_id),
        valid=is_valid,
        chain_hash=receipt.chain_hash,
        recomputed_hash=recomputed_chain,
        message="Receipt is valid and untampered" if is_valid else "Receipt has been tampered with",
    )
