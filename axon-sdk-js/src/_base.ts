// ─── Axon Protocol SDK — Internal HTTP Client ───

import type { AxonConfig } from './types.js';
import {
  AxonError,
  AuthenticationError,
  NotFoundError,
  ConflictError,
  ValidationError,
  ServerError,
} from './exceptions.js';

const DEFAULT_BASE_URL = 'http://localhost:8000';
const DEFAULT_TIMEOUT = 30_000;

/**
 * Internal HTTP client that wraps native `fetch`.
 * Handles auth headers, JSON serialization, timeout via AbortController,
 * and maps HTTP error codes to typed exceptions.
 */
export class HttpClient {
  private readonly baseUrl: string;
  private readonly timeout: number;
  private apiKey: string | null;
  private projectId: string | null;
  private agentToken: string | null;

  constructor(config: AxonConfig = {}) {
    this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT;
    this.apiKey = config.apiKey ?? null;
    this.projectId = config.projectId ?? null;
    this.agentToken = config.agentToken ?? null;
  }

  /** Update credentials (used after agent registration). */
  setCredentials(apiKey: string, projectId: string): void {
    this.apiKey = apiKey;
    this.projectId = projectId;
  }

  setAgentToken(token: string): void {
    this.agentToken = token;
  }

  getAgentToken(): string | null {
    return this.agentToken;
  }

  getApiKey(): string | null {
    return this.apiKey;
  }

  getProjectId(): string | null {
    return this.projectId;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  /** Perform a typed HTTP request. */
  async request<T>(
    method: string,
    path: string,
    body?: unknown,
    queryParams?: Record<string, string>,
  ): Promise<T> {
    // Build URL
    let url = `${this.baseUrl}${path}`;
    if (queryParams) {
      const qs = new URLSearchParams(queryParams).toString();
      if (qs) url += `?${qs}`;
    }

    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    }
    if (this.agentToken) {
      headers['Authorization'] = `Bearer ${this.agentToken}`;
    }

    // Build request options
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    const init: RequestInit = {
      method,
      headers,
      signal: controller.signal,
    };

    if (body !== undefined && body !== null) {
      init.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, init);
      clearTimeout(timeoutId);

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return undefined as T;
      }

      return (await response.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof AxonError) {
        throw error;
      }

      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new AxonError(408, `Request timed out after ${this.timeout}ms`);
      }

      throw new AxonError(
        0,
        `Network error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // ── Convenience Methods ──

  async get<T>(path: string, queryParams?: Record<string, string>): Promise<T> {
    return this.request<T>('GET', path, undefined, queryParams);
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PUT', path, body);
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }

  // ── Error Mapping ──

  private async handleErrorResponse(response: Response): Promise<never> {
    let detail: string;
    try {
      const body = await response.json();
      detail = body.detail ?? body.message ?? JSON.stringify(body);
    } catch {
      detail = response.statusText || `HTTP ${response.status}`;
    }

    switch (response.status) {
      case 401:
        throw new AuthenticationError(detail);
      case 404:
        throw new NotFoundError(detail);
      case 409:
        throw new ConflictError(detail);
      case 422:
        throw new ValidationError(detail);
      default:
        if (response.status >= 500) {
          throw new ServerError(response.status, detail);
        }
        throw new AxonError(response.status, detail);
    }
  }
}
