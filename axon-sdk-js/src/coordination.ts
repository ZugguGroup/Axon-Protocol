// ─── Axon Protocol SDK — Coordination Module (Locks) ───

import type { HttpClient } from './_base.js';
import type {
  AcquireLockResponse,
  ReleaseLockResponse,
  LockStatusResponse,
  LockListResponse,
} from './types.js';

/**
 * Distributed resource locking for multi-agent coordination.
 *
 * ```ts
 * // Acquire a lock
 * const lock = await axon.locks.acquire('shared-resource', 300);
 *
 * // Do exclusive work...
 *
 * // Release
 * await axon.locks.release('shared-resource');
 * ```
 */
export class CoordinationModule {
  constructor(private readonly http: HttpClient) {}

  /**
   * Acquire an exclusive lock on a resource.
   * @param resourceId - Unique identifier for the resource to lock
   * @param timeout - Lock duration in seconds (default: 300 = 5 minutes)
   */
  async acquire(resourceId: string, timeout = 300): Promise<AcquireLockResponse> {
    return this.http.post<AcquireLockResponse>('/v1/lock/acquire', {
      resource_id: resourceId,
      timeout,
    });
  }

  /**
   * Release a previously acquired lock.
   * @param resourceId - The resource ID to release
   */
  async release(resourceId: string): Promise<ReleaseLockResponse> {
    return this.http.post<ReleaseLockResponse>(
      `/v1/lock/release?resource_id=${encodeURIComponent(resourceId)}`,
    );
  }

  /**
   * Check the lock status of a resource.
   * @param resourceId - The resource ID to check
   */
  async status(resourceId: string): Promise<LockStatusResponse> {
    return this.http.get<LockStatusResponse>(
      `/v1/lock/status/${encodeURIComponent(resourceId)}`,
    );
  }

  /** List all active locks in the current project. */
  async list(): Promise<LockListResponse> {
    return this.http.get<LockListResponse>('/v1/lock/list');
  }

  /**
   * Convenience: acquire a lock, run a callback, then release the lock.
   * Guarantees release even if the callback throws.
   *
   * ```ts
   * await axon.locks.withLock('db-migration', async () => {
   *   await runMigrations();
   * });
   * ```
   */
  async withLock<T>(
    resourceId: string,
    fn: () => Promise<T>,
    timeout = 300,
  ): Promise<T> {
    await this.acquire(resourceId, timeout);
    try {
      return await fn();
    } finally {
      await this.release(resourceId);
    }
  }
}
