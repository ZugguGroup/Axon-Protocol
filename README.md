# Axon Protocol - Multi-Agent AI Infrastructure

> **An open-source orchestration backend, client SDKs, and real-time developer console for building, coordinating, and auditing multi-agent AI fleets.**
> Built by **Zuggu Group**.

---

## Architecture & Project Structure

Axon Protocol follows a hub-and-spoke model. Autonomous agents run locally or in the cloud using our SDKs (the spokes) and coordinate through a central Axon Core API server (the hub), while developers monitor activity via the Axon Dashboard.

```
       ┌────────────────────────────────────────────────────────┐
       │                       YOUR AGENTS                      │
       └─────┬───────────────────────────┬──────────────────────┘
             │ (Python SDK)              │ (JavaScript SDK)
             ▼                           ▼
   ┌───────────────────┐       ┌───────────────────┐
   │  axon-sdk-python  │       │    axon-sdk-js    │
   └─────────┬─────────┘       └─────────┬─────────┘
             │                           │
             └─────────────┬─────────────┘
                           │ (HTTP/WS)
                           ▼
                 ┌───────────────────┐       ┌──────────────────┐
                 │     axon-core     │ ◄────►│  axon-dashboard  │
                 │   (FastAPI Hub)   │       │ (Vite Developer) │
                 └───────────────────┘       └──────────────────┘
```

The monorepo contains the following workspace folders:

| Component | Description | Technologies |
|---|---|---|
| [`axon-core`](file:///e:/Axon/axon-core) | Central orchestration API and database adapter. | FastAPI, SQLAlchemy, PostgreSQL/SQLite, pgvector/ChromaDB |
| [`axon-dashboard`](file:///e:/Axon/axon-dashboard) | Premium web developer console for visualization. | Vite, Vanilla JS & CSS, WebSockets |
| [`axon-sdk-python`](file:///e:/Axon/axon-sdk-python) | Python library for agent interaction. | HTTP client, context managers, async/sync |
| [`axon-sdk-js`](file:///e:/Axon/axon-sdk-js) | TypeScript/JavaScript client library. | Fetch, WebSockets, event handlers |
| [`axon-mcp`](file:///e:/Axon/axon-mcp) | Model Context Protocol server for direct LLM tools. | MCP specification, node / python adapters |
| [`axon-cli`](file:///e:/Axon/axon-cli) | Command-line utility for managing core entities. | Python, Click CLI |

---

## Key Features

1. **Multi-Tenant Projects**: Fully isolated environments, each protected by secure, rotatable Project API Keys.
2. **Shared Semantic Memory**: Server-side vector memory embedding (using SentenceTransformers) and semantic search (via ChromaDB or pgvector) with configurable TTL and scope (Private, Project, or Organization).
3. **Distributed Locks**: High-performance concurrency control to coordinate locks and prevent race conditions when multiple agents interact with shared files or external endpoints.
4. **Cryptographic Chained Receipts**: An auditable ledger of reasoning steps and results. Receipts are cryptographically hashed and chained together to produce an immutable, verifiable execution graph.
5. **Peer-to-Peer Agent Messaging**: Decoupled messaging channels enabling agents to subscribe to topics, send JSON payloads, and exchange coordination cues.
6. **Real-time Event Streaming**: A persistent WebSocket channel broadcasting events (locks, memories, messages, receipts) instantly to the dashboard console.
7. **Deletion Controls**: Capability to delete obsolete agents and projects (along with cascade cleanups) securely from the dashboard.

---

## Getting Started

### 1. Run the Backend (`axon-core`)

By default, the core API runs in `local` mode using SQLite and ChromaDB, requiring no external database services.

```bash
cd axon-core

# Install dependencies (ensure you have virtual env activated)
pip install -r requirements.txt

# Run in development mode (launches FastAPI at http://localhost:8000)
python -m app.cli dev
```

### 2. Run the Developer Console (`axon-dashboard`)

```bash
cd axon-dashboard

# Install packages
npm install

# Run Vite dev server (launches console at http://localhost:5173)
npm run dev
```

### 3. Build & Deploy Production Console Assets
To compile the console and bundle it statically into the core backend:
```bash
cd axon-dashboard
npm run build

# Copy build output to core static directory
Remove-Item -Recurse -Force "../axon-core/app/static/*" -ErrorAction SilentlyContinue
Copy-Item -Recurse "dist/*" "../axon-core/app/static/" -Force
```

---

## SDK Usage Examples

### Python SDK

```python
from axon import AxonClient

# Initialize client with Project API Key and Endpoint
client = AxonClient(api_key="your-project-api-key", base_url="http://localhost:8000")

# Register an agent
agent = client.agents.register("researcher-agent", capabilities=["web-search"])

# Acquire a distributed resource lock
with client.coordination.lock("db-write-resource", timeout_seconds=60):
    # Perform task safely ...
    print("Lock acquired safely!")

# Store a memory
client.memory.store("User preferred output format is markdown.", scope="project")

# Perform semantic search
results = client.memory.search("What is the user preferred format?")
```

### JavaScript/TypeScript SDK

```typescript
import { AxonClient } from '@axon/sdk-js';

const client = new AxonClient({
  apiKey: 'your-project-api-key',
  baseUrl: 'http://localhost:8000'
});

// Register agent
const agent = await client.agents.register('agent-1', ['parsing']);

// Subscribe to real-time events
client.events.subscribe((event) => {
  console.log('Received real-time event:', event);
});
```

---

## Detailed Documentation

Full documentation, including getting started tutorials, architecture details, complete API references, and SDK code templates, is available built-in on the **Documentation Page** within the developer console (accessible publicly at `#/docs`).

---

## License & Corporate Info

Developed and Maintained by the **Zuggu Group**. All rights reserved. 

For inquiries regarding multi-agent orchestration deployments, custom AI agent integrations, or dedicated enterprise support, please reach out to the Zuggu Group engineering division.

