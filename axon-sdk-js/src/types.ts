// ─── Axon Protocol SDK Types ───
// All interfaces mirror the axon-core API response shapes exactly.

/** Configuration options for the AxonClient. */
export interface AxonConfig {
  /** Base URL of the axon-core server (default: http://localhost:8000) */
  baseUrl?: string;
  /** API key returned from agent registration */
  apiKey?: string;
  /** Project ID for multi-tenant scoping */
  projectId?: string;
  /** Agent token JWT returned from agent registration */
  agentToken?: string;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
}

// ─── Agent Types ───

export interface Agent {
  id: string;
  name: string;
  project_id: string;
  capabilities: string[];
  status: string;
  api_key_hash: string;
  last_seen_at: string | null;
  created_at: string;
}

export interface RegisterAgentRequest {
  name: string;
  project_id: string;
  capabilities?: string[];
}

export interface RegisterAgentResponse {
  agent_id?: string;
  id?: string;
  api_key?: string;
  token?: string;
  message?: string;
}

export interface AgentListResponse {
  agents: Agent[];
}

// ─── Memory Types ───

export interface MemoryEntry {
  id: string;
  content: string;
  tags: Record<string, string>;
  scope: string;
  agent_id: string;
  project_id: string;
  created_at: string;
}

export interface StoreMemoryRequest {
  content: string;
  tags?: Record<string, string>;
  scope?: 'agent' | 'project' | 'global';
  ttl?: number | null;
}

export interface StoreMemoryResponse {
  memory_id: string;
  message: string;
}

export interface SearchMemoryRequest {
  query: string;
  limit?: number;
  min_similarity?: number;
}

export interface SearchResult {
  id: string;
  content: string;
  tags: Record<string, string>;
  scope: string;
  similarity: number;
  agent_id: string;
  created_at: string;
}

export interface SearchMemoryResponse {
  results: SearchResult[];
  query: string;
}

export interface MemoryListResponse {
  memories: MemoryEntry[];
  total: number;
}

// ─── Lock Types ───

export interface Lock {
  resource_id: string;
  holder_agent_id: string;
  locked_at: string;
  expires_at: string;
}

export interface AcquireLockRequest {
  resource_id: string;
  timeout?: number;
}

export interface AcquireLockResponse {
  granted: boolean;
  resource_id: string;
  expires_at: string;
  message: string;
}

export interface ReleaseLockResponse {
  released: boolean;
  resource_id: string;
  message: string;
}

export interface LockStatusResponse {
  locked: boolean;
  resource_id: string;
  holder_agent_id?: string;
  expires_at?: string;
}

export interface LockListResponse {
  locks: Lock[];
}

// ─── Receipt Types ───

export interface ReasoningStep {
  thought: string;
  tool_called?: string;
  result?: string;
}

export interface Receipt {
  id: string;
  agent_id: string;
  input_text: string;
  steps: ReasoningStep[];
  output_text: string;
  chain_hash: string;
  signature: string;
  previous_receipt_id: string | null;
  created_at: string;
}

export interface CreateReceiptRequest {
  input: string;
  steps: ReasoningStep[];
  output: string;
}

export interface CreateReceiptResponse {
  receipt_id: string;
  chain_hash: string;
  signature: string;
  message: string;
}

export interface VerifyReceiptResponse {
  valid: boolean;
  receipt_id: string;
  message: string;
}

export interface ReceiptListResponse {
  receipts: Array<{
    id: string;
    agent_id: string;
    input_text: string;
    chain_hash: string;
    signature: string;
    created_at: string;
  }>;
}

// ─── Health Types ───

export interface HealthResponse {
  status: string;
  timestamp: string;
}

export interface HealthReadyResponse {
  status: string;
  database: string;
  redis: string;
  embedding_model: string;
}

// ─── Event Types ───

export interface AxonEvent {
  type: string;
  project_id?: string;
  agent_id?: string;
  data?: Record<string, unknown>;
  timestamp?: string;
}

export type EventHandler = (event: AxonEvent) => void;

// ─── Message Types ───

export interface MessageSendRequest {
  recipient_id?: string;
  topic?: string;
  payload?: Record<string, any>;
}

export interface MessageSendResponse {
  message_id: string;
  status: string;
  created_at: string;
}

export interface MessageInfo {
  id: string;
  sender_id: string;
  recipient_id: string | null;
  project_id: string;
  topic: string | null;
  payload: Record<string, any>;
  status: string;
  created_at: string;
}

