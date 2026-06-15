import { el, mount } from '../utils/dom.js';
import { getState, watch } from '../state.js';
import { currentRoute } from '../router.js';
import { shortId } from '../utils/format.js';

const pageTitles = {
  dashboard: 'System Overview',
  agents: 'Agent Management',
  memories: 'Semantic Memory Browser',
  locks: 'Resource Coordination Locks',
  receipts: 'Reasoning Receipts Registry',
  'receipt-detail': 'Reasoning Receipt Inspection',
  events: 'Live WebSocket Event Log'
};

export function renderHeader() {
  const activePage = currentRoute();
  const titleText = pageTitles[activePage] || 'Axon Dashboard';
  const state = getState();

  const titleEl = el('div', { className: 'header-title' }, titleText);

  const statusIndicator = el('div', { className: 'header-right' },
    el('div', {
      className: `status-dot ${state.serverOnline ? 'online' : 'offline'}`
    }),
    el('span', {
      className: 'mono',
      textContent: state.serverOnline ? 'SERVER: ONLINE' : 'SERVER: OFFLINE',
      style: `color: ${state.serverOnline ? 'var(--color-success)' : 'var(--color-error)'}; font-size: 11px; font-weight: 600; margin-right: var(--space-md);`
    }),
    el('div', {
      style: 'display: flex; align-items: center; gap: 8px; background: #050507; padding: 4px 12px; border-radius: var(--radius-full); border: 1px solid var(--border-color); cursor: pointer;'
    },
      el('span', {
        className: 'mono',
        style: 'font-size: 11px; color: var(--text-secondary);',
        textContent: `PROJECT: ${state.credentials.projectId ? shortId(state.credentials.projectId) : 'None'}`
      })
    )
  );

  mount('#header', titleEl, statusIndicator);
}

// Watch state changes that affect header
watch('serverOnline', renderHeader);
watch('credentials', renderHeader);
window.addEventListener('hashchange', renderHeader);
