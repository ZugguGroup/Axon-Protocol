// ─── Axon Protocol SDK — Receipts Module ───

import type { HttpClient } from './_base.js';
import type {
  CreateReceiptRequest,
  CreateReceiptResponse,
  Receipt,
  VerifyReceiptResponse,
  ReceiptListResponse,
} from './types.js';

/**
 * Reasoning receipts — create, retrieve, verify, and list.
 * Receipts form an immutable chain of reasoning steps,
 * signed with HMAC to detect tampering.
 *
 * ```ts
 * const receipt = await axon.receipts.create({
 *   input: 'User asked about weather',
 *   steps: [
 *     { thought: 'Need to call weather API', tool_called: 'weather_api', result: '72°F sunny' },
 *   ],
 *   output: 'It is 72°F and sunny today.',
 * });
 *
 * const verification = await axon.receipts.verify(receipt.receipt_id);
 * console.log(verification.valid); // true
 * ```
 */
export class ReceiptsModule {
  constructor(private readonly http: HttpClient) {}

  /** Create a new reasoning receipt with chained integrity hash. */
  async create(request: CreateReceiptRequest): Promise<CreateReceiptResponse> {
    return this.http.post<CreateReceiptResponse>('/v1/receipts/create', {
      input: request.input,
      steps: request.steps,
      output: request.output,
    });
  }

  /** Retrieve a specific receipt by ID. */
  async get(receiptId: string): Promise<Receipt> {
    return this.http.get<Receipt>(`/v1/receipts/${receiptId}`);
  }

  /**
   * Verify the integrity of a receipt's chain hash and signature.
   * Returns `{ valid: true }` if the receipt has not been tampered with.
   */
  async verify(receiptId: string): Promise<VerifyReceiptResponse> {
    return this.http.post<VerifyReceiptResponse>(
      `/v1/receipts/verify?receipt_id=${encodeURIComponent(receiptId)}`,
    );
  }

  /** List all receipts in the current project. */
  async list(limit = 50): Promise<ReceiptListResponse> {
    return this.http.get<ReceiptListResponse>('/v1/receipts/list', {
      limit: String(limit),
    });
  }
}
