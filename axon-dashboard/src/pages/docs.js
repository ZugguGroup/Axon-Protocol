import { el, mount } from '../utils/dom.js';
import { register, navigate } from '../router.js';

// ─────────────────────────────────────────────────────────
//  Axon Protocol — Full Documentation Page
// ─────────────────────────────────────────────────────────

const DOC_SECTIONS = [
  { group: 'Getting Started', items: [
    { id: 'introduction', title: 'Introduction' },
    { id: 'quickstart', title: 'Quick Start' },
    { id: 'installation', title: 'Installation' },
    { id: 'configuration', title: 'Configuration' },
  ]},
  { group: 'Core Concepts', items: [
    { id: 'architecture', title: 'Architecture' },
    { id: 'projects', title: 'Projects & Auth' },
    { id: 'agents', title: 'Agents' },
    { id: 'memory', title: 'Semantic Memory' },
    { id: 'locks', title: 'Distributed Locks' },
    { id: 'receipts', title: 'Chained Receipts' },
    { id: 'messages', title: 'Agent Messages' },
    { id: 'events', title: 'Live Events (WS)' },
  ]},
  { group: 'API Reference', items: [
    { id: 'api-health', title: 'Health' },
    { id: 'api-auth', title: 'Auth' },
    { id: 'api-agents', title: 'Agents' },
    { id: 'api-memory', title: 'Memory' },
    { id: 'api-locks', title: 'Coordination' },
    { id: 'api-receipts', title: 'Receipts' },
    { id: 'api-messages', title: 'Messages' },
    { id: 'api-events', title: 'WebSocket' },
  ]},
  { group: 'SDKs', items: [
    { id: 'sdk-python', title: 'Python SDK' },
    { id: 'sdk-javascript', title: 'JavaScript SDK' },
    { id: 'sdk-mcp', title: 'MCP Server' },
  ]},
  { group: 'Integrations', items: [
    { id: 'int-langchain', title: 'LangChain' },
    { id: 'int-crewai', title: 'CrewAI' },
  ]},
  { group: 'Deployment', items: [
    { id: 'deploy-local', title: 'Local Mode' },
    { id: 'deploy-cloud', title: 'Cloud / Production' },
    { id: 'env-vars', title: 'Environment Variables' },
  ]},
];

export function renderDocs() {
  const container = document.getElementById('content');
  container.innerHTML = '';

  // Build sidebar navigation
  const navContent = el('nav', {});
  const sidebarTitle = el('div', { className: 'docs-sidebar-title', textContent: 'Documentation' });
  navContent.appendChild(sidebarTitle);

  // Back to app link
  const backLink = el('a', { className: 'docs-nav-link', style: 'margin-bottom: var(--space-lg); color: var(--text-muted); font-size: 12px;', textContent: '← Back to Dashboard' });
  backLink.addEventListener('click', (e) => {
    e.preventDefault();
    navigate('landing');
  });
  navContent.appendChild(backLink);

  DOC_SECTIONS.forEach(group => {
    const groupEl = el('div', { className: 'docs-nav-group' });
    groupEl.appendChild(el('div', { className: 'docs-nav-group-title', textContent: group.group }));
    group.items.forEach(item => {
      const link = el('a', { className: 'docs-nav-link', textContent: item.title });
      link.setAttribute('data-section', item.id);
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.getElementById(`doc-${item.id}`);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Update active state
        navContent.querySelectorAll('.docs-nav-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      });
      groupEl.appendChild(link);
    });
    navContent.appendChild(groupEl);
  });

  const docsSidebar = el('aside', { className: 'docs-sidebar' }, navContent);

  // Build main docs content
  const docsContent = el('div', { className: 'docs-content' });

  // Hero
  docsContent.appendChild(el('div', { className: 'docs-hero' },
    el('span', { className: 'docs-hero-tag', textContent: 'Axon Protocol v0.1.0' }),
    el('h1', { className: 'docs-hero-title', textContent: 'Documentation' }),
    el('p', { className: 'docs-hero-desc', textContent: 'Complete reference for building, deploying, and integrating multi-agent AI systems with Axon Protocol. From local development to production orchestration.' })
  ));

  // Append all sections
  docsContent.appendChild(buildIntroduction());
  docsContent.appendChild(buildQuickStart());
  docsContent.appendChild(buildInstallation());
  docsContent.appendChild(buildConfiguration());
  docsContent.appendChild(buildArchitecture());
  docsContent.appendChild(buildProjectsAuth());
  docsContent.appendChild(buildAgents());
  docsContent.appendChild(buildMemory());
  docsContent.appendChild(buildLocks());
  docsContent.appendChild(buildReceipts());
  docsContent.appendChild(buildMessages());
  docsContent.appendChild(buildEvents());
  docsContent.appendChild(buildApiHealth());
  docsContent.appendChild(buildApiAuth());
  docsContent.appendChild(buildApiAgents());
  docsContent.appendChild(buildApiMemory());
  docsContent.appendChild(buildApiLocks());
  docsContent.appendChild(buildApiReceipts());
  docsContent.appendChild(buildApiMessages());
  docsContent.appendChild(buildApiEvents());
  docsContent.appendChild(buildSdkPython());
  docsContent.appendChild(buildSdkJavascript());
  docsContent.appendChild(buildSdkMcp());
  docsContent.appendChild(buildIntLangchain());
  docsContent.appendChild(buildIntCrewai());
  docsContent.appendChild(buildDeployLocal());
  docsContent.appendChild(buildDeployCloud());
  docsContent.appendChild(buildEnvVars());

  // Footer
  docsContent.appendChild(el('div', { style: 'text-align: center; padding: var(--space-2xl) 0; color: var(--text-muted); font-size: 12px;' },
    el('span', { textContent: `Axon Protocol Documentation — Built by Zuggu Group — © ${new Date().getFullYear()}` })
  ));

  const layout = el('div', { className: 'docs-layout' }, docsSidebar, docsContent);
  mount(container, layout);

  // Scroll spy: highlight the nav link closest to the viewport
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id.replace('doc-', '');
        navContent.querySelectorAll('.docs-nav-link').forEach(l => {
          l.classList.toggle('active', l.getAttribute('data-section') === id);
        });
      }
    });
  }, { rootMargin: '-20% 0px -70% 0px' });

  docsContent.querySelectorAll('.docs-section').forEach(sec => observer.observe(sec));
}



