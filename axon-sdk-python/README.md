# Axon Protocol — Python SDK (`axon-protocol`)

Official Python client library for integration with the Axon core server. Handles semantic memory, coordination locks, and tamper-proof reasoning receipts for multi-agent AI environments.

---

## Installation

Install the library locally:
```bash
pip install axon-protocol
```

---

## Quickstart

### Async Usage

```python
import asyncio
from axon import AxonClient

async def main():
    async with AxonClient(api_key="axon-...", project_id="my-project") as axon:
        # Store memory
        await axon.memory.store("User prefers dark mode")
        
        # Search memory
        results = await axon.memory.search("ui preferences")
        print(results.results[0].content)

        # Acquire lock
        async with axon.lock("resource_1"):
            print("Lock held!")

asyncio.run(main())
```

### Sync Usage

```python
from axon import AxonSyncClient

with AxonSyncClient(api_key="axon-...", project_id="my-project") as axon:
    # Store memory
    axon.memory.store("User prefers dark mode")
    
    # Search memory
    results = axon.memory.search("ui preferences")
    print(results.results[0].content)

    # Acquire lock
    with axon.lock("resource_1"):
        print("Lock held!")
```

---

## Features

### A. Persistent Memory (Semantic Vector Search)

Store memories and query them with semantic similarity matching:

```python
# Async
memory_id = await axon.memory.store(
    content="The API service key is stored in the vault.",
    tags={"category": "vault"},
    scope="project",
    ttl=3600  # auto-expire in 1 hour
)

results = await axon.memory.search(
    query="Where is the API key?",
    limit=5,
    min_similarity=0.6
)
```

### B. Resource Locking (Mutex)

Prevent race conditions in multi-agent environments. Use the lock context manager to automatically release locks:

```python
# Sync Lock Context Manager
with axon.lock("resource_lock", timeout=60) as lock:
    # Exclusive access section
    print(f"Lock acquired, expires at: {lock.expires_at}")
```

### C. Reasoning Steps Recording

Generate cryptographically chained, signed receipts validating agent reasoning processes:

```python
# Async receipt creation
receipt = await axon.receipts.create(
    input="Fix the login bug in auth.py",
    steps=[
        ReasoningStep(thought="Read the login function"),
        ReasoningStep(
            thought="Found missing token validation",
            tool_called="read_file",
            result="Null check missing at line 47"
        )
    ],
    output="Bug fixed"
)

# Automated decoration
@axon.receipts.track(input_param="task")
async def agent_function(task: str, steps_logger=None) -> str:
    steps_logger.add(thought="Analyzing the task")
    return "Done"
```

### D. Real-Time Events Stream

Listen to event streams (like memory additions or lock releases) happening across your project:

```python
# Async stream
async for event in axon.events.listen():
    print(f"Event Captured: {event['event_type']}")
```
