// ─── Axon Protocol SDK — Unit Tests ───

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  AxonClient,
  AxonError,
  AuthenticationError,
  NotFoundError,
  ConflictError,
  ValidationError,
  ServerError,
} from '../src/index.js';

// ── Test Helpers ──

function mockFetch(response: {
  status?: number;
  ok?: boolean;
  body?: unknown;
}): void {
  const { status = 200, ok = true, body = {} } = response;
  globalThis.fetch = vi.fn().mockResolvedValue({
    status,
    ok,
    statusText: `Status ${status}`,
    json: () => Promise.resolve(body),
  } as Response);
}

function mockFetchSequence(responses: Array<{
  status?: number;
  ok?: boolean;
  body?: unknown;
}>): void {
  const fetchMock = vi.fn();
  responses.forEach((r, i) => {
    fetchMock.mockResolvedValueOnce({
      status: r.status ?? 200,
      ok: r.ok ?? true,
      statusText: `Status ${r.status ?? 200}`,
      json: () => Promise.resolve(r.body ?? {}),
    } as Response);
  });
  globalThis.fetch = fetchMock;
}

function getLastFetchCall(): { url: string; init: RequestInit } {
  const calls = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls;
  const last = calls[calls.length - 1];
  return { url: last[0] as string, init: last[1] as RequestInit };
}