// ─────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────

function section(id, title, ...children) {
  const sec = el('div', { id: `doc-${id}`, className: 'docs-section' },
    el('h2', { className: 'docs-section-title', textContent: title }),
    ...children
  );
  return sec;
}

function text(content) {
  const p = el('p', { className: 'docs-text' });
  p.innerHTML = content;
  return p;
}

function h3(content) {
  return el('h3', { className: 'docs-h3', textContent: content });
}

function codeBlock(lang, code) {
  const copyBtn = el('button', { className: 'docs-code-copy', textContent: 'Copy' });
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(code).then(() => {
      copyBtn.textContent = 'Copied!';
      setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
    });
  });

  const codeEl = el('code');
  codeEl.textContent = code;

  return el('div', { className: 'docs-code-block' },
    el('div', { className: 'docs-code-header' },
      el('span', { className: 'docs-code-lang', textContent: lang }),
      copyBtn
    ),
    el('pre', { className: 'docs-code-body' }, codeEl)
  );
}

function callout(type, title, body) {
  const c = el('div', { className: `docs-callout ${type}` },
    el('div', { className: 'docs-callout-title', textContent: title })
  );
  const p = el('p', { style: 'margin: 0;' });
  p.innerHTML = body;
  c.appendChild(p);
  return c;
}

function apiTable(rows) {
  const table = el('table', { className: 'docs-api-table' });
  const thead = el('thead', {},
    el('tr', {},
      el('th', { textContent: 'Method' }),
      el('th', { textContent: 'Endpoint' }),
      el('th', { textContent: 'Description' })
    )
  );
  const tbody = el('tbody');
  rows.forEach(r => {
    const methodBadge = el('span', { className: `docs-method-badge ${r[0].toLowerCase()}`, textContent: r[0] });
    const endpoint = el('span', { className: 'docs-endpoint', textContent: r[1] });
    tbody.appendChild(el('tr', {},
      el('td', {}, methodBadge),
      el('td', {}, endpoint),
      el('td', { textContent: r[2] })
    ));
  });
  table.appendChild(thead);
  table.appendChild(tbody);
  return table;
}

function envTable(rows) {
  const table = el('table', { className: 'docs-env-table' });
  const thead = el('thead', {},
    el('tr', {},
      el('th', { textContent: 'Variable' }),
      el('th', { textContent: 'Default' }),
      el('th', { textContent: 'Description' })
    )
  );
  const tbody = el('tbody');
  rows.forEach(r => {
    tbody.appendChild(el('tr', {},
      el('td', { textContent: r[0] }),
      el('td', { textContent: r[1] }),
      el('td', { textContent: r[2], style: 'font-family: Inter, sans-serif;' })
    ));
  });
  table.appendChild(thead);
  table.appendChild(tbody);
  return table;
}

function list(items) {
  const ul = el('ul', { className: 'docs-list' });
  items.forEach(i => {
    const li = el('li');
    li.innerHTML = i;
    ul.appendChild(li);
  });
  return ul;
}

// ─────────────────────────────────────────────────────────
//  SECTION BUILDERS
// ─────────────────────────────────────────────────────────

function buildIntroduction() {
  return section('introduction', 'Introduction',
    text('<strong>Axon Protocol</strong> is open infrastructure for building, synchronizing, and auditing multi-agent AI systems. It provides a centralized coordination backend and a suite of client SDKs so that autonomous agents can share memories, acquire distributed locks, exchange messages, and produce cryptographic reasoning receipts — all without writing custom infrastructure.'),
    text('Axon ships as a monorepo containing six packages:'),
    list([
      '<strong>axon-core</strong> — FastAPI server (the brain). Handles all API requests, database operations, PubSub, and WebSocket streaming.',
      '<strong>axon-dashboard</strong> — Vite SPA developer console. Real-time monitoring of agents, memories, locks, receipts, and messages.',
      '<strong>axon-sdk-python</strong> — Python SDK (async + sync clients). Install via <code>pip install axon-protocol</code>.',
      '<strong>axon-sdk-js</strong> — TypeScript/JavaScript SDK. Install via <code>npm install axon-protocol</code>.',
      '<strong>axon-mcp</strong> — Model Context Protocol server that exposes Axon tools to MCP-compatible AI hosts (Claude, Cursor, etc.).',
      '<strong>axon-cli</strong> — Node.js global CLI wrapper for managing the server from a terminal.',
    ]),
    callout('info', 'Open Source', 'Axon Protocol is MIT-licensed and maintained by <strong>Zuggu Group</strong>. Contributions are welcome.')
  );
}

