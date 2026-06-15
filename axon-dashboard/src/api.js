const BASE_URL = '';  // Empty string = uses Vite proxy in dev

let currentApiKey = null;
let currentProjectId = null;
let currentUserToken = null;

export function setCredentials(apiKey, projectId, userToken = null) {
  currentApiKey = apiKey;
  currentProjectId = projectId;
  if (userToken) {
    currentUserToken = userToken;
    localStorage.setItem('axon_user_token', userToken);
  }
  if (apiKey) localStorage.setItem('axon_api_key', apiKey);
  if (projectId) localStorage.setItem('axon_project_id', projectId);
}

export function clearCredentials() {
  currentApiKey = null;
  currentProjectId = null;
  currentUserToken = null;
  localStorage.removeItem('axon_api_key');
  localStorage.removeItem('axon_project_id');
  localStorage.removeItem('axon_user_token');
}

export function getCredentials() {
  return { apiKey: currentApiKey, projectId: currentProjectId, userToken: currentUserToken };
}

async function request(method, path, body = null) {
  const headers = { 'Content-Type': 'application/json' };
  
  // Try loading user token from localStorage if not set in memory
  if (!currentUserToken) {
    currentUserToken = localStorage.getItem('axon_user_token');
  }
  if (!currentApiKey) {
    currentApiKey = localStorage.getItem('axon_api_key');
  }
  if (!currentProjectId) {
    currentProjectId = localStorage.getItem('axon_project_id');
  }

  if (currentApiKey) headers['X-API-Key'] = currentApiKey;
  if (currentUserToken) headers['Authorization'] = `Bearer ${currentUserToken}`;

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const response = await fetch(`${BASE_URL}${path}`, opts);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

// ── Auth ──
export const auth = {
  signup: (email, password) => request('POST', '/v1/auth/signup', { email, password }),
  login: (email, password) => request('POST', '/v1/auth/login', { email, password }),
  me: () => request('GET', '/v1/auth/me'),
};

// ── Projects ──
export const projects = {
  create: (name) => request('POST', '/v1/projects', { name }),
  list: () => request('GET', '/v1/projects'),
  rotateKey: (projectId) => request('POST', `/v1/projects/${projectId}/rotate-key`),
  delete: (projectId) => request('DELETE', `/v1/projects/${projectId}`),
};

// ── Billing ──
export const billing = {
  checkout: (baseUrl) => request('POST', '/v1/billing/checkout', { base_url: baseUrl }),
  portal: (baseUrl) => request('POST', '/v1/billing/portal', { base_url: baseUrl }),
};

// ── Health ──
export const health = {
  ping: () => request('GET', '/v1/health'),
  ready: () => request('GET', '/v1/health/ready'),
};

// ── Agents ──
export const agents = {
  register: (name, projectId, capabilities = []) =>
    request('POST', '/v1/agents/register', { name, project_id: projectId, capabilities }),
  me: () => request('GET', '/v1/agents/me'),
  list: () => request('GET', '/v1/agents/list'),
  delete: (agentId) => request('DELETE', `/v1/agents/${agentId}`),
};

// ── Memory ──
export const memory = {
  store: (content, tags = {}, scope = 'project', ttl = null) =>
    request('POST', '/v1/memory/store', { content, tags, scope, ttl }),
  search: (query, limit = 20, minSimilarity = 0.3) =>
    request('POST', '/v1/memory/search', { query, limit, min_similarity: minSimilarity }),
  list: () => request('GET', '/v1/memory/list'),
  get: (memoryId) => request('GET', `/v1/memory/${memoryId}`),
  delete: (memoryId) => request('DELETE', `/v1/memory/${memoryId}`),
};

// ── Locks ──
export const locks = {
  acquire: (resourceId, timeout = 300) =>
    request('POST', '/v1/lock/acquire', { resource_id: resourceId, timeout }),
  release: (resourceId) =>
    request('POST', `/v1/lock/release?resource_id=${resourceId}`),
  status: (resourceId) => request('GET', `/v1/lock/status/${resourceId}`),
  list: () => request('GET', '/v1/lock/list'),
};

// ── Receipts ──
export const receipts = {
  create: (input, steps, output) =>
    request('POST', '/v1/receipts/create', { input, steps, output }),
  get: (receiptId) => request('GET', `/v1/receipts/${receiptId}`),
  verify: (receiptId) =>
    request('POST', `/v1/receipts/verify?receipt_id=${receiptId}`),
  list: () => request('GET', '/v1/receipts/list'),
};

// ── Messages ──
export const messages = {
  send: (recipientId, topic, payload) =>
    request('POST', '/v1/messages/send', { recipient_id: recipientId, topic, payload }),
  inbox: (topic = null, limit = 50) => {
    const params = new URLSearchParams({ limit });
    if (topic) params.append('topic', topic);
    return request('GET', `/v1/messages/inbox?${params.toString()}`);
  },
  ack: (messageId) =>
    request('POST', `/v1/messages/ack?message_id=${messageId}`),
};
