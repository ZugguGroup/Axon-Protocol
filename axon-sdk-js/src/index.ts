// ─── Axon Protocol SDK — Public API ───
// Everything exported from here is the public surface of `axon-protocol`.

export { AxonClient } from './client.js';

// Types
export type {
  AxonConfig,
  Agent,
  RegisterAgentRequest,
  RegisterAgentResponse,
  AgentListResponse,
  MemoryEntry,
  StoreMemoryRequest,
  StoreMemoryResponse,
  SearchMemoryRequest,
  SearchResult,
  SearchMemoryResponse,
  MemoryListResponse,
  Lock,
  AcquireLockRequest,
  AcquireLockResponse,
  ReleaseLockResponse,
  LockStatusResponse,
  LockListResponse,
  ReasoningStep,
  Receipt,
  CreateReceiptRequest,
  CreateReceiptResponse,
  VerifyReceiptResponse,
  ReceiptListResponse,
  HealthResponse,
  HealthReadyResponse,
  AxonEvent,
  EventHandler,
  MessageSendRequest,
  MessageSendResponse,
  MessageInfo,
} from './types.js';

// Exceptions
export {
  AxonError,
  AuthenticationError,
  NotFoundError,
  ConflictError,
  ValidationError,
  ServerError,
} from './exceptions.js';

// Module classes (for advanced usage / type-checking)
export { AgentsModule } from './agents.js';
export { MemoryModule } from './memory.js';
export { CoordinationModule } from './coordination.js';
export { ReceiptsModule } from './receipts.js';
export { EventsModule } from './events.js';
export { MessagesModule } from './messages.js';

// Integrations
export {
  AxonMemoryTool,
  AxonLockTool,
  AxonReceiptCallbackHandler,
} from './integrations/langchain.js';