function buildQuickStart() {
  return section('quickstart', 'Quick Start',
    text('Get a local Axon environment running in under 60 seconds. No Docker, no PostgreSQL, no Redis needed — local mode uses SQLite and in-memory PubSub.'),
    h3('Option A: Easiest Setup (Global NPM Wrapper)'),
    text('Install the server globally using npm. This automatically configures isolated virtual environments and python dependencies for you.'),
    codeBlock('bash', `npm install -g axon-protocol-server
axon dev`),
    h3('Option B: Manual Setup (From Source)'),
    text('Clone the repository and install dependencies manually:'),
    codeBlock('bash', `git clone https://github.com/ZugguGroup/Axon-Protocol.git
cd Axon-Protocol
cd axon-core
pip install -r requirements.txt
python -m app.cli dev`),
    text('The server will start at <strong>http://localhost:8000</strong>. The auto-discovery system detects the adjacent <code>axon-dashboard</code> directory, compiles it with Vite, and serves the dashboard at the root URL.'),
    h3('Connect with the Python SDK'),
    codeBlock('python', `from axon import AxonSyncClient

client = AxonSyncClient(
    api_key="your-project-api-key",
    project_id="your-project-id",
    base_url="http://localhost:8000"
)

# Register an agent
agent = client.agents.register("my-agent", capabilities=["search"])

# Store a memory
client.memory.store("Important context from today's meeting")

# Search semantically
results = client.memory.search("meeting notes")
print(results)`),
    callout('tip', 'Tip', 'Open the browser at <strong>http://localhost:8000</strong> to access the Developer Console. Create an account, then create a project to get your API Key and Project ID.')
  );
}

function buildInstallation() {
  return section('installation', 'Installation',
    h3('Global Server Package (NPM)'),
    text('The easiest way to install and manage the Axon Core server on your machine:'),
    codeBlock('bash', `npm install -g axon-protocol-server`),
    h3('Manual Server Installation (From Source)'),
    text('Requires <strong>Python ≥ 3.12</strong>. For local development, no external databases are needed.'),
    codeBlock('bash', `cd axon-core
pip install -r requirements.txt`),
    h3('Python SDK'),
    text('Requires <strong>Python ≥ 3.10</strong>. Dependencies: <code>httpx</code>, <code>websockets</code>.'),
    codeBlock('bash', `pip install axon-protocol
 
# Or install from source
cd axon-sdk-python
pip install -e .`),
    h3('JavaScript SDK'),
    text('Works with <strong>Node.js ≥ 18</strong>. Ships ESM and CJS builds with full TypeScript types.'),
    codeBlock('bash', `npm install axon-protocol
 
# Or install from source
cd axon-sdk-js
npm install && npm run build`),
    h3('MCP Server'),
    text('Install the Axon MCP server to expose Axon tools to Claude Desktop, Cursor, Windsurf, or any MCP-compatible host.'),
    codeBlock('bash', `cd axon-mcp
pip install -e .

# Run directly
python -m axon_mcp.server`),
    h3('Dashboard (Development)'),
    text('The dashboard is a Vite SPA that auto-compiles when the server starts. To develop the dashboard independently:'),
    codeBlock('bash', `cd axon-dashboard
npm install
npm run dev`)
  );
}

function buildConfiguration() {
  return section('configuration', 'Configuration',
    text('Axon supports two runtime modes determined by the <code>AXON_MODE</code> environment variable:'),
    list([
      '<strong>local</strong> (default) — Uses SQLite (<code>~/.axon/local.db</code>), ChromaDB for vector search, and in-memory PubSub. Zero dependencies.',
      '<strong>cloud</strong> — Uses PostgreSQL with pgvector, Redis for PubSub and caching, and SentenceTransformers for embeddings. Production-ready.',
    ]),
    text('Configuration is loaded from environment variables or a <code>.env</code> file in the <code>axon-core</code> directory. See the <a href="#" data-goto="env-vars" style="color: var(--text-primary);">Environment Variables</a> section for the full reference.'),
    callout('warning', 'Security Warning', 'Always change <code>JWT_SECRET</code> and <code>HMAC_SECRET</code> in production. The default values are only suitable for local development.')
  );
}

