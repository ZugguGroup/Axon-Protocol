from pydantic import BaseModel
from datetime import datetime
import uuid

class ReasoningStep(BaseModel):
    thought: str
    tool_called: str | None = None
    result: str | None = None

class ReceiptCreateRequest(BaseModel):
    input: str
    steps: list[ReasoningStep]
    output: str
    parent_receipt_id: uuid.UUID | None = None

class ReceiptCreateResponse(BaseModel):
    receipt_id: uuid.UUID
    chain_hash: str
    signature: str
    created_at: datetime

class ReceiptFullResponse(BaseModel):
    id: uuid.UUID
    agent_id: uuid.UUID
    project_id: uuid.UUID
    input_text: str
    input_hash: str
    reasoning_steps: list[dict]
    steps_hash: str
    output_text: str
    output_hash: str
    chain_hash: str
    signature: str
    parent_receipt_id: uuid.UUID | None
    created_at: datetime

class ReceiptVerifyResponse(BaseModel):
    receipt_id: str
    valid: bool
    chain_hash: str
    recomputed_hash: str
    message: str
