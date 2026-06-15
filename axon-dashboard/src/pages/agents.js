import { el, mount } from '../utils/dom.js';
import { getState, setState } from '../state.js';
import * as api from '../api.js';
import { openModal, closeModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { createEmptyState } from '../components/empty-state.js';
import { createSkeletonTable } from '../components/loading-spinner.js';
import { formatDate, shortId } from '../utils/format.js';
import { register } from '../router.js';

export async function renderAgents() {
  const container = document.getElementById('content');
  const state = getState();

  // Draw initial page layout
  container.innerHTML = `
    <div class="page-header animate-fade-in">
      <div>
        <h1 class="page-title">Agent Management</h1>
        <p class="page-subtitle">Register, monitor, and configure active project agents</p>
      </div>
      <button class="btn btn-primary" id="btn-register-agent">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
        Register Agent
      </button>
    </div>
    <div id="agents-table-container" class="animate-fade-in-up stagger-1"></div>
  `;

  // Bind click listener for registration
  document.getElementById('btn-register-agent').onclick = showRegisterModal;

  const tableContainer = document.getElementById('agents-table-container');
  mount(tableContainer, createSkeletonTable(4, 5));

  if (!state.serverOnline) {
    mount(tableContainer, createEmptyState('Server Offline', 'Cannot fetch agent list when the core server is offline.'));
    return;
  }

  try {
    const res = await api.agents.list();
    const agents = res.agents || [];

    if (agents.length === 0) {
      mount(tableContainer, createEmptyState(
        'No Agents Registered', 
        'Register your first agent using the button above to start interacting with Axon Protocol.',
        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:48px;height:48px;"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>`
      ));
      return;
    }

    const table = el('table', {},
      el('thead', {},
        el('tr', {},
          el('th', { textContent: 'Name' }),
          el('th', { textContent: 'Agent ID' }),
          el('th', { textContent: 'Capabilities' }),
          el('th', { textContent: 'Status' }),
          el('th', { textContent: 'Last Active' }),
          el('th', { textContent: 'Created' })
        )
      ),
      el('tbody', {},
        ...agents.map(a => el('tr', {},
          el('td', { style: 'font-weight: 600; color: var(--text-primary);', textContent: a.name }),
          el('td', { className: 'mono', textContent: shortId(a.id) }),
          el('td', {},
            ...a.capabilities.map(cap => el('span', { 
              className: 'badge badge-purple', 
              style: 'margin-right: 4px; margin-bottom: 2px;',
              textContent: cap 
            }))
          ),
          el('td', {}, el('span', { 
            className: `badge ${a.status === 'active' ? 'badge-success' : 'badge-warning'}`, 
            textContent: a.status 
          })),
          el('td', { textContent: a.last_seen_at ? formatDate(a.last_seen_at) : '—' }),
          el('td', { textContent: formatDate(a.created_at) })
        ))
      )
    );

    mount(tableContainer, el('div', { className: 'table-container' }, table));
  } catch (e) {
    mount(tableContainer, createEmptyState('Failed to load agents', e.message));
  }
}

function showRegisterModal() {
  const form = el('div', { style: 'display: flex; flex-direction: column; gap: var(--space-md); text-align: left;' },
    el('div', { className: 'input-group' },
      el('label', { className: 'input-label', textContent: 'Agent Name' }),
      el('input', { id: 'reg-name', className: 'input', placeholder: 'e.g. WriterAgent' })
    ),
    el('div', { className: 'input-group' },
      el('label', { className: 'input-label', textContent: 'Project ID' }),
      el('input', { 
        id: 'reg-project-id', 
        className: 'input', 
        placeholder: 'e.g. main-project-id',
        value: getState().credentials.projectId || '' 
      })
    ),
    el('div', { className: 'input-group' },
      el('label', { className: 'input-label', textContent: 'Capabilities (comma-separated)' }),
      el('input', { id: 'reg-caps', className: 'input', placeholder: 'e.g. web-search, db-read, file-write' })
    )
  );

  openModal('Register New Agent', form, async () => {
    const name = document.getElementById('reg-name').value.trim();
    const projectId = document.getElementById('reg-project-id').value.trim();
    const capsText = document.getElementById('reg-caps').value.trim();

    if (!name || !projectId) {
      showToast('Agent Name and Project ID are required!', 'error');
      return false; // keeps modal open
    }

    const capabilities = capsText ? capsText.split(',').map(c => c.trim()).filter(Boolean) : [];

    try {
      const res = await api.agents.register(name, projectId, capabilities);
      
      // Save credentials in state and localStorage
      const newCredentials = { apiKey: res.api_key, projectId: res.agent.project_id };
      setState('credentials', newCredentials);
      localStorage.setItem('axon_api_key', res.api_key);
      localStorage.setItem('axon_project_id', res.agent.project_id);

      // Connect credentials to API client immediately
      api.setCredentials(res.api_key, res.agent.project_id);

      // Create display box for credentials
      const credsBox = el('div', { style: 'background: var(--bg-tertiary); padding: var(--space-md); border-radius: var(--radius-md); border: 1px solid var(--border-accent); margin-top: var(--space-md); text-align: left;' },
        el('p', { style: 'font-size: 13px; color: var(--text-secondary); margin-bottom: 8px;', textContent: 'Copy your credentials below. The API key cannot be retrieved again!' }),
        el('div', { style: 'margin-bottom: 8px;' },
          el('span', { style: 'font-size: 11px; font-weight: 600; text-transform: uppercase; color: var(--text-muted); display: block;', textContent: 'API Key (Token)' }),
          el('div', { style: 'display: flex; gap: var(--space-sm); align-items: center;' },
            el('input', { id: 'key-copy-input', className: 'input mono', style: 'flex: 1; font-size: 11px;', value: res.api_key, readonly: true }),
            el('button', { 
              className: 'btn btn-secondary btn-sm', 
              textContent: 'Copy',
              onclick: () => {
                const copyInput = document.getElementById('key-copy-input');
                copyInput.select();
                navigator.clipboard.writeText(copyInput.value);
                showToast('API Key copied to clipboard!', 'success');
              }
            })
          )
        ),
        el('div', {},
          el('span', { style: 'font-size: 11px; font-weight: 600; text-transform: uppercase; color: var(--text-muted); display: block;', textContent: 'Project ID' }),
          el('div', { style: 'display: flex; gap: var(--space-sm); align-items: center;' },
            el('input', { id: 'project-copy-input', className: 'input mono', style: 'flex: 1; font-size: 11px;', value: res.agent.project_id, readonly: true }),
            el('button', { 
              className: 'btn btn-secondary btn-sm', 
              textContent: 'Copy',
              onclick: () => {
                const copyInput = document.getElementById('project-copy-input');
                copyInput.select();
                navigator.clipboard.writeText(copyInput.value);
                showToast('Project ID copied to clipboard!', 'success');
              }
            })
          )
        )
      );

      // Open a second modal explaining credentials
      openModal('Registration Successful', credsBox, () => {
        closeModal();
        renderAgents();
      }, 'Done');

      return true; // closes register modal
    } catch (e) {
      showToast(`Registration failed: ${e.message}`, 'error');
      return false; // keeps register modal open
    }
  });
}

// Register agents route
register('agents', renderAgents);
