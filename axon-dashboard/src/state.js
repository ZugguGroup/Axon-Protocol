const state = {
  serverOnline: false,
  currentPage: 'dashboard',
  agentCount: 0,
  memoryCount: 0,
  lockCount: 0,
  receiptCount: 0,
  events: [],
  credentials: { apiKey: null, projectId: null },
};

const watchers = new Map();

export function getState() { return state; }

export function setState(key, value) {
  state[key] = value;
  if (watchers.has(key)) {
    watchers.get(key).forEach(fn => fn(value));
  }
}

export function watch(key, fn) {
  if (!watchers.has(key)) watchers.set(key, []);
  watchers.get(key).push(fn);
  return () => {
    const arr = watchers.get(key);
    watchers.set(key, arr.filter(f => f !== fn));
  };
}
