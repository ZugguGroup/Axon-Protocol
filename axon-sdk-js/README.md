# axon-protocol

> TypeScript SDK for the **Axon Protocol** — multi-agent coordination, shared vector memory, distributed resource locking, and auditable reasoning receipts.

[![npm version](https://img.shields.io/npm/v/axon-protocol.svg)](https://www.npmjs.com/package/axon-protocol)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4+-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Installation

```bash
npm install axon-protocol
```

## Quick Start

```typescript
import { AxonClient } from 'axon-protocol';

const axon = new AxonClient({
  baseUrl: 'http://localhost:8000', // default
});

// 1. Register an agent (auto-stores API key)
const result = await axon.agents.register({
  name: 'planner',
  project_id: 'my-project',
  capabilities: ['planning', 'search'],
});
console.log('API Key:', result.api_key);

// 2. Store a memory
await axon.memory.store({
  content: 'User prefers dark mode and concise responses',
  tags: { category: 'preferences' },
});

// 3. Search memories
const memories = await axon.memory.search({
  query: 'user preferences',
  limit: 5,
});

// 4. Acquire a lock
await axon.locks.acquire('shared-database', 300);
// ... do exclusive work ...
await axon.locks.release('shared-database');

// 5. Create a reasoning receipt
const receipt = await axon.receipts.create({
  input: 'What is the weather?',
  steps: [
    { thought: 'Need to check weather API', tool_called: 'weather_api', result: '72°F' },
  ],
  output: 'It is 72°F and sunny today.',
});

// 6. Verify receipt integrity
const verification = await axon.receipts.verify(receipt.receipt_id);
console.log('Valid:', verification.valid);
```

## Features

### 🤖 Agent Management
```typescript
await axon.agents.register({ name: 'agent', project_id: 'proj' });
const me = await axon.agents.me();
const all = await axon.agents.list();
```

### 🧠 Shared Vector Memory
```typescript
await axon.memory.store({ content: '...', tags: { key: 'value' }, scope: 'project' });
const results = await axon.memory.search({ query: '...', limit: 10 });
const entry = await axon.memory.get('memory-id');
await axon.memory.delete('memory-id');
```

### 🔒 Distributed Locking
```typescript
await axon.locks.acquire('resource', 300);
await axon.locks.release('resource');
const status = await axon.locks.status('resource');

// Scoped lock (auto-release)
await axon.locks.withLock('resource', async () => {
  // exclusive work here
});
```

### 📜 Reasoning Receipts
```typescript
const receipt = await axon.receipts.create({ input, steps, output });
const full = await axon.receipts.get(receipt.receipt_id);
const check = await axon.receipts.verify(receipt.receipt_id);
```

### ⚡ Real-time Events
```typescript
axon.events.subscribe((event) => {
  console.log(`[${event.type}]`, event.data);
});
await axon.events.connect();
```

## Error Handling

All errors extend `AxonError` with typed subclasses:

```typescript
import { AxonError, AuthenticationError, NotFoundError, ConflictError } from 'axon-protocol';

try {
  await axon.locks.acquire('resource');
} catch (e) {
  if (e instanceof ConflictError) {
    console.log('Lock already held:', e.detail);
  } else if (e instanceof AuthenticationError) {
    console.log('Invalid API key');
  }
}
```

## Configuration

```typescript
const axon = new AxonClient({
  baseUrl: 'http://localhost:8000',  // Axon server URL
  apiKey: 'existing-api-key',        // Pre-existing API key
  projectId: 'my-project',           // Project ID
  timeout: 30000,                    // Request timeout (ms)
});
```

## Requirements

- Node.js 18+ (uses native `fetch`)
- Axon Core server running

## License

MIT