function getAllFetchCalls(): Array<{ url: string; init: RequestInit }> {
  return (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls.map(
    (call: unknown[]) => ({
      url: call[0] as string,
      init: call[1] as RequestInit,
    }),
  );
}

// ── Tests ──

describe('AxonClient', () => {
  let axon: AxonClient;

  beforeEach(() => {
    axon = new AxonClient({ baseUrl: 'http://test:8000' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Constructor ──

  describe('constructor', () => {
    it('should create client with default config', () => {
      const client = new AxonClient();
      expect(client).toBeInstanceOf(AxonClient);
    });

    it('should create client with custom config', () => {
      const client = new AxonClient({
        baseUrl: 'http://custom:9000',
        apiKey: 'test-key',
        projectId: 'test-project',
        timeout: 5000,
      });
      expect(client).toBeInstanceOf(AxonClient);
    });

    it('should expose all feature modules', () => {
      expect(axon.agents).toBeDefined();
      expect(axon.memory).toBeDefined();
      expect(axon.locks).toBeDefined();
      expect(axon.receipts).toBeDefined();
      expect(axon.events).toBeDefined();
    });
  });

  // ── Health ──

  describe('health', () => {
    it('ping should call GET /v1/health', async () => {
      mockFetch({ body: { status: 'ok', timestamp: '2025-01-01T00:00:00Z' } });

      const result = await axon.ping();

      expect(result.status).toBe('ok');
      const { url, init } = getLastFetchCall();
      expect(url).toBe('http://test:8000/v1/health');
      expect(init.method).toBe('GET');
    });

    it('health should call GET /v1/health/ready', async () => {
      mockFetch({
        body: {
          status: 'ready',
          database: 'connected',
          redis: 'connected',
          embedding_model: 'loaded',
        },
      });

      const result = await axon.health();

      expect(result.status).toBe('ready');
      expect(result.database).toBe('connected');
    });
  });

  // ── Agents ──

  describe('agents', () => {
    it('register should POST to /v1/agents/register', async () => {
      mockFetch({
        body: {
          agent_id: 'agent-123',
          api_key: 'key-abc',
          message: 'Agent registered',
        },
      });

      const result = await axon.agents.register({
        name: 'planner',
        project_id: 'test-project',
        capabilities: ['planning'],
      });

      expect(result.agent_id).toBe('agent-123');
      expect(result.api_key).toBe('key-abc');

      const { url, init } = getLastFetchCall();
      expect(url).toBe('http://test:8000/v1/agents/register');
      expect(init.method).toBe('POST');

      const body = JSON.parse(init.body as string);
      expect(body.name).toBe('planner');
      expect(body.project_id).toBe('test-project');
      expect(body.capabilities).toEqual(['planning']);
    });

    it('register should auto-store credentials for subsequent calls', async () => {
      mockFetchSequence([
        {
          body: {
            agent_id: 'agent-123',
            api_key: 'key-abc',
            message: 'Agent registered',
          },
        },
        {
          body: {
            id: 'agent-123',
            name: 'planner',
            project_id: 'test-project',
            capabilities: ['planning'],
            status: 'active',
            api_key_hash: 'hashed',
            last_seen_at: null,
            created_at: '2025-01-01T00:00:00Z',
          },
        },
      ]);

      await axon.agents.register({
        name: 'planner',
        project_id: 'test-project',
      });

      await axon.agents.me();

      const calls = getAllFetchCalls();
      const meHeaders = calls[1].init.headers as Record<string, string>;
      expect(meHeaders['X-API-Key']).toBe('key-abc');
    });

    it('me should call GET /v1/agents/me', async () => {
      axon.setCredentials('test-key', 'test-project');
      mockFetch({
        body: {
          id: 'agent-123',
          name: 'planner',
          project_id: 'test-project',
          capabilities: [],
          status: 'active',
          api_key_hash: 'hash',
          last_seen_at: null,
          created_at: '2025-01-01T00:00:00Z',
        },
      });

      const agent = await axon.agents.me();

      expect(agent.name).toBe('planner');
      const { url, init } = getLastFetchCall();
      expect(url).toBe('http://test:8000/v1/agents/me');
      expect(init.method).toBe('GET');
      expect((init.headers as Record<string, string>)['X-API-Key']).toBe('test-key');
    });

    it('list should call GET /v1/agents/list', async () => {
      axon.setCredentials('test-key', 'test-project');
      mockFetch({
        body: {
          agents: [
            { id: 'a1', name: 'planner', project_id: 'p1', capabilities: [], status: 'active', last_seen_at: null, created_at: '2025-01-01T00:00:00Z' },
          ],
        },
      });

      const result = await axon.agents.list();

      expect(result.agents).toHaveLength(1);
      expect(result.agents[0].name).toBe('planner');
    });
  });

  // ── Memory ──

  describe('memory', () => {
    beforeEach(() => {
      axon.setCredentials('test-key', 'test-project');
    });

    it('store should POST to /v1/memory/store', async () => {
      mockFetch({
        body: { memory_id: 'mem-123', message: 'Stored' },
      });

      const result = await axon.memory.store({
        content: 'User prefers dark mode',
        tags: { category: 'preferences' },
        scope: 'project',
      });

      expect(result.memory_id).toBe('mem-123');

      const { init } = getLastFetchCall();
      const body = JSON.parse(init.body as string);
      expect(body.content).toBe('User prefers dark mode');
      expect(body.tags).toEqual({ category: 'preferences' });
      expect(body.scope).toBe('project');
    });

    it('store should use defaults for optional fields', async () => {
      mockFetch({ body: { memory_id: 'mem-123', message: 'Stored' } });

      await axon.memory.store({ content: 'test' });

      const { init } = getLastFetchCall();
      const body = JSON.parse(init.body as string);
      expect(body.tags).toEqual({});
      expect(body.scope).toBe('project');
      expect(body.ttl).toBeNull();
    });

    it('search should POST to /v1/memory/search', async () => {
      mockFetch({
        body: {
          results: [
            { id: 'mem-1', content: 'dark mode pref', tags: {}, scope: 'project', similarity: 0.95, agent_id: 'a1', created_at: '2025-01-01T00:00:00Z' },
          ],
          query: 'preferences',
        },
      });

      const result = await axon.memory.search({
        query: 'preferences',
        limit: 10,
        min_similarity: 0.5,
      });

      expect(result.results).toHaveLength(1);
      expect(result.results[0].similarity).toBe(0.95);

      const { init } = getLastFetchCall();
      const body = JSON.parse(init.body as string);
      expect(body.query).toBe('preferences');
      expect(body.limit).toBe(10);
      expect(body.min_similarity).toBe(0.5);
    });

    it('get should call GET /v1/memory/:id', async () => {
      mockFetch({
        body: {
          id: 'mem-123',
          content: 'test memory',
          tags: {},
          scope: 'project',
          agent_id: 'a1',
          project_id: 'p1',
          created_at: '2025-01-01T00:00:00Z',
        },
      });

      const mem = await axon.memory.get('mem-123');

      expect(mem.content).toBe('test memory');
      expect(getLastFetchCall().url).toBe('http://test:8000/v1/memory/mem-123');
    });

    it('delete should call DELETE /v1/memory/:id', async () => {
      mockFetch({ body: { message: 'Deleted' } });

      const result = await axon.memory.delete('mem-123');

      expect(result.message).toBe('Deleted');
      const { url, init } = getLastFetchCall();
      expect(url).toBe('http://test:8000/v1/memory/mem-123');
      expect(init.method).toBe('DELETE');
    });

    it('list should call GET /v1/memory/list', async () => {
      mockFetch({
        body: {
          memories: [
            { id: 'm1', content: 'test', tags: {}, scope: 'project', agent_id: 'a1', created_at: '2025-01-01T00:00:00Z' },
          ],
          total: 1,
        },
      });

      const result = await axon.memory.list();

      expect(result.memories).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  // ── Locks ──

  describe('locks', () => {
    beforeEach(() => {
      axon.setCredentials('test-key', 'test-project');
    });

    it('acquire should POST to /v1/lock/acquire', async () => {
      mockFetch({
        body: {
          granted: true,
          resource_id: 'db-conn',
          expires_at: '2025-01-01T01:00:00Z',
          message: 'Lock acquired',
        },
      });

      const result = await axon.locks.acquire('db-conn', 600);

      expect(result.granted).toBe(true);
      expect(result.resource_id).toBe('db-conn');

      const { init } = getLastFetchCall();
      const body = JSON.parse(init.body as string);
      expect(body.resource_id).toBe('db-conn');
      expect(body.timeout).toBe(600);
    });

    it('acquire should use default timeout of 300', async () => {
      mockFetch({
        body: { granted: true, resource_id: 'r1', expires_at: '2025-01-01T01:00:00Z', message: 'ok' },
      });

      await axon.locks.acquire('r1');

      const body = JSON.parse(getLastFetchCall().init.body as string);
      expect(body.timeout).toBe(300);
    });

    it('release should POST to /v1/lock/release', async () => {
      mockFetch({
        body: { released: true, resource_id: 'db-conn', message: 'Released' },
      });

      const result = await axon.locks.release('db-conn');

      expect(result.released).toBe(true);
      expect(getLastFetchCall().url).toContain('/v1/lock/release?resource_id=db-conn');
    });

    it('status should call GET /v1/lock/status/:id', async () => {
      mockFetch({
        body: { locked: true, resource_id: 'db-conn', holder_agent_id: 'a1', expires_at: '2025-01-01T01:00:00Z' },
      });

      const result = await axon.locks.status('db-conn');

      expect(result.locked).toBe(true);
      expect(getLastFetchCall().url).toBe('http://test:8000/v1/lock/status/db-conn');
    });

    it('list should call GET /v1/lock/list', async () => {
      mockFetch({
        body: {
          locks: [
            { resource_id: 'r1', holder_agent_id: 'a1', locked_at: '2025-01-01T00:00:00Z', expires_at: '2025-01-01T01:00:00Z' },
          ],
        },
      });

      const result = await axon.locks.list();

      expect(result.locks).toHaveLength(1);
    });

    it('withLock should acquire, run callback, and release', async () => {
      mockFetchSequence([
        { body: { granted: true, resource_id: 'r1', expires_at: '2025-01-01T01:00:00Z', message: 'ok' } },
        { body: { released: true, resource_id: 'r1', message: 'ok' } },
      ]);

      let callbackRan = false;
      await axon.locks.withLock('r1', async () => {
        callbackRan = true;
      });

      expect(callbackRan).toBe(true);
      const calls = getAllFetchCalls();
      expect(calls).toHaveLength(2);
      expect(calls[0].url).toContain('/v1/lock/acquire');
      expect(calls[1].url).toContain('/v1/lock/release');
    });

    it('withLock should release even if callback throws', async () => {
      mockFetchSequence([
        { body: { granted: true, resource_id: 'r1', expires_at: '2025-01-01T01:00:00Z', message: 'ok' } },
        { body: { released: true, resource_id: 'r1', message: 'ok' } },
      ]);

      await expect(
        axon.locks.withLock('r1', async () => {
          throw new Error('callback error');
        }),
      ).rejects.toThrow('callback error');

      const calls = getAllFetchCalls();
      expect(calls).toHaveLength(2);
      expect(calls[1].url).toContain('/v1/lock/release');
    });
  });

  // ── Receipts ──

  describe('receipts', () => {
    beforeEach(() => {
      axon.setCredentials('test-key', 'test-project');
    });

    it('create should POST to /v1/receipts/create', async () => {
      mockFetch({
        body: {
          receipt_id: 'rec-123',
          chain_hash: 'hash-abc',
          signature: 'sig-xyz',
          message: 'Receipt created',
        },
      });

      const result = await axon.receipts.create({
        input: 'What is the weather?',
        steps: [
          { thought: 'Need to check weather API', tool_called: 'weather_api', result: '72°F' },
        ],
        output: 'It is 72°F and sunny.',
      });

      expect(result.receipt_id).toBe('rec-123');
      expect(result.chain_hash).toBe('hash-abc');

      const { init } = getLastFetchCall();
      const body = JSON.parse(init.body as string);
      expect(body.input).toBe('What is the weather?');
      expect(body.steps).toHaveLength(1);
      expect(body.steps[0].tool_called).toBe('weather_api');
    });

    it('get should call GET /v1/receipts/:id', async () => {
      mockFetch({
        body: {
          id: 'rec-123',
          agent_id: 'a1',
          input_text: 'test',
          steps: [],
          output_text: 'result',
          chain_hash: 'hash',
          signature: 'sig',
          previous_receipt_id: null,
          created_at: '2025-01-01T00:00:00Z',
        },
      });

      const receipt = await axon.receipts.get('rec-123');

      expect(receipt.id).toBe('rec-123');
      expect(getLastFetchCall().url).toBe('http://test:8000/v1/receipts/rec-123');
    });

    it('verify should POST to /v1/receipts/verify', async () => {
      mockFetch({
        body: { valid: true, receipt_id: 'rec-123', message: 'Integrity verified' },
      });

      const result = await axon.receipts.verify('rec-123');

      expect(result.valid).toBe(true);
      expect(getLastFetchCall().url).toContain('/v1/receipts/verify?receipt_id=rec-123');
    });

    it('list should call GET /v1/receipts/list', async () => {
      mockFetch({
        body: {
          receipts: [
            { id: 'r1', agent_id: 'a1', input_text: 'test', chain_hash: 'h1', signature: 's1', created_at: '2025-01-01T00:00:00Z' },
          ],
        },
      });

      const result = await axon.receipts.list();

      expect(result.receipts).toHaveLength(1);
    });
  });

  // ── Error Handling ──

  describe('error handling', () => {
    it('should throw AuthenticationError on 401', async () => {
      mockFetch({ status: 401, ok: false, body: { detail: 'Invalid API key' } });

      await expect(axon.ping()).rejects.toThrow(AuthenticationError);
      await expect(axon.ping()).rejects.toThrow('Invalid API key');
    });

    it('should throw NotFoundError on 404', async () => {
      mockFetch({ status: 404, ok: false, body: { detail: 'Agent not found' } });

      await expect(axon.agents.me()).rejects.toThrow(NotFoundError);
    });

    it('should throw ConflictError on 409', async () => {
      mockFetch({ status: 409, ok: false, body: { detail: 'Lock already held' } });
      axon.setCredentials('key', 'proj');

      await expect(axon.locks.acquire('r1')).rejects.toThrow(ConflictError);
    });

    it('should throw ValidationError on 422', async () => {
      mockFetch({ status: 422, ok: false, body: { detail: 'Invalid input' } });

      await expect(
        axon.agents.register({ name: '', project_id: '' }),
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ServerError on 500', async () => {
      mockFetch({ status: 500, ok: false, body: { detail: 'Internal error' } });

      await expect(axon.ping()).rejects.toThrow(ServerError);
    });

    it('should throw AxonError on other status codes', async () => {
      mockFetch({ status: 429, ok: false, body: { detail: 'Rate limited' } });

      await expect(axon.ping()).rejects.toThrow(AxonError);
    });

    it('errors should preserve instanceof chain', async () => {
      mockFetch({ status: 401, ok: false, body: { detail: 'test' } });

      try {
        await axon.ping();
      } catch (e) {
        expect(e).toBeInstanceOf(AuthenticationError);
        expect(e).toBeInstanceOf(AxonError);
        expect(e).toBeInstanceOf(Error);
        expect((e as AxonError).statusCode).toBe(401);
      }
    });

    it('should handle network errors', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('fetch failed'));

      await expect(axon.ping()).rejects.toThrow(AxonError);
      await expect(axon.ping()).rejects.toThrow('Network error');
    });
  });

  // ── setCredentials ──

  describe('setCredentials', () => {
    it('should set API key header for subsequent requests', async () => {
      axon.setCredentials('my-key', 'my-project');
      mockFetch({ body: { status: 'ok', timestamp: '' } });

      await axon.ping();

      const headers = getLastFetchCall().init.headers as Record<string, string>;
      expect(headers['X-API-Key']).toBe('my-key');
    });
  });

  // ── Events ──

  describe('events', () => {
    it('should expose subscribe method', () => {
      const unsub = axon.events.subscribe(() => {});
      expect(typeof unsub).toBe('function');
      unsub();
    });

    it('should expose connected property', () => {
      expect(axon.events.connected).toBe(false);
    });

    it('subscribe should return unsubscribe function', () => {
      const handler = vi.fn();
      const unsub = axon.events.subscribe(handler);
      unsub();
      // After unsubscribe, handler should not be called
      // (we can't easily test this without a real WebSocket, but the function exists)
      expect(typeof unsub).toBe('function');
    });
  });
});
