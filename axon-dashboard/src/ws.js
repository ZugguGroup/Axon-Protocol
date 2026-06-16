import { BASE_URL, getCredentials } from './api.js';

let socket = null;
let listeners = [];
let reconnectTimer = null;

export function connect(projectId) {
  disconnect(); // Ensure any existing connection is cleaned up first

  let url;
  if (BASE_URL) {
    const wsProtocol = BASE_URL.startsWith('https') ? 'wss:' : 'ws:';
    const host = BASE_URL.replace(/^https?:\/\//, '');
    url = `${wsProtocol}//${host}/v1/events/${projectId}`;
  } else {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    url = `${protocol}//${location.host}/v1/events/${projectId}`;
  }

  const { apiKey } = getCredentials();
  if (apiKey) {
    url += `?token=${encodeURIComponent(apiKey)}`;
  }

  socket = new WebSocket(url);

  socket.onopen = () => {
    console.log('[Axon WS] Connected');
    notify({ type: 'ws.connected' });
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'ping' || data.type === 'connected') return;
      notify(data);
    } catch (e) {
      console.warn('[Axon WS] Invalid message:', event.data);
    }
  };

  socket.onclose = () => {
    console.log('[Axon WS] Disconnected, reconnecting in 3s...');
    notify({ type: 'ws.disconnected' });
    reconnectTimer = setTimeout(() => connect(projectId), 3000);
  };

  socket.onerror = (err) => {
    console.error('[Axon WS] Error:', err);
  };
}

export function disconnect() {
  clearTimeout(reconnectTimer);
  if (socket) {
    socket.onclose = null;
    socket.close();
    socket = null;
  }
}

export function subscribe(fn) {
  listeners.push(fn);
  return () => { listeners = listeners.filter(l => l !== fn); };
}

function notify(data) {
  listeners.forEach(fn => fn(data));
}
