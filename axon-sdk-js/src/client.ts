// ─── Axon Protocol SDK — Main Client ───

import type { AxonConfig, HealthResponse, HealthReadyResponse } from './types.js';
import { HttpClient } from './_base.js';
import { AgentsModule } from './agents.js';
import { MemoryModule } from './memory.js';
import { CoordinationModule } from './coordination.js';
import { ReceiptsModule } from './receipts.js';
import { EventsModule } from './events.js';
import { MessagesModule } from './messages.js';

/**
 * The main Axon Protocol client.
 *
 * ```ts
 * import { AxonClient } from 'axon-protocol';
 *
 * const axon = new AxonClient({
 *   baseUrl: 'http://localhost:8000', // default
 * });
 *
 * // Register a new agent (auto-stores API key)
 * const result = await axon.agents.register({
 *   name: 'planner',
 *   project_id: 'my-project',
 *   capabilities: ['planning', 'search'],
 * });
 *
 * // Or connect with existing credentials
 * const axon2 = new AxonClient({
 *   apiKey: 'your-api-key',
 *   projectId: 'my-project',
 * });
 *
 * // Use feature modules
 * await axon.memory.store({ content: 'Important context' });
 * const results = await axon.memory.search({ query: 'context' });
 * await axon.locks.acquire('shared-resource');
 * await axon.receipts.create({ input: '...', steps: [...], output: '...' });
 * ```
 */
export class AxonClient {
  private readonly http: HttpClient;

  /** Agent registration and management */
  public readonly agents: AgentsModule;

  /** Shared vector memory — store, search, retrieve, delete */
  public readonly memory: MemoryModule;

  /** Distributed resource locking */
  public readonly locks: CoordinationModule;

  /** Reasoning receipts — create, verify, chain */
  public readonly receipts: ReceiptsModule;

  /** Real-time event streaming via WebSocket */
  public readonly events: EventsModule;

  /** Agent-to-agent messaging bus */
  public readonly messages: MessagesModule;

  constructor(config: AxonConfig = {}) {
    this.http = new HttpClient(config);
    this.agents = new AgentsModule(this.http);
    this.memory = new MemoryModule(this.http);
    this.locks = new CoordinationModule(this.http);
    this.receipts = new ReceiptsModule(this.http);
    this.events = new EventsModule(this.http);
    this.messages = new MessagesModule(this.http);
  }

  /** Ping the server to check if it's alive. */
  async ping(): Promise<HealthResponse> {
    return this.http.get<HealthResponse>('/v1/health');
  }

  /** Check full server readiness (database, Redis, embedding model). */
  async health(): Promise<HealthReadyResponse> {
    return this.http.get<HealthReadyResponse>('/v1/health/ready');
  }

  /**
   * Manually set credentials if you already have them.
   * Useful when you've registered an agent previously and saved the API key.
   */
  setCredentials(apiKey: string, projectId: string): void {
    this.http.setCredentials(apiKey, projectId);
  }
}
