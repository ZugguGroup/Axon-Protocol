// ─── Axon Protocol SDK — Memory Module ───

import type { HttpClient } from './_base.js';
import type {
  StoreMemoryRequest,
  StoreMemoryResponse,
  SearchMemoryRequest,
  SearchMemoryResponse,
  MemoryEntry,
  MemoryListResponse,
} from './types.js';

/**
 * Shared vector memory — store, search, retrieve, and delete.
 *
 * ```ts
 * await axon.memory.store({ content: 'User prefers dark mode' });
 * const results = await axon.memory.search({ query: 'user preferences' });
 * ```
 */
export class MemoryModule {
  constructor(private readonly http: HttpClient) {}

  /** Store a new memory entry with optional tags, scope, and TTL. */
  async store(request: StoreMemoryRequest): Promise<StoreMemoryResponse> {
    return this.http.post<StoreMemoryResponse>('/v1/memory/store', {
      content: request.content,
      tags: request.tags ?? {},
      scope: request.scope ?? 'project',
      ttl: request.ttl ?? null,
    });
  }

  /** Semantic search over stored memories. */
  async search(request: SearchMemoryRequest): Promise<SearchMemoryResponse> {
    return this.http.post<SearchMemoryResponse>('/v1/memory/search', {
      query: request.query,
      limit: request.limit ?? 20,
      min_similarity: request.min_similarity ?? 0.3,
    });
  }

  /** Get a specific memory entry by ID. */
  async get(memoryId: string): Promise<MemoryEntry> {
    return this.http.get<MemoryEntry>(`/v1/memory/${memoryId}`);
  }

  /** Delete a specific memory entry by ID. */
  async delete(memoryId: string): Promise<{ message: string }> {
    return this.http.delete<{ message: string }>(`/v1/memory/${memoryId}`);
  }

  /** List all memories in the current project. */
  async list(limit = 50): Promise<MemoryListResponse> {
    return this.http.get<MemoryListResponse>('/v1/memory/list', {
      limit: String(limit),
    });
  }
}
