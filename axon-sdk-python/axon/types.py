from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any


@dataclass
class MemoryResult:
    id: str
    content: str
    tags: Dict[str, Any]
    scope: str
    agent_id: str
    similarity: float
    created_at: str


@dataclass
class MemorySearchResponse:
    results: List[MemoryResult]
    query: str
    total_found: int


@dataclass
class StoredMemory:
    id: str
    created_at: str


@dataclass
class LockInfo:
    lock_id: str
    resource_id: str
    expires_at: str


@dataclass
class LockStatus:
    locked: bool
    resource_id: str
    holder_agent_id: Optional[str] = None
    locked_at: Optional[str] = None
    expires_at: Optional[str] = None


@dataclass
class ReasoningStep:
    thought: str
    tool_called: Optional[str] = None
    result: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        d = {"thought": self.thought}
        if self.tool_called is not None:
            d["tool_called"] = self.tool_called
        if self.result is not None:
            d["result"] = self.result
        return d


@dataclass
class StepsLogger:
    """
    Injected into @track decorated functions so they can log reasoning steps.

    Usage inside a tracked function:
        steps_logger.add(thought="Analyzed the file")
        steps_logger.add(thought="Applied fix", tool_called="write_file", result="Done")
    """
    _steps: List[Dict[str, Any]] = field(default_factory=list)

    def add(self, thought: str, tool_called: str = None, result: str = None):
        step = {"thought": thought}
        if tool_called is not None:
            step["tool_called"] = tool_called
        if result is not None:
            step["result"] = result
        self._steps.append(step)

    def get_steps(self) -> List[Dict[str, Any]]:
        return self._steps.copy()


@dataclass
class ReceiptInfo:
    receipt_id: str
    chain_hash: str
    signature: str
    created_at: str


@dataclass
class ReceiptVerifyResult:
    receipt_id: str
    valid: bool
    chain_hash: str
    recomputed_hash: str
    message: str