function buildArchitecture() {
  return section('architecture', 'Architecture',
    text('Axon follows a hub-and-spoke architecture. The central <strong>Axon Core API</strong> server acts as the coordination hub, while agents connect via SDKs (the spokes).'),
    codeBlock('text', `┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Python Agent   │────▶│                  │◀────│   JS/TS Agent    │
│  (axon-sdk-py)  │     │  Axon Core API   │     │  (axon-sdk-js)   │
└─────────────────┘     │   (FastAPI)      │     └──────────────────┘
                        │                  │
┌─────────────────┐     │  ┌────────────┐  │     ┌──────────────────┐
│  MCP Server     │────▶│  │ PostgreSQL │  │◀────│  Developer       │
│  (axon-mcp)     │     │  │ + pgvector │  │     │  Console (SPA)   │
└─────────────────┘     │  └────────────┘  │     └──────────────────┘
                        │  ┌────────────┐  │
                        │  │ Redis      │  │
                        │  │ (PubSub)   │  │
                        │  └────────────┘  │
                        └──────────────────┘`),
    h3('Request Flow'),
    list([
      'Agent connects via SDK → sends HTTP request with <code>X-API-Key</code> header → Axon Core validates the project API key.',
      'Agent registers itself → receives a JWT <code>agent_token</code> → all subsequent requests use <code>Authorization: Bearer {token}</code>.',
      'State changes (lock acquired, memory stored, message sent) trigger PubSub events → streamed to the Dashboard via WebSocket.',
    ]),
    h3('Data Layer'),
    list([
      '<strong>PostgreSQL + pgvector</strong> (cloud mode): Stores agents, memories (with vector embeddings), locks, receipts, and messages. Enables native cosine-similarity search.',
      '<strong>SQLite + ChromaDB</strong> (local mode): Zero-dependency alternative. SQLite handles relational data, ChromaDB handles vector search.',
      '<strong>Redis</strong> (cloud mode): PubSub event bus for real-time WebSocket broadcasting. In local mode, an in-memory asyncio queue is used instead.',
    ])
  );
}

function buildProjectsAuth() {
  return section('projects', 'Projects & Authentication',
    text('Axon uses a multi-tenant project model. Each <strong>user</strong> can own multiple <strong>projects</strong>, and each project has its own <strong>API key</strong> and isolated data (agents, memories, locks, receipts, messages).'),
    h3('User Registration'),
    text('Create an account via the Dashboard or the Auth API. Each user automatically receives a <strong>Free</strong> subscription.'),
    codeBlock('bash', `# Sign up
curl -X POST http://localhost:8000/v1/auth/signup \\
  -H "Content-Type: application/json" \\
  -d '{"email": "dev@example.com", "password": "secure-password"}'

# Response: { "token": "eyJ...", "email": "dev@example.com", "user_id": "..." }`),
    h3('Project Creation'),
    text('Use the user JWT token to create projects. Each project returns an <strong>API Key</strong> used by SDKs.'),
    codeBlock('bash', `curl -X POST http://localhost:8000/v1/projects \\
  -H "Authorization: Bearer {user_token}" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "my-project"}'

# Response: { "id": "uuid", "name": "my-project", "api_key": "axn_..." }`),
    callout('info', 'Note', 'The <code>api_key</code> is returned only once during project creation. Store it securely — it cannot be retrieved again (only rotated).')
  );
}

function buildAgents() {
  return section('agents', 'Agents',
    text('An <strong>Agent</strong> is any autonomous process (LLM, script, microservice) that registers with Axon to participate in the coordinated environment. Each agent belongs to a project and receives its own JWT token.'),
    h3('Registration'),
    codeBlock('python', `# Python SDK (async)
from axon import AxonClient

async with AxonClient(api_key="key", project_id="proj") as client:
    agent = await client.agents.register(
        name="planner-agent",
        capabilities=["planning", "search"]
    )`),
    codeBlock('javascript', `// JavaScript SDK
import { AxonClient } from 'axon-protocol';

const axon = new AxonClient({ apiKey: 'key', projectId: 'proj' });
const agent = await axon.agents.register({
  name: 'planner-agent',
  project_id: 'proj',
  capabilities: ['planning', 'search']
});`),
    h3('Agent Identity'),
    text('After registration, the agent receives a <strong>JWT token</strong> and a <strong>UUID</strong>. The token is used for all subsequent API calls. Agent identity is verified on every request and is scoped to the project.'),
  );
}

function buildMemory() {
  return section('memory', 'Semantic Memory',
    text('Axon provides a shared semantic vector store. Agents can <strong>store</strong> textual memories which are automatically embedded into high-dimensional vectors using SentenceTransformers (<code>all-MiniLM-L6-v2</code>, 384 dimensions). Memories can then be <strong>searched</strong> semantically using cosine similarity.'),
    h3('Store a Memory'),
    codeBlock('python', `await client.memory.store(
    content="The user prefers dark theme and monospace fonts",
    tags={"category": "preference", "source": "onboarding"},
    scope="project",    # "project" | "private" | "org"
    ttl=86400           # auto-expire after 24 hours (optional)
)`),
    h3('Search Memories'),
    codeBlock('python', `results = await client.memory.search(
    query="what theme does the user like?",
    limit=5,
    min_similarity=0.3
)

for r in results:
    print(f"[{r.similarity:.2f}] {r.content}")`),
    h3('Scoping'),
    list([
      '<strong>project</strong> — Visible to all agents in the same project.',
      '<strong>private</strong> — Visible only to the agent that created it.',
      '<strong>org</strong> — Visible to all agents across the organization.',
    ]),
    callout('tip', 'Tip', 'Use <code>ttl</code> (time-to-live) for ephemeral session context. Memories with TTL are automatically cleaned up after expiration.')
  );
}

