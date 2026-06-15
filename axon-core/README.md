# Axon Protocol Core Server (`axon-core`)

> Open-source infrastructure for persistent memory, lock coordination, and tamper-proof reasoning receipts in multi-agent AI systems.

Axon is a standalone FastAPI backend server. Agents interact with it via HTTP and WebSocket to store semantic memories, acquire resource locks, and log reasoning receipts.

---

## Technical Stack
- **Framework**: FastAPI (Python 3.12+)
- **Database**: PostgreSQL with `pgvector` extension (for vector similarity search)
- **Cache / PubSub**: Redis (for lock auto-expiry and WebSocket real-time events)
- **Embedding Model**: `all-MiniLM-L6-v2` (384-dimensional dense vectors, running locally on CPU)

---

## Local Development Setup

### 1. Prerequisites (Native Windows Installs)

Since Docker is not running on this environment, you need to install Postgres and Redis directly on Windows:

#### A. PostgreSQL 16 (with pgvector)
1. Download the installer from [PostgreSQL Windows Downloads](https://www.postgresql.org/download/windows/) and run it.
2. During installation, set the default password for the `postgres` user to `axon` (or configure it in your `.env` file).
3. Open **pgAdmin** or **psql** and create two databases:
   ```sql
   CREATE DATABASE axon;
   CREATE DATABASE axon_test;
   ```
4. Create a user `axon` and grant it access:
   ```sql
   CREATE USER axon WITH PASSWORD 'axon';
   GRANT ALL PRIVILEGES ON DATABASE axon TO axon;
   GRANT ALL PRIVILEGES ON DATABASE axon_test TO axon;
   ```
5. Ensure pgvector extension is loaded. On startup, Axon will automatically run `CREATE EXTENSION IF NOT EXISTS vector;` on both databases.

#### B. Redis
1. For Windows, download the Redis-compatible server **Memurai** (Community Edition) from [Memurai.com](https://www.memurai.com/).
2. Alternatively, install Redis via Chocolatey:
   ```powershell
   choco install redis-64
   ```
3. Start the Redis service so it listens on the default port `6379`.

---

### 2. Python Environment & Installation

1. Navigate to the project root:
   ```powershell
   cd e:\Axon\axon-core
   ```
2. Create and activate virtual environment:
   ```powershell
   python -m venv venv
   .\venv\Scripts\activate
   ```
3. Install dependencies:
   ```powershell
   pip install -r requirements.txt
   ```

---

### 3. Run Migrations

Alembic handles the schema creation dynamically. Apply the initial migration:
```powershell
.\venv\Scripts\alembic upgrade head
```

---

### 4. Running the Server

Start the FastAPI application in reload mode:
```powershell
.\venv\Scripts\uvicorn app.main:app --reload
```
The server will start at `http://127.0.0.1:8000`. 
- Interactive API documentation will be available at `http://127.0.0.1:8000/docs`
- Redoc documentation will be available at `http://127.0.0.1:8000/redoc`

---

## Verifying the Setup (Running Tests)

To verify the installation, ensure your PostgreSQL and Redis services are running, then execute `pytest`:
```powershell
.\venv\Scripts\pytest -v
```

This will run the test suite against the `axon_test` database and ensure all 13 endpoints function correctly.

---

## API Endpoints Overview

### Health & Operations
- `GET /v1/health` - Check backend server availability.

### Agent Registry
- `POST /v1/agents/register` - Registers a new agent. Required header: `X-Master-Key` matching `MASTER_KEY` in `.env`. Returns a secure `api_key` and JWT token.
- `GET /v1/agents/me` - Read profile info for currently authenticated agent.

### Persistent Memory
- `POST /v1/memory/store` - Compute embedding and store content.
- `POST /v1/memory/search` - Perform pgvector similarity search, with optional tag (JSONB) filter and scope checks.
- `DELETE /v1/memory/{memory_id}` - Remove memory.

### Lock Coordination
- `POST /v1/lock/acquire` - Request exclusive lock on a resource with auto-expiry.
- `POST /v1/lock/release` - Unlock a resource (only owner can unlock).
- `GET /v1/lock/status/{resource_id}` - Inspect lock details. Auto-sweeps if expired.

### Cryptographic Receipts
- `POST /v1/receipts/create` - Log chained reasoning steps, input, and outputs. Generates signed SHA-256 HMAC signature.
- `GET /v1/receipts/{receipt_id}` - View full receipt data.
- `POST /v1/receipts/verify` - Check cryptographic integrity of logged reasoning.

### Real-Time Bus
- `WS /v1/events/{project_id}` - Real-time WebSocket feed emitting lock and memory actions. Requires query params `token` or `api_key`.
