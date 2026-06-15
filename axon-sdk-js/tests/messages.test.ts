// ─── Axon Protocol SDK — Messages & LangChain Tests ───

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AxonClient } from '../src/index.js';
import {
  AxonMemoryTool,
  AxonLockTool,
  AxonReceiptCallbackHandler,
} from '../src/integrations/langchain.js';

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

function getLastFetchCall(): { url: string; init: RequestInit } {
  const calls = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls;
  const last = calls[calls.length - 1];
  return { url: last[0] as string, init: last[1] as RequestInit };
}

describe('MessagesModule', () => {
  let axon: AxonClient;

  beforeEach(() => {
    axon = new AxonClient({
      baseUrl: 'http://test:8000',
      apiKey: 'test-key',
      projectId: 'test-project',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('send', () => {
    it('should send a message successfully', async () => {
      const mockResponse = {
        message_id: 'msg-1234',
        status: 'sent',
        created_at: '2026-06-14T12:00:00Z',
      };
      mockFetch({ body: mockResponse });

      const res = await axon.messages.send({
        recipient_id: 'agent-recipient',
        topic: 'news',
        payload: { greeting: 'hello' },
      });

      expect(res).toEqual(mockResponse);
      const call = getLastFetchCall();
      expect(call.url).toBe('http://test:8000/v1/messages/send');
      expect(call.init.method).toBe('POST');
      expect(JSON.parse(call.init.body as string)).toEqual({
        recipient_id: 'agent-recipient',
        topic: 'news',
        payload: { greeting: 'hello' },
      });
    });
  });

  describe('inbox', () => {
    it('should fetch inbox messages without query parameters', async () => {
      const mockInbox = {
        messages: [
          {
            id: 'msg-1',
            sender_id: 'agent-1',
            recipient_id: 'agent-2',
            project_id: 'test-project',
            topic: null,
            payload: { data: 'val' },
            status: 'sent',
            created_at: '2026-06-14T12:00:00Z',
          },
        ],
      };
      mockFetch({ body: mockInbox });

      const res = await axon.messages.inbox();
      expect(res).toEqual(mockInbox.messages);
      const call = getLastFetchCall();
      expect(call.url).toBe('http://test:8000/v1/messages/inbox');
      expect(call.init.method).toBe('GET');
    });

    it('should pass topic and limit in query parameters', async () => {
      mockFetch({ body: { messages: [] } });

      await axon.messages.inbox({ topic: 'alerts', limit: 10 });
      const call = getLastFetchCall();
      expect(call.url).toContain('/v1/messages/inbox');
      expect(call.url).toContain('topic=alerts');
      expect(call.url).toContain('limit=10');
    });
  });

  describe('ack', () => {
    it('should acknowledge message successfully', async () => {
      mockFetch({ body: { acknowledged: true } });

      const res = await axon.messages.ack('msg-1234');
      expect(res).toBe(true);

      const call = getLastFetchCall();
      expect(call.url).toContain('/v1/messages/ack');
      expect(call.url).toContain('message_id=msg-1234');
      expect(call.init.method).toBe('POST');
    });
  });
});

describe('LangChain Integration', () => {
  let axon: AxonClient;

  beforeEach(() => {
    axon = new AxonClient({
      baseUrl: 'http://test:8000',
      apiKey: 'test-key',
      projectId: 'test-project',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('AxonMemoryTool', () => {
    it('should perform vector search and format output', async () => {
      const searchResponse = {
        query: 'hello',
        results: [
          {
            id: 'mem-1',
            content: 'Found relevant info',
            tags: {},
            scope: 'agent',
            similarity: 0.952,
            agent_id: 'agent-1',
            created_at: '2026-06-14T12:00:00Z',
          },
        ],
      };
      mockFetch({ body: searchResponse });

      const tool = new AxonMemoryTool(axon);
      expect(tool.name).toBe('axon_memory_search');

      const result = await tool.call('hello');
      expect(result).toBe('- Found relevant info (similarity: 0.952)');

      const call = getLastFetchCall();
      expect(call.url).toBe('http://test:8000/v1/memory/search');
    });

    it('should return empty message if no results found', async () => {
      mockFetch({ body: { results: [], query: 'hello' } });

      const tool = new AxonMemoryTool(axon);
      const result = await tool.call('hello');
      expect(result).toBe('No matching memories found.');
    });
  });

  describe('AxonLockTool', () => {
    it('should acquire lock', async () => {
      mockFetch({
        body: {
          granted: true,
          resource_id: 'res-1',
          expires_at: '2026-06-14T13:00:00Z',
          message: 'granted',
        },
      });

      const tool = new AxonLockTool(axon);
      expect(tool.name).toBe('axon_coordination_lock');

      const result = await tool.call('acquire:res-1');
      expect(result).toContain("Lock acquired successfully for resource 'res-1'");
      expect(result).toContain('expires at: 2026-06-14T13:00:00Z');
    });

    it('should release lock', async () => {
      mockFetch({
        body: {
          released: true,
          resource_id: 'res-1',
          message: 'released',
        },
      });

      const tool = new AxonLockTool(axon);
      const result = await tool.call('release:res-1');
      expect(result).toContain("Lock on resource 'res-1' released successfully.");
    });
  });

  describe('AxonReceiptCallbackHandler', () => {
    it('should compile reasoning steps and create receipt', async () => {
      mockFetch({
        body: {
          receipt_id: 'rcpt-1234',
          chain_hash: 'abc',
          signature: 'sig',
          message: 'created',
        },
      });

      const handler = new AxonReceiptCallbackHandler(axon, 'Run input');
      handler.handleLLMStart({ name: 'gpt-4' }, ['System prompt...']);
      handler.handleLLMEnd({ generations: [[{ text: 'Generated answer' }]] } as any);
      handler.handleToolStart({ name: 'calculator' }, '2+2');
      handler.handleToolEnd('4');
      await handler.handleChainEnd({ result: 'final answer' });

      const call = getLastFetchCall();
      expect(call.url).toBe('http://test:8000/v1/receipts/create');
      expect(call.init.method).toBe('POST');

      const requestBody = JSON.parse(call.init.body as string);
      expect(requestBody.input).toBe('Run input');
      expect(requestBody.steps).toEqual([
        { thought: 'Calling LLM with prompt preview: System prompt...' },
        { thought: 'LLM responded: Generated answer' },
        {
          thought: "Invoking tool 'calculator' with parameter: 2+2",
          tool_called: 'calculator',
          result: '4',
        },
      ]);
      expect(requestBody.output).toBe(JSON.stringify({ result: 'final answer' }));
    });
  });
});