function buildLocks() {
  return section('locks', 'Distributed Locks',
    text('Axon provides server-enforced distributed locks to prevent race conditions when multiple agents need to access the same shared resource (database row, API endpoint, file, etc.).'),
    h3('Acquire & Release'),
    codeBlock('python', `# Using context manager (recommended — auto-releases on exit)
async with client.lock("database_write", timeout=60) as lock_info:
    print(f"Lock acquired: {lock_info.lock_id}")
    # ... perform exclusive operation ...
# Lock is auto-released here

# Manual acquire/release
lock = await client.lock.acquire("api_rate_limiter", timeout=300)
# ... do work ...
await client.lock.release("api_rate_limiter")`),
    codeBlock('javascript', `// JavaScript SDK
await axon.locks.acquire('database_write', { timeout: 60 });
// ... perform exclusive work ...
await axon.locks.release('database_write');`),
    h3('Lock Behavior'),
    list([
      'Locks are <strong>project-scoped</strong> — an agent in Project A cannot conflict with locks in Project B.',
      'Each lock has a <strong>timeout</strong> (default 300s). Expired locks are automatically cleaned up by a background task every 30 seconds.',
      'If a lock is already held, the API returns <strong>HTTP 409 Conflict</strong>.',
      'Only the <strong>lock owner</strong> can release it. Attempting to release another agent\'s lock returns <strong>HTTP 403</strong>.',
    ])
  );
}

function buildReceipts() {
  return section('receipts', 'Chained Receipts',
    text('Reasoning receipts provide a <strong>cryptographic audit trail</strong> of an agent\'s decision-making process. Each receipt hashes the input, reasoning steps, and output into a tamper-evident chain, signed with HMAC.'),
    h3('Create a Receipt'),
    codeBlock('python', `receipt = await client.receipts.create(
    input="Summarize the Q3 earnings report",
    steps=[
        {"thought": "Reading the PDF document", "tool_called": "pdf_reader"},
        {"thought": "Extracting financial tables", "result": "Revenue: $42M"},
        {"thought": "Generating summary from extracted data"},
    ],
    output="Q3 revenue was $42M, up 15% YoY..."
)

print(f"Chain hash: {receipt.chain_hash}")
print(f"Signature:  {receipt.signature}")`),
    h3('Verify a Receipt'),
    codeBlock('python', `verification = await client.receipts.verify(receipt.receipt_id)

if verification.valid:
    print("Receipt is authentic and untampered")
else:
    print("WARNING: Receipt has been tampered with!")`),
    h3('How Hashing Works'),
    list([
      '<strong>input_hash</strong> = SHA-256 of the input text.',
      '<strong>steps_hash</strong> = SHA-256 of the JSON-serialized reasoning steps.',
      '<strong>output_hash</strong> = SHA-256 of the output text.',
      '<strong>chain_hash</strong> = SHA-256 of <code>input_hash + steps_hash + output_hash</code>.',
      '<strong>signature</strong> = HMAC-SHA256 of the chain_hash using the server\'s <code>HMAC_SECRET</code>.',
    ]),
    callout('info', 'Chaining', 'Receipts support a <code>parent_receipt_id</code> field, allowing you to build linked chains of reasoning across multiple agent interactions.')
  );
}

function buildMessages() {
  return section('messages', 'Agent Messages',
    text('Axon includes a peer-to-peer messaging bus for agent-to-agent communication. Messages are persisted in the database and broadcast via PubSub for real-time delivery.'),
    h3('Send a Message'),
    codeBlock('python', `await client.messages.send(
    recipient_id="agent-uuid-here",
    topic="task.complete",
    payload={"result": "Analysis finished", "confidence": 0.95}
)`),
    h3('Read Inbox'),
    codeBlock('python', `# Get messages addressed to the current agent
inbox = await client.messages.inbox(limit=20)

# Filter by topic (broadcasts to all project agents)
tasks = await client.messages.inbox(topic="task.assigned", limit=10)`),
    h3('Acknowledge Messages'),
    codeBlock('python', `# Mark a message as read
await client.messages.ack(message_id="msg-uuid")`),
    text('Acknowledged messages have their <code>status</code> changed from <code>sent</code> to <code>acknowledged</code>.')
  );
}

function buildEvents() {
  return section('events', 'Live Events (WebSocket)',
    text('Axon streams all state changes (lock acquired, memory stored, message sent, etc.) in real-time via WebSocket. The Dashboard and SDKs can subscribe to these events.'),
    h3('WebSocket Connection'),
    codeBlock('javascript', `// Connect to event stream
const ws = new WebSocket('ws://localhost:8000/v1/events/{project_id}');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data.type, data.payload);
};`),
    h3('Event Types'),
    list([
      '<code>lock.acquired</code> — An agent acquired a lock.',
      '<code>lock.released</code> — An agent released a lock.',
      '<code>agent.message</code> — A message was sent between agents.',
      '<code>message.acknowledged</code> — A message was acknowledged.',
      '<code>ping</code> — Server heartbeat (every 30 seconds).',
    ]),
    callout('info', 'Python SDK Events', 'The Python SDK provides <code>client.events.listen()</code> which wraps the WebSocket connection and yields parsed event objects in an async generator.')
  );
}

// ─── API REFERENCE SECTIONS ────────────────────────────

function buildApiHealth() {
  return section('api-health', 'API: Health',
    apiTable([
      ['GET', '/v1/health', 'Basic liveness check. Returns { "status": "ok" }.'],
      ['GET', '/v1/health/ready', 'Readiness probe. Checks database, Redis, and embedding model.'],
    ])
  );
}

