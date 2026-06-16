// ─── Axon Protocol SDK — Events Module (WebSocket) ───

import type { HttpClient } from './_base.js';
import type { AxonEvent, EventHandler } from './types.js';

/**
 * Real-time event streaming via WebSocket.
 *
 * ```ts
 * axon.events.subscribe((event) => {
 *   console.log(`[${event.type}]`, event.data);
 * });
 *
 * await axon.events.connect();
 * // ... later ...
 * axon.events.disconnect();
 * ```
 */
export class EventsModule {
  private socket: WebSocket | null = null;
  private handlers: EventHandler[] = [];
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect = true;

  constructor(private readonly http: HttpClient) {}

  /**
   * Connect to the Axon event stream via WebSocket.
   * Automatically reconnects on disconnect unless `disconnect()` is called.
   */
  async connect(projectId?: string): Promise<void> {
    const pid = projectId ?? this.http.getProjectId();
    if (!pid) {
      throw new Error('Project ID required for event streaming. Register an agent first or pass projectId.');
    }

    const baseUrl = this.http.getBaseUrl();
    const wsUrl = baseUrl
      .replace(/^http/, 'ws')
      .replace(/\/+$/, '');

    const apiKey = this.http.getApiKey();
    let url = `${wsUrl}/v1/events/${pid}`;
    if (apiKey) {
      url += `?token=${encodeURIComponent(apiKey)}`;
    }

    this.shouldReconnect = true;
    this.createConnection(url);
  }

  /** Disconnect from the event stream and stop reconnecting. */
  disconnect(): void {
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.onclose = null;
      this.socket.close();
      this.socket = null;
    }
  }

  /**
   * Subscribe to events. Returns an unsubscribe function.
   *
   * ```ts
   * const unsub = axon.events.subscribe((event) => {
   *   if (event.type === 'lock.acquired') {
   *     console.log('Lock acquired:', event.data);
   *   }
   * });
   *
   * // Later: unsub();
   * ```
   */
  subscribe(handler: EventHandler): () => void {
    this.handlers.push(handler);
    return () => {
      this.handlers = this.handlers.filter((h) => h !== handler);
    };
  }

  /** Check if the WebSocket is currently connected. */
  get connected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  // ── Internal ──

  private createConnection(url: string): void {
    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      this.notifyHandlers({ type: 'ws.connected' });
    };

    this.socket.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data as string) as AxonEvent;
        if (data.type === 'ping' || data.type === 'connected') return;
        this.notifyHandlers(data);
      } catch {
        // Skip non-JSON messages
      }
    };

    this.socket.onclose = () => {
      this.notifyHandlers({ type: 'ws.disconnected' });
      if (this.shouldReconnect) {
        this.reconnectTimer = setTimeout(() => {
          this.createConnection(url);
        }, 3000);
      }
    };

    this.socket.onerror = () => {
      // Errors are followed by onclose, which handles reconnection
    };
  }

  private notifyHandlers(event: AxonEvent): void {
    for (const handler of this.handlers) {
      try {
        handler(event);
      } catch {
        // Don't let a handler error crash the stream
      }
    }
  }
}
