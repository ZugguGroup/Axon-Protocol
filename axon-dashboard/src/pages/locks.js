import { el, mount } from '../utils/dom.js';
import { getState } from '../state.js';
import * as api from '../api.js';
import { openModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { createEmptyState } from '../components/empty-state.js';
import { createSkeletonTable } from '../components/loading-spinner.js';
import { formatDate, shortId, countdown } from '../utils/format.js';
import { register } from '../router.js';

export async function renderLocks() {
  const container = document.getElementById('content');
  const state = getState();

  container.innerHTML = `
    <div class="page-header animate-fade-in">
      <div>
        <h1 class="page-title">Active Coordination Locks</h1>
        <p class="page-subtitle">Inspect active locks and prevent race conditions between agents</p>
      </div>
      <button class="btn btn-secondary" id="btn-refresh-locks">Refresh</button>
    </div>
    <div id="locks-table-container" class="animate-fade-in-up stagger-1"></div>
  `;

  document.getElementById('btn-refresh-locks').onclick = fetchAndRender;

  const tableContainer = document.getElementById('locks-table-container');
  let countdownTimer = null;
  let refreshTimer = null;

  await fetchAndRender();

  // Fresh fetch and re-render
  async function fetchAndRender() {
    // Stop any running ticking
    clearInterval(countdownTimer);

    if (!state.serverOnline) {
      mount(tableContainer, createEmptyState('Server Offline', 'Cannot fetch locks when core server is offline.'));
      return;
    }

    try {
      const res = await api.locks.list();
      const locks = res.locks || [];

      if (locks.length === 0) {
        mount(tableContainer, createEmptyState(
          'No Active Locks',
          'All resources are currently unlocked. Agents can coordinate locks via the SDK.',
          `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:48px;height:48px;"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`
        ));
        return;
      }

      // Build rows with countdown elements
      const rows = locks.map(lock => {
        const expiresAt = lock.expires_at;
        const countdownEl = el('span', { className: 'countdown' });

        // Tick once immediately
        updateRowCountdown(countdownEl, expiresAt);

        return {
          lock,
          el: el('tr', {},
            el('td', { className: 'mono', style: 'font-weight: 600; color: var(--text-primary);', textContent: lock.resource_id }),
            el('td', { className: 'mono', textContent: shortId(lock.agent_id) }),
            el('td', { textContent: formatDate(lock.acquired_at) }),
            el('td', { textContent: formatDate(lock.expires_at) }),
            el('td', {}, countdownEl),
            el('td', { style: 'text-align: right;' },
              el('button', {
                className: 'btn btn-danger btn-sm',
                textContent: 'Release',
                onclick: () => confirmRelease(lock.resource_id)
              })
            )
          ),
          countdownEl,
          expiresAt
        };
      });

      const table = el('table', {},
        el('thead', {},
          el('tr', {},
            el('th', { textContent: 'Resource ID' }),
            el('th', { textContent: 'Holder Agent ID' }),
            el('th', { textContent: 'Acquired At' }),
            el('th', { textContent: 'Expires At' }),
            el('th', { textContent: 'Time Remaining' }),
            el('th', { textContent: 'Actions', style: 'text-align: right;' })
          )
        ),
        el('tbody', {}, ...rows.map(r => r.el))
      );

      mount(tableContainer, el('div', { className: 'table-container' }, table));

      // Start counting down every second
      countdownTimer = setInterval(() => {
        rows.forEach(r => updateRowCountdown(r.countdownEl, r.expiresAt));
      }, 1000);

    } catch (e) {
      mount(tableContainer, createEmptyState('Failed to load locks', e.message));
    }
  }

  function updateRowCountdown(element, expiresAt) {
    const info = countdown(expiresAt);
    element.textContent = info.text;
    element.className = `countdown ${info.status}`;
  }

  function confirmRelease(resourceId) {
    const text = el('p', { textContent: `Are you sure you want to force release the lock on "${resourceId}"? This may cause race conditions if the holder agent is still running.` });
    openModal('Force Release Lock', text, async () => {
      try {
        await api.locks.release(resourceId);
        showToast('Lock released successfully!', 'success');
        await fetchAndRender();
        return true;
      } catch (e) {
        showToast(`Release failed: ${e.message}`, 'error');
        return false;
      }
    }, 'Release');
  }

  // Auto-refresh locks list every 10 seconds
  refreshTimer = setInterval(fetchAndRender, 10000);

  // Cleanup timers on route change
  const checkPageChange = () => {
    if (!document.getElementById('locks-table-container')) {
      clearInterval(countdownTimer);
      clearInterval(refreshTimer);
      window.removeEventListener('hashchange', checkPageChange);
    }
  };
  window.addEventListener('hashchange', checkPageChange);
}

// Register locks route
register('locks', renderLocks);