function buildApiAuth() {
  return section('api-auth', 'API: Authentication',
    apiTable([
      ['POST', '/v1/auth/signup', 'Create a new user account. Body: { email, password }'],
      ['POST', '/v1/auth/login', 'Login with credentials. Returns JWT user token.'],
    ]),
    callout('info', 'Auth Header', 'User endpoints use <code>Authorization: Bearer {user_token}</code>. Agent endpoints use <code>X-API-Key: {project_api_key}</code> + <code>Authorization: Bearer {agent_token}</code>.')
  );
}

function buildApiAgents() {
  return section('api-agents', 'API: Agents',
    apiTable([
      ['POST', '/v1/agents/register', 'Register a new agent. Body: { name, project_id, capabilities[] }'],
      ['GET', '/v1/agents/me', 'Get current agent info (requires agent token).'],
      ['GET', '/v1/agents/list', 'List all agents in the current project.'],
    ])
  );
}

function buildApiMemory() {
  return section('api-memory', 'API: Memory',
    apiTable([
      ['POST', '/v1/memory/store', 'Store a memory. Body: { content, tags, scope, ttl }'],
      ['POST', '/v1/memory/search', 'Semantic search. Body: { query, limit, min_similarity }'],
      ['GET', '/v1/memory/list', 'List all memories in the project.'],
      ['GET', '/v1/memory/{id}', 'Get a specific memory by UUID.'],
      ['DELETE', '/v1/memory/{id}', 'Delete a memory by UUID.'],
    ])
  );
}

function buildApiLocks() {
  return section('api-locks', 'API: Coordination (Locks)',
    apiTable([
      ['POST', '/v1/lock/acquire', 'Acquire a lock. Body: { resource_id, timeout, metadata }'],
      ['POST', '/v1/lock/release', 'Release a lock. Query: ?resource_id=...'],
      ['GET', '/v1/lock/status/{id}', 'Check if a resource is locked.'],
      ['GET', '/v1/lock/list', 'List all active (non-expired) locks.'],
    ])
  );
}

function buildApiReceipts() {
  return section('api-receipts', 'API: Receipts',
    apiTable([
      ['POST', '/v1/receipts/create', 'Create a reasoning receipt. Body: { input, steps[], output }'],
      ['GET', '/v1/receipts/list', 'List all receipts in the project.'],
      ['GET', '/v1/receipts/{id}', 'Get full receipt with hashes and reasoning steps.'],
      ['POST', '/v1/receipts/verify', 'Verify receipt integrity. Query: ?receipt_id=...'],
    ])
  );
}

function buildApiMessages() {
  return section('api-messages', 'API: Messages',
    apiTable([
      ['POST', '/v1/messages/send', 'Send a message. Body: { recipient_id, topic, payload }'],
      ['GET', '/v1/messages/inbox', 'Get inbox. Query: ?topic=...&limit=50'],
      ['POST', '/v1/messages/ack', 'Acknowledge a message. Query: ?message_id=...'],
    ])
  );
}

function buildApiEvents() {
  return section('api-events', 'API: WebSocket Events',
    apiTable([
      ['WS', '/v1/events/{project_id}', 'Real-time event stream via WebSocket.'],
    ]),
    text('After connecting, the server sends <code>{"type": "connected", "project_id": "..."}</code>. It then streams all project events and sends a <code>ping</code> heartbeat every 30 seconds.')
  );
}

// ─── SDK SECTIONS ──────────────────────────────────────

function buildSdkPython() {
  return section('sdk-python', 'Python SDK',
    text('The Python SDK provides both <strong>async</strong> (<code>AxonClient</code>) and <strong>sync</strong> (<code>AxonSyncClient</code>) clients. Both expose identical APIs.'),
    h3('Async Client'),
    codeBlock('python', `from axon import AxonClient

async with AxonClient(
    api_key="your-key",
    project_id="your-project-id",
    base_url="http://localhost:8000"
) as client:
    # client.memory  — MemoryClient
    # client.lock    — CoordinationClient (callable as context manager)
    # client.receipts — ReceiptsClient
    # client.events  — EventsClient
    # client.messages — MessagesClient
    pass`),
    h3('Sync Client'),
    codeBlock('python', `from axon import AxonSyncClient

client = AxonSyncClient(
    api_key="your-key",
    project_id="your-project-id"
)

# Same API surface, fully synchronous
client.memory.store("Hello world")
results = client.memory.search("hello")
client.close()`),
    h3('Available Modules'),
    list([
      '<strong>client.memory</strong> — <code>.store()</code>, <code>.search()</code>, <code>.list()</code>, <code>.get()</code>, <code>.delete()</code>',
      '<strong>client.lock</strong> — <code>.acquire()</code>, <code>.release()</code>, <code>.status()</code>, <code>.list_active()</code>, <code>.hold()</code> context manager',
      '<strong>client.receipts</strong> — <code>.create()</code>, <code>.get()</code>, <code>.list()</code>, <code>.verify()</code>',
      '<strong>client.messages</strong> — <code>.send()</code>, <code>.inbox()</code>, <code>.ack()</code>',
      '<strong>client.events</strong> — <code>.listen()</code> async generator for WebSocket events',
    ])
  );
}

