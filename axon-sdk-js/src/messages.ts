// ─── Axon Protocol SDK — Messages Module ───

import type { HttpClient } from './_base.js';
import type { MessageSendRequest, MessageSendResponse, MessageInfo } from './types.js';

export class MessagesModule {
  constructor(private readonly http: HttpClient) {}

  /**
   * Send a direct message or publish to a topic.
   */
  async send(request: MessageSendRequest): Promise<MessageSendResponse> {
    return this.http.post<MessageSendResponse>('/v1/messages/send', request);
  }

  /**
   * Retrieve direct messages or topic updates in the inbox.
   */
  async inbox(params: { topic?: string; limit?: number } = {}): Promise<MessageInfo[]> {
    const queryParams: Record<string, string> = {};
    if (params.limit !== undefined) {
      queryParams.limit = String(params.limit);
    }
    if (params.topic !== undefined) {
      queryParams.topic = params.topic;
    }
    const res = await this.http.get<{ messages: MessageInfo[] }>('/v1/messages/inbox', queryParams);
    return res.messages ?? [];
  }

  /**
   * Acknowledge a received message.
   */
  async ack(messageId: string): Promise<boolean> {
    const res = await this.http.request<{ acknowledged: boolean }>(
      'POST',
      '/v1/messages/ack',
      undefined,
      { message_id: messageId }
    );
    return res.acknowledged ?? false;
  }
}
