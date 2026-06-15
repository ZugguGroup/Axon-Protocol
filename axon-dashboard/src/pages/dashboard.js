import { el, mount } from '../utils/dom.js';
import { getState, watch, setState } from '../state.js';
import * as api from '../api.js';
import { createStatsCard } from '../components/stats-card.js';
import { formatDate } from '../utils/format.js';
import { createEventBadge } from '../components/event-badge.js';
import { register } from '../router.js';

// SVG Icons
const icons = {
  agents: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px;"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>`,
  memories: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px;"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>`,
  locks: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px;"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  receipts: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px;"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>`
};

export async function renderDashboard() {
  const container = document.getElementById('content');
  const state = getState();

  // Loading skeleton layout
  container.innerHTML = `
    <div class="page-header animate-fade-in">
      <div>
        <h1 class="page-title">Overview</h1>
        <p class="page-subtitle">Real-time status of the Axon multi-agent environment</p>
      </div>
    </div>
    <div class="grid-4">
      <div class="card skeleton skeleton-card"></div>
      <div class="card skeleton skeleton-card"></div>
      <div class="card skeleton skeleton-card"></div>
      <div class="card skeleton skeleton-card"></div>
    </div>
    <div class="grid-2 section-gap">
      <div class="card skeleton" style="height: 300px;"></div>
      <div class="card skeleton" style="height: 300px;"></div>
    </div>
  `;

  let agentCount = 0;
  let memoryCount = 0;
  let lockCount = 0;
  let receiptCount = 0;
  let healthReady = { status: 'offline', checks: { database: 'error', redis: 'error', embedding_model: 'error' } };

  if (state.serverOnline) {
    try {
      const agentsRes = await api.agents.list().catch(() => ({ agents: [] }));
      const memoriesRes = await api.memory.list().catch(() => ({ memories: [] }));
      const locksRes = await api.locks.list().catch(() => ({ locks: [] }));
      const receiptsRes = await api.receipts.list().catch(() => ({ receipts: [] }));
      healthReady = await api.health.ready().catch(() => ({ status: 'error', checks: { database: 'error', redis: 'error', embedding_model: 'error' } }));

      agentCount = agentsRes.agents?.length || 0;
      memoryCount = memoriesRes.memories?.length || 0;
      lockCount = locksRes.locks?.length || 0;
      receiptCount = receiptsRes.receipts?.length || 0;

      setState('agentCount', agentCount);
      setState('memoryCount', memoryCount);
      setState('lockCount', lockCount);
      setState('receiptCount', receiptCount);
    } catch (e) {
      console.error('Error fetching dashboard stats:', e);
    }
  }

  // Clear container to load real UI
  container.innerHTML = '';

  const header = el('div', { className: 'page-header animate-fade-in' },
    el('div', {},
      el('h1', { className: 'page-title', textContent: 'Overview' }),
      el('p', { className: 'page-subtitle', textContent: 'Real-time status of the Axon multi-agent environment' })
    )
  );

  const statsGrid = el('div', { className: 'grid-4 animate-fade-in-up stagger-1' },
    createStatsCard('Total Agents', agentCount, 'purple', icons.agents, 'Registered project-wide'),
    createStatsCard('Stored Memories', memoryCount, 'green', icons.memories, 'Semantic vectors in pgvector'),
    createStatsCard('Active Locks', lockCount, 'blue', icons.locks, 'Synchronized resources'),
    createStatsCard('Chained Receipts', receiptCount, 'amber', icons.receipts, 'Cryptographic reasoning logs')
  );

  // Health check list
  const getStatusBadge = (ok) => {
    return ok 
      ? el('span', { className: 'badge badge-success', textContent: 'Healthy' })
      : el('span', { className: 'badge badge-error', textContent: 'Unreachable' });
  };

  const healthCard = el('div', { className: 'card animate-fade-in-up stagger-2' },
    el('div', { className: 'card-header' },
      el('span', { className: 'card-title', textContent: 'Backend Dependency Health' })
    ),
    el('div', { style: 'display: flex; flex-direction: column; gap: var(--space-md); margin-top: var(--space-md);' },
      el('div', { style: 'display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-color); padding-bottom: var(--space-sm);' },
        el('span', { textContent: 'Primary Database' }),
        getStatusBadge(healthReady.checks?.database === 'ok')
      ),
      el('div', { style: 'display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-color); padding-bottom: var(--space-sm);' },
        el('span', { textContent: 'Redis Caching & PubSub' }),
        getStatusBadge(healthReady.checks?.redis === 'ok')
      ),
      el('div', { style: 'display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-color); padding-bottom: var(--space-sm);' },
        el('span', { textContent: 'SentenceTransformers (Embeddings)' }),
        getStatusBadge(healthReady.checks?.embedding_model === 'ok' || healthReady.status === 'ready')
      ),
      el('div', { style: 'display: flex; align-items: center; justify-content: space-between;' },
        el('span', { textContent: 'API Server Status' }),
        el('span', { 
          className: `badge ${state.serverOnline ? 'badge-success' : 'badge-error'}`,
          textContent: state.serverOnline ? 'Online' : 'Offline'
        })
      )
    )
  );

  // Activity list
  const activityList = el('div', { className: 'event-log' });

  const renderRecentEvents = () => {
    activityList.innerHTML = '';
    const recent = state.events.slice(0, 10);
    if (recent.length === 0) {
      activityList.appendChild(
        el('div', { style: 'padding: var(--space-xl); text-align: center; color: var(--text-muted); font-size: 13px;', textContent: 'No recent events. Actions will stream here in real time.' })
      );
      return;
    }
    recent.forEach(ev => {
      activityList.appendChild(
        el('div', { className: 'event-item' },
          el('span', { className: 'event-time', textContent: formatDate(ev.timestamp || new Date()) }),
          el('span', { className: 'event-type' }, createEventBadge(ev.type)),
          el('span', { className: 'event-detail mono', textContent: JSON.stringify(ev.payload || ev) })
        )
      );
    });
  };

  renderRecentEvents();

  const activityCard = el('div', { className: 'card animate-fade-in-up stagger-3' },
    el('div', { className: 'card-header' },
      el('span', { className: 'card-title', textContent: 'Live Environment Activity' })
    ),
    activityList
  );

  const bottomGrid = el('div', { className: 'grid-2 section-gap' }, healthCard, activityCard);

  mount(container, header, statsGrid, bottomGrid);

  // Re-render activity log if state.events changes
  const unsubscribe = watch('events', () => {
    if (document.getElementById('content').contains(activityList)) {
      renderRecentEvents();
    }
  });

  // Clean up watchers when page changes
  const checkPageChange = () => {
    if (!document.getElementById('content').contains(activityList)) {
      unsubscribe();
      window.removeEventListener('hashchange', checkPageChange);
    }
  };
  window.addEventListener('hashchange', checkPageChange);
}

// Register overview route
register('dashboard', renderDashboard);
