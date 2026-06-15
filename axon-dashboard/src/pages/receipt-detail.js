import { el, mount } from '../utils/dom.js';
import { getState } from '../state.js';
import * as api from '../api.js';
import { showToast } from '../components/toast.js';
import { createEmptyState } from '../components/empty-state.js';
import { createSkeletonTable } from '../components/loading-spinner.js';
import { formatDate, shortId } from '../utils/format.js';
import { register, navigate } from '../router.js';

export async function renderReceiptDetail() {
  const container = document.getElementById('content');
  const state = getState();
  const receiptId = state.inspectedReceiptId;

  if (!receiptId) {
    container.innerHTML = '';
    container.appendChild(
      createEmptyState('No Receipt Selected', 'Navigate back to the receipts page to select a receipt to inspect.', 
        `<button class="btn btn-primary" onclick="window.location.hash = '#/receipts';">Back to Receipts</button>`
      )
    );
    return;
  }

  // Draw initial page layout with skeletons
  container.innerHTML = `
    <div class="page-header animate-fade-in">
      <div>
        <button class="btn btn-secondary btn-sm" id="btn-back-receipts" style="margin-bottom: var(--space-sm);">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;margin-right:4px;"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Back to list
        </button>
        <h1 class="page-title">Receipt Inspection</h1>
        <p class="page-subtitle">Receipt ID: <span class="mono">${receiptId}</span></p>
      </div>
      <button class="btn btn-primary" id="btn-verify-receipt">Verify Integrity</button>
    </div>
    <div class="grid-2 animate-fade-in-up stagger-1">
      <div class="card skeleton" style="height: 350px;"></div>
      <div class="card skeleton" style="height: 350px;"></div>
    </div>
  `;

  document.getElementById('btn-back-receipts').onclick = () => navigate('receipts');
  const verifyBtn = document.getElementById('btn-verify-receipt');

  if (!state.serverOnline) {
    container.innerHTML = '';
    container.appendChild(createEmptyState('Server Offline', 'Cannot fetch receipt details when the server is offline.'));
    return;
  }

  try {
    const receipt = await api.receipts.get(receiptId);

    // Update title/verify action
    verifyBtn.onclick = async () => {
      verifyBtn.textContent = 'Verifying...';
      verifyBtn.disabled = true;
      try {
        const verification = await api.receipts.verify(receiptId);
        if (verification.valid) {
          showToast('Receipt verification passed! Signature matches hash chain.', 'success');
          verifyBtn.className = 'btn btn-secondary';
          verifyBtn.textContent = 'Verified ✓';
        } else {
          showToast('Receipt verification FAILED! Signature does not match or data has been altered.', 'error');
          verifyBtn.className = 'btn btn-danger';
          verifyBtn.textContent = 'TAMPERED ✗';
        }
      } catch (err) {
        showToast(`Verification error: ${err.message}`, 'error');
        verifyBtn.textContent = 'Verification Failed';
      } finally {
        verifyBtn.disabled = false;
      }
    };

    container.innerHTML = '';

    const header = el('div', { className: 'page-header animate-fade-in' },
      el('div', {},
        el('button', {
          className: 'btn btn-secondary btn-sm',
          style: 'margin-bottom: var(--space-sm);',
          onclick: () => navigate('receipts'),
          innerHTML: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;margin-right:4px;"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg> Back to list`
        }),
        el('h1', { className: 'page-title', textContent: 'Receipt Inspection' }),
        el('p', { className: 'page-subtitle' },
          'Receipt ID: ',
          el('span', { className: 'mono', style: 'color: var(--text-primary);', textContent: receipt.id })
        )
      ),
      verifyBtn
    );

    // Meta card
    const metaCard = el('div', { className: 'card animate-fade-in-up stagger-1' },
      el('div', { className: 'card-header' },
        el('span', { className: 'card-title', textContent: 'Chained Signature Metadata' })
      ),
      el('div', { style: 'display: flex; flex-direction: column; gap: var(--space-md); font-size: 13px;' },
        el('div', {},
          el('strong', { textContent: 'Agent ID: ' }),
          el('span', { className: 'mono', textContent: receipt.agent_id })
        ),
        el('div', {},
          el('strong', { textContent: 'Input Text: ' }),
          el('blockquote', { style: 'background: var(--bg-tertiary); padding: var(--space-sm); border-left: 2px solid var(--accent-primary); border-radius: var(--radius-sm); margin-top: 4px;', textContent: receipt.input_text })
        ),
        el('div', {},
          el('strong', { textContent: 'Output Text: ' }),
          el('blockquote', { style: 'background: var(--bg-tertiary); padding: var(--space-sm); border-left: 2px solid var(--color-success); border-radius: var(--radius-sm); margin-top: 4px;', textContent: receipt.output_text })
        ),
        el('div', {},
          el('strong', { textContent: 'Final Chain Hash: ' }),
          el('pre', { className: 'mono', style: 'background: var(--bg-secondary); padding: var(--space-sm); border-radius: var(--radius-sm); font-size: 11px; overflow-x: auto; margin-top: 4px;', textContent: receipt.chain_hash })
        ),
        el('div', {},
          el('strong', { textContent: 'HMAC Cryptographic Signature: ' }),
          el('pre', { className: 'mono', style: 'background: var(--bg-secondary); padding: var(--space-sm); border-radius: var(--radius-sm); font-size: 11px; overflow-x: auto; margin-top: 4px;', textContent: receipt.signature })
        ),
        el('div', {},
          el('strong', { textContent: 'Created At: ' }),
          el('span', { textContent: formatDate(receipt.created_at) })
        )
      )
    );

    // Steps rendering
    const steps = receipt.steps || [];
    const stepChain = el('div', { className: 'receipt-chain' },
      ...steps.map((step, idx) => {
        return el('div', { className: 'receipt-step' },
          el('div', { className: 'step-dot' }),
          el('div', { className: 'step-content' },
            el('div', { className: 'step-thought', textContent: step.thought }),
            el('div', { className: 'step-meta' },
              el('span', { style: 'margin-right: var(--space-sm); font-weight: 600;', textContent: `Step ${idx + 1}` }),
              step.tool_called ? el('span', { className: 'step-tool', textContent: `Tool: ${step.tool_called}` }) : el('span', { className: 'step-tool', style: 'background: rgba(255,255,255,0.06); color: var(--text-secondary);', textContent: 'Reasoning Action' })
            ),
            step.tool_output ? el('pre', {
              className: 'mono',
              style: 'background: var(--bg-secondary); border: 1px solid var(--border-color); padding: var(--space-sm); border-radius: var(--radius-sm); font-size: 11px; margin-top: var(--space-sm); overflow-x: auto; max-height: 120px;',
              textContent: typeof step.tool_output === 'object' ? JSON.stringify(step.tool_output, null, 2) : step.tool_output
            }) : null
          )
        );
      })
    );

    const stepsCard = el('div', { className: 'card animate-fade-in-up stagger-2' },
      el('div', { className: 'card-header' },
        el('span', { className: 'card-title', textContent: 'Execution Step Chain' })
      ),
      steps.length === 0 
        ? el('p', { style: 'color: var(--text-muted); font-size: 13px; text-align: center; padding: var(--space-xl);', textContent: 'This receipt contains no intermediate steps.' })
        : stepChain
    );

    const detailsGrid = el('div', { className: 'grid-2' }, metaCard, stepsCard);

    mount(container, header, detailsGrid);
  } catch (e) {
    container.innerHTML = '';
    container.appendChild(createEmptyState('Failed to load receipt details', e.message));
  }
}

// Register page
register('receipt-detail', renderReceiptDetail);
