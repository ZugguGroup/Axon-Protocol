// ─── Axon Protocol SDK — Agents Module ───

import type { HttpClient } from './_base.js';
import type {
  RegisterAgentRequest,
  RegisterAgentResponse,
  Agent,
  AgentListResponse,
} from './types.js';

/**
 * Agent registration and management.
 *
 * ```ts
 * const axon = new AxonClient();
 * const result = await axon.agents.register({
 *   name: 'planner',
 *   project_id: 'my-project',
 *   capabilities: ['planning', 'search'],
 * });
 * console.log(result.api_key); // save this!
 * ```
 */
export class AgentsModule {
  constructor(private readonly http: HttpClient) {}

  /**
   * Register a new agent with the Axon server.
   * Returns the agent ID and API key. The SDK automatically stores
   * the API key for subsequent requests.
   */
  async register(request: RegisterAgentRequest): Promise<RegisterAgentResponse> {
    const result = await this.http.post<RegisterAgentResponse>(
      '/v1/agents/register',
      {
        name: request.name,
        project_id: request.project_id,
        capabilities: request.capabilities ?? [],
      },
    );

    // Auto-store credentials for subsequent calls
    if (result.token) {
      this.http.setAgentToken(result.token);
    }
    const keyToStore = result.api_key || this.http.getApiKey() || '';
    this.http.setCredentials(keyToStore, request.project_id);

    return result;
  }

  /** Get the currently authenticated agent's profile. */
  async me(): Promise<Agent> {
    return this.http.get<Agent>('/v1/agents/me');
  }

  /** List all agents in the current project. */
  async list(): Promise<AgentListResponse> {
    return this.http.get<AgentListResponse>('/v1/agents/list');
  }
}