function buildSdkJavascript() {
  return section('sdk-javascript', 'JavaScript SDK',
    text('The JavaScript SDK is a TypeScript-first package with full type definitions. It ships ESM and CJS builds via <code>tsup</code>.'),
    codeBlock('typescript', `import { AxonClient } from 'axon-protocol';

const axon = new AxonClient({
  baseUrl: 'http://localhost:8000',
  apiKey: 'your-key',
  projectId: 'your-project-id'
});

// Feature modules
await axon.memory.store({ content: 'Important fact' });
const results = await axon.memory.search({ query: 'fact' });

await axon.locks.acquire('shared-resource', { timeout: 60 });
await axon.locks.release('shared-resource');

const receipt = await axon.receipts.create({
  input: 'Question',
  steps: [{ thought: 'Thinking...' }],
  output: 'Answer'
});

await axon.messages.send({
  recipientId: 'agent-id',
  topic: 'task.done',
  payload: { result: 'success' }
});`),
    h3('Available Modules'),
    list([
      '<strong>axon.agents</strong> — <code>.register()</code>, <code>.me()</code>, <code>.list()</code>',
      '<strong>axon.memory</strong> — <code>.store()</code>, <code>.search()</code>, <code>.list()</code>, <code>.get()</code>, <code>.delete()</code>',
      '<strong>axon.locks</strong> — <code>.acquire()</code>, <code>.release()</code>, <code>.status()</code>, <code>.list()</code>',
      '<strong>axon.receipts</strong> — <code>.create()</code>, <code>.get()</code>, <code>.list()</code>, <code>.verify()</code>',
      '<strong>axon.messages</strong> — <code>.send()</code>, <code>.inbox()</code>, <code>.ack()</code>',
      '<strong>axon.events</strong> — <code>.subscribe()</code> for WebSocket event streaming',
    ])
  );
}

function buildSdkMcp() {
  return section('sdk-mcp', 'MCP Server',
    text('The Axon MCP Server exposes Axon operations as <strong>Model Context Protocol</strong> tools. This lets AI hosts like Claude Desktop, Cursor, or Windsurf call Axon directly.'),
    h3('Available MCP Tools'),
    list([
      '<code>axon_register_agent</code> — Register a new agent.',
      '<code>axon_store_memory</code> — Store a text memory with tags and TTL.',
      '<code>axon_search_memories</code> — Semantic search across stored memories.',
      '<code>axon_acquire_lock</code> — Acquire a distributed lock.',
      '<code>axon_release_lock</code> — Release a distributed lock.',
      '<code>axon_create_receipt</code> — Create a cryptographic reasoning receipt.',
    ]),
    h3('Configuration'),
    text('The MCP server loads credentials from (in priority order):'),
    list([
      'Environment variables: <code>AXON_BASE_URL</code>, <code>AXON_API_KEY</code>, <code>AXON_PROJECT_ID</code>',
      'Local <code>.axon</code> config file in the current directory (walks up to root)',
      'Global <code>~/.axon/config.json</code>',
    ]),
    h3('Claude Desktop Configuration'),
    codeBlock('json', `{
  "mcpServers": {
    "axon": {
      "command": "python",
      "args": ["-m", "axon_mcp.server"],
      "env": {
        "AXON_BASE_URL": "http://localhost:8000",
        "AXON_API_KEY": "your-api-key",
        "AXON_PROJECT_ID": "your-project-id"
      }
    }
  }
}`)
  );
}

// ─── INTEGRATION SECTIONS ──────────────────────────────

function buildIntLangchain() {
  return section('int-langchain', 'LangChain Integration',
    text('The Python SDK ships built-in LangChain integration tools and callback handlers. These let LangChain agents use Axon memory and locks as native tools, and automatically generate reasoning receipts.'),
    h3('Memory Search Tool'),
    codeBlock('python', `from axon import AxonSyncClient
from axon.integrations.langchain import AxonMemoryTool

client = AxonSyncClient(api_key="key", project_id="proj")
memory_tool = AxonMemoryTool(client=client)

# Use with LangChain agent
from langchain.agents import initialize_agent, AgentType

agent = initialize_agent(
    tools=[memory_tool],
    llm=your_llm,
    agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION
)`),
    h3('Lock Tool'),
    codeBlock('python', `from axon.integrations.langchain import AxonLockTool

lock_tool = AxonLockTool(client=client)
# Input format: "acquire:resource_name" or "release:resource_name"`),
    h3('Receipt Callback Handler'),
    codeBlock('python', `from axon.integrations.langchain import AxonReceiptCallbackHandler

handler = AxonReceiptCallbackHandler(
    client=client,
    input_text="User query: What is the weather?"
)

# Attach to LangChain chain — automatically captures LLM calls,
# tool invocations, and outputs as a reasoning receipt
chain.invoke({"input": "What is the weather?"}, config={"callbacks": [handler]})`)
  );
}

function buildIntCrewai() {
  return section('int-crewai', 'CrewAI Integration',
    text('Axon integrates with CrewAI to provide persistent cross-crew memory and coordination. The integration module wraps Axon tools as CrewAI-compatible tool functions.'),
    codeBlock('python', `from axon.integrations.crewai import create_axon_tools

tools = create_axon_tools(
    api_key="your-key",
    project_id="your-project"
)

# tools contains: [memory_search, memory_store, lock_acquire, lock_release]
# Pass directly to CrewAI agents`),
    callout('info', 'Note', 'The CrewAI integration requires <code>crewai</code> to be installed separately. Axon only provides the tool wrappers.')
  );
}

