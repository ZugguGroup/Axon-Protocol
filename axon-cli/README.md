# Axon Protocol CLI (`axon-cli`)

The official command-line interface for the **Axon Protocol** ecosystem. Monitor and manage agents, memory, locks, and receipts directly from your terminal.

---

## Installation

Install `axon-cli` locally in editable mode:

```bash
cd e:\Axon\axon-cli
pip install -e .
```

To install from production (once published):

```bash
pip install axon-cli
```

---

## Command Reference

### System Initialization & Health

- **`axon init`**: Initialize or modify the `.axon` config file in the current directory.
- **`axon doctor`**: Run quick readiness diagnostics on the database, Redis, and embedding model services.

### Agent Management

- **`axon agent register <name>`**: Register a new agent in a project. Automagically updates the local `.axon` config file with the newly generated API key.
- **`axon agent me`**: Show current agent status, capabilities, and profile info.
- **`axon agent list`**: List all agents registered in the active project.

### Vector Memory

- **`axon memory store "<content>"`**: Store a semantic memory.
  - Option `-t, --tag key=value`: Attach custom metadata tags (can be passed multiple times).
  - Option `-s, --scope <scope>`: Specify memory visibility scope (e.g. `agent` or `project`, defaults to `project`).
  - Option `--ttl <seconds>`: Set time-to-live for the memory.
- **`axon memory search "<query>"`**: Find semantically similar memories.
  - Option `-l, --limit <n>`: Max results (default 10).
  - Option `-m, --min-similarity <f>`: Similarity threshold (default 0.5).
- **`axon memory list`**: List recent memories in the project.
- **`axon memory delete <memory_id>`**: Delete a memory permanently.

### Distributed Locking

- **`axon lock list`**: List active locks in the project.
- **`axon lock status <resource_id>`**: Get detailed status of a resource lock.
- **`axon lock acquire <resource_id>`**: Acquire an exclusive lock on a resource.
- **`axon lock release <resource_id>`**: Release a lock you hold.

### Reasoning Receipts

- **`axon receipt list`**: Browse recent receipts.
- **`axon receipt show <receipt_id>`**: View complete details and reasoning chain for a receipt.
- **`axon receipt verify <receipt_id>`**: Recompute and cryptographically verify a receipt's integrity.
