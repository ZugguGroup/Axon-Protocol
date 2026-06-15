import { el, mount } from '../utils/dom.js';
import { getState, setState } from '../state.js';
import * as api from '../api.js';
import { showToast } from '../components/toast.js';
import { createEmptyState } from '../components/empty-state.js';
import { createSkeletonTable } from '../components/loading-spinner.js';
import { formatDate, shortId, truncate } from '../utils/format.js';
import { register, navigate } from '../router.js';

export async function renderReceipts() {
  const container = document.getElementById('content');
  const state = getState();

  container.innerHTML = `
    <div class="page-header animate-fade-in">
      <div>
        <h1 class="page-title">Reasoning Receipts</h1>
        <p class="page-subtitle">Cryptographically chain and verify agent reasoning steps</p>
      </div>
    </div>
    <div id="receipts-table-container" class="animate-fade-in-up stagger-1"></div>
  `;

  const tableContainer = document.getElementById('receipts-table-container');
  mount(tableContainer, createSkeletonTable(5, 5));

  if (!state.serverOnline) {
    mount(tableContainer, createEmptyState('Server Offline', 'Cannot fetch receipts when core server is offline.'));
    return;
  }

  try {
    const res = await api.receipts.list();
    const receipts = res.receipts || [];

    if (receipts.length === 0) {
      mount(tableContainer, createEmptyState(
        'No Reasoning Receipts Found',
        'Agents write receipts containing steps and signatures. No receipts are logged for this project yet.',
        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:48px;height:48px;"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>`
      ));
      return;
    }

    const table = el('table', {},
      el('thead', {},
        el('tr', {},
          el('th', { textContent: 'Receipt ID' }),
          el('th', { textContent: 'Agent ID' }),
          el('th', { textContent: 'Input Summary' }),
          el('th', { textContent: 'Cryptographic Chain Hash' }),
          el('th', { textContent: 'Created' }),
          el('th', { textContent: 'Verification' }),
          el('th', { textContent: 'Actions', style: 'text-align: right;' })
        )
      ),
      el('tbody', {},
        ...receipts.map(r => {
          const verifyStatusEl = el('span', { className: 'badge badge-info', textContent: 'Unverified' });

          const row = el('tr', { 
            style: 'cursor: pointer;',
            onclick: (e) => {
              // Ignore if clicking on button/actions
              if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
              setState('inspectedReceiptId', r.id);
              navigate('receipt-detail');
            }
          },
            el('td', { style: 'font-weight: 600; color: var(--accent-primary);' }, shortId(r.id)),
            el('td', { className: 'mono', textContent: shortId(r.agent_id) }),
            el('td', { textContent: truncate(r.input_text || '—', 50) }),
            el('td', { className: 'mono', style: 'font-size: 11px; opacity: 0.8;', textContent: shortId(r.chain_hash) }),
            el('td', { textContent: formatDate(r.created_at) }),
            el('td', {}, verifyStatusEl),
            el('td', { style: 'text-align: right;' },
              el('button', {
                className: 'btn btn-secondary btn-sm',
                textContent: 'Verify',
                onclick: async (e) => {
                  e.stopPropagation();
                  verifyStatusEl.textContent = 'Verifying...';
                  verifyStatusEl.className = 'badge badge-warning';
                  try {
                    const verification = await api.receipts.verify(r.id);
                    if (verification.valid) {
                      verifyStatusEl.textContent = 'Verified (Valid)';
                      verifyStatusEl.className = 'badge badge-success';
                      showToast(`Receipt ${shortId(r.id)} is cryptographically secure.`, 'success');
                    } else {
                      verifyStatusEl.textContent = 'TAMPERED';
                      verifyStatusEl.className = 'badge badge-error';
                      showToast(`Receipt ${shortId(r.id)} validation FAILED! Invalid signature or chain.`, 'error');
                    }
                  } catch (err) {
                    verifyStatusEl.textContent = 'Error';
                    verifyStatusEl.className = 'badge badge-error';
                    showToast(`Verification failed: ${err.message}`, 'error');
                  }
                }
              })
            )
          );
          return row;
        })
      )
    );

    mount(tableContainer, el('div', { className: 'table-container' }, table));
  } catch (e) {
    mount(tableContainer, createEmptyState('Failed to load receipts', e.message));
  }
}

// Register receipts page
register('receipts', renderReceipts);