// ─── DEPLOYMENT SECTIONS ───────────────────────────────

function buildDeployLocal() {
  return section('deploy-local', 'Local Mode',
    text('Local mode is the default. It uses <strong>SQLite</strong> and <strong>ChromaDB</strong> for persistence and an in-memory asyncio queue for PubSub. No Docker or external services needed.'),
    codeBlock('bash', `# Start the server in local mode (default)
cd axon-core
python -m app.cli dev

# Or with custom host/port
python -m app.cli dev --host 0.0.0.0 --port 9000`),
    text('Data is stored in <code>~/.axon/</code>:'),
    list([
      '<code>~/.axon/local.db</code> — SQLite database (agents, locks, receipts, messages)',
      '<code>~/.axon/chroma/</code> — ChromaDB vector store (memory embeddings)',
    ]),
    callout('tip', 'Dashboard Auto-Compilation', 'When the server starts, it automatically detects the adjacent <code>axon-dashboard</code> directory, runs <code>npm run build</code>, and copies the compiled assets to <code>app/static/</code>. The dashboard is then served at the root URL.')
  );
}

function buildDeployCloud() {
  return section('deploy-cloud', 'Cloud / Production',
    text('For production deployments, set <code>AXON_MODE=cloud</code> and provide PostgreSQL + Redis connection strings.'),
    h3('Prerequisites'),
    list([
      '<strong>PostgreSQL ≥ 14</strong> with the <code>pgvector</code> extension installed.',
      '<strong>Redis ≥ 7</strong> for PubSub event streaming.',
      '<strong>Python ≥ 3.12</strong> runtime environment.',
    ]),
    h3('Environment Setup'),
    codeBlock('bash', `export AXON_MODE=cloud
export DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/axon
export REDIS_URL=redis://host:6379
export JWT_SECRET=your-secure-random-secret
export HMAC_SECRET=your-secure-hmac-secret`),
    h3('Run with Uvicorn'),
    codeBlock('bash', `uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4`),
    h3('Docker Deployment'),
    codeBlock('dockerfile', `FROM python:3.12-slim

WORKDIR /app
COPY axon-core/ .
RUN pip install --no-cache-dir -e .

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]`)
  );
}

function buildEnvVars() {
  return section('env-vars', 'Environment Variables',
    text('Complete reference of all configuration variables. Set these in a <code>.env</code> file or as system environment variables.'),
    h3('Core'),
    envTable([
      ['AXON_MODE', 'local', 'Runtime mode: "local" (SQLite) or "cloud" (PostgreSQL + Redis)'],
      ['AXON_DIR', '~/.axon', 'Directory for local data storage'],
      ['DATABASE_URL', '(auto)', 'PostgreSQL connection string (cloud mode)'],
      ['REDIS_URL', '(auto)', 'Redis connection string (cloud mode)'],
      ['LOG_LEVEL', 'INFO', 'Logging level: DEBUG, INFO, WARNING, ERROR'],
      ['APP_VERSION', '0.1.0', 'Application version string'],
    ]),
    h3('Security'),
    envTable([
      ['JWT_SECRET', 'change-this...', 'Secret key for signing JWT tokens'],
      ['JWT_ALGORITHM', 'HS256', 'JWT signing algorithm'],
      ['JWT_EXPIRE_MINUTES', '1440', 'Token expiration time (24 hours)'],
      ['HMAC_SECRET', 'change-this...', 'Secret key for receipt HMAC signatures'],
    ]),
    h3('Embedding'),
    envTable([
      ['EMBEDDING_MODEL', 'all-MiniLM-L6-v2', 'SentenceTransformer model name'],
      ['EMBEDDING_DIM', '384', 'Embedding vector dimensions'],
      ['CHROMA_PATH', '~/.axon/chroma', 'ChromaDB data directory (local mode)'],
    ]),
    h3('Coordination'),
    envTable([
      ['DEFAULT_LOCK_TIMEOUT', '300', 'Default lock expiry in seconds'],
      ['LOCK_CLEANUP_INTERVAL', '30', 'Background cleanup interval in seconds'],
    ]),
    h3('Billing'),
    envTable([
      ['BILLING_PROVIDER', 'mock', 'Billing provider: "mock", "stripe", or "razorpay"'],
      ['STRIPE_API_KEY', '', 'Stripe API secret key'],
      ['STRIPE_WEBHOOK_SECRET', '', 'Stripe webhook signing secret'],
      ['STRIPE_PRO_PRICE_ID', '', 'Stripe Pro plan price ID'],
      ['RAZORPAY_KEY_ID', '', 'Razorpay key ID'],
      ['RAZORPAY_KEY_SECRET', '', 'Razorpay key secret'],
      ['RAZORPAY_WEBHOOK_SECRET', '', 'Razorpay webhook secret'],
    ]),
    callout('warning', 'Production Checklist', 'Before deploying to production: (1) Set strong, random values for <code>JWT_SECRET</code> and <code>HMAC_SECRET</code>. (2) Set <code>AXON_MODE=cloud</code>. (3) Use a managed PostgreSQL with pgvector. (4) Use a managed Redis instance. (5) Configure Stripe or Razorpay for billing.')
  );
}

// Register docs route
register('docs', renderDocs);
