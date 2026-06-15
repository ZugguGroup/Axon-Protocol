import { el, mount } from '../utils/dom.js';
import { getState } from '../state.js';
import * as api from '../api.js';
import { openModal, closeModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { createEmptyState } from '../components/empty-state.js';
import { createSkeletonTable } from '../components/loading-spinner.js';
import { formatDate, shortId, truncate } from '../utils/format.js';
import { register } from '../router.js';

export async function renderMemories() {
  const container = document.getElementById('content');
  const state = getState();

  container.innerHTML = `
    <div class="page-header animate-fade-in">
      <div>
        <h1 class="page-title">Semantic Memories</h1>
        <p class="page-subtitle">Inspect, query, and manage agent semantic memory vectors</p>
      </div>
      <div style="display: flex; gap: var(--space-sm);">
        <button class="btn btn-secondary" id="btn-manual-memory">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;margin-right:4px;"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          Store Memory
        </button>
      </div>
    </div>

    <!-- Search & Filter Controls -->
    <div class="card animate-fade-in-up" style="margin-bottom: var(--space-xl);">
      <form id="memory-search-form" class="search-bar" onsubmit="event.preventDefault();">
        <input type="text" id="memory-search-input" class="input" placeholder="Enter natural language query to search memories semantically... e.g. What is the agent planning?" />
        <button type="submit" class="btn btn-primary" id="btn-search-memory">Search</button>
      </form>
      <div style="display: flex; gap: var(--space-xl); margin-top: var(--space-md); font-size: 13px; color: var(--text-secondary);">
        <div style="display: flex; align-items: center; gap: var(--space-sm);">
          <label for="search-limit">Limit:</label>
          <input type="number" id="search-limit" class="input" value="10" min="1" max="100" style="width: 70px; padding: 4px var(--space-sm);" />
        </div>
        <div style="display: flex; align-items: center; gap: var(--space-sm); flex: 1;">
          <label for="search-similarity">Min Similarity:</label>
          <input type="range" id="search-similarity" min="0" max="1" step="0.05" value="0.3" style="flex: 1;" />
          <span id="similarity-value" class="mono">0.30</span>
        </div>
      </div>
    </div>

    <div id="memories-table-container" class="animate-fade-in-up stagger-1"></div>
  `;

  // Bind controls
  const searchInput = document.getElementById('memory-search-input');
  const searchLimit = document.getElementById('search-limit');
  const searchSimilarity = document.getElementById('search-similarity');
  const similarityValue = document.getElementById('similarity-value');
  const searchForm = document.getElementById('memory-search-form');
  const manualMemoryBtn = document.getElementById('btn-manual-memory');

  searchSimilarity.oninput = () => {
    similarityValue.textContent = parseFloat(searchSimilarity.value).toFixed(2);
  };

  manualMemoryBtn.onclick = showStoreMemoryModal;
  searchForm.onsubmit = async (e) => {
    e.preventDefault();
    await performSearch();
  };

  const tableContainer = document.getElementById('memories-table-container');

  // Trigger initial list load
  await loadMemoryList();

  async function loadMemoryList() {
    mount(tableContainer, createSkeletonTable(5, 5));
    if (!state.serverOnline) {
      mount(tableContainer, createEmptyState('Server Offline', 'Cannot fetch memories when server is offline.'));
      return;
    }

    try {
      const res = await api.memory.list();
      const memories = res.memories || [];
      renderMemoriesTable(memories, false);
    } catch (e) {
      mount(tableContainer, createEmptyState('Failed to load memories', e.message));
    }
  }

  async function performSearch() {
    const query = searchInput.value.trim();
    if (!query) {
      await loadMemoryList();
      return;
    }

    mount(tableContainer, createSkeletonTable(3, 6));

    try {
      const limit = parseInt(searchLimit.value, 10) || 10;
      const minSimilarity = parseFloat(searchSimilarity.value) || 0.3;
      const results = await api.memory.search(query, limit, minSimilarity);
      renderMemoriesTable(results, true);
    } catch (e) {
      showToast(`Search failed: ${e.message}`, 'error');
      loadMemoryList();
    }
  }

  function renderMemoriesTable(memories, isSearchResult = false) {
    if (memories.length === 0) {
      const msg = isSearchResult ? 'No memories matched your search criteria.' : 'No memories stored in the project database yet.';
      mount(tableContainer, createEmptyState('No memories found', msg));
      return;
    }

    const table = el('table', {},
      el('thead', {},
        el('tr', {},
          el('th', { textContent: 'Content' }),
          el('th', { textContent: 'Tags' }),
          el('th', { textContent: 'Scope' }),
          isSearchResult ? el('th', { textContent: 'Similarity' }) : null,
          el('th', { textContent: 'Agent' }),
          el('th', { textContent: 'Created' }),
          el('th', { textContent: 'Actions', style: 'text-align: right;' })
        )
      ),
      el('tbody', {},
        ...memories.map(m => el('tr', {},
          el('td', { style: 'max-width: 320px; font-weight: 500;', textContent: truncate(m.content, 120) }),
          el('td', {}, 
            Object.entries(m.tags || {}).map(([k, v]) => el('span', {
              className: 'badge badge-info',
              style: 'margin-right: 4px; margin-bottom: 2px; font-size: 10px;',
              textContent: `${k}:${v}`
            }))
          ),
          el('td', {}, el('span', { 
            className: `badge ${m.scope === 'project' ? 'badge-purple' : 'badge-warning'}`,
            textContent: m.scope 
          })),
          isSearchResult ? el('td', { className: 'mono', style: 'font-weight: 600; color: var(--accent-primary);', textContent: (m.similarity || m.similarity_score || 0).toFixed(4) }) : null,
          el('td', { className: 'mono', textContent: shortId(m.agent_id) }),
          el('td', { textContent: formatDate(m.created_at) }),
          el('td', { style: 'text-align: right;' },
            el('button', {
              className: 'btn btn-danger btn-sm',
              textContent: 'Delete',
              onclick: () => confirmDelete(m.id)
            })
          )
        ))
      )
    );

    mount(tableContainer, el('div', { className: 'table-container' }, table));
  }

  function confirmDelete(memoryId) {
    const info = el('p', { textContent: `Are you sure you want to permanently delete memory ${shortId(memoryId)}? This action cannot be undone.` });
    openModal('Delete Memory', info, async () => {
      try {
        await api.memory.delete(memoryId);
        showToast('Memory deleted successfully!', 'success');
        if (searchInput.value.trim()) {
          await performSearch();
        } else {
          await loadMemoryList();
        }
        return true;
      } catch (e) {
        showToast(`Delete failed: ${e.message}`, 'error');
        return false;
      }
    }, 'Delete');
  }

  function showStoreMemoryModal() {
    const form = el('div', { style: 'display: flex; flex-direction: column; gap: var(--space-md); text-align: left;' },
      el('div', { className: 'input-group' },
        el('label', { className: 'input-label', textContent: 'Memory Content' }),
        el('textarea', { id: 'mem-content', className: 'input', placeholder: 'Enter fact, reflection, or data to encode...', rows: 4, style: 'resize: vertical;' })
      ),
      el('div', { className: 'input-group' },
        el('label', { className: 'input-label', textContent: 'Tags (JSON format)' }),
        el('input', { id: 'mem-tags', className: 'input mono', placeholder: '{"topic": "planning", "importance": "high"}' })
      ),
      el('div', { className: 'input-group' },
        el('label', { className: 'input-label', textContent: 'Scope' }),
        el('select', { id: 'mem-scope', className: 'input' },
          el('option', { value: 'project', textContent: 'Project (Shared)' }),
          el('option', { value: 'agent', textContent: 'Agent (Private)' })
        )
      ),
      el('div', { className: 'input-group' },
        el('label', { className: 'input-label', textContent: 'TTL (Seconds, optional)' }),
        el('input', { id: 'mem-ttl', type: 'number', className: 'input', placeholder: 'e.g. 3600 for 1 hour' })
      )
    );

    openModal('Store Manual Memory', form, async () => {
      const content = document.getElementById('mem-content').value.trim();
      const tagsText = document.getElementById('mem-tags').value.trim();
      const scope = document.getElementById('mem-scope').value;
      const ttlText = document.getElementById('mem-ttl').value.trim();

      if (!content) {
        showToast('Memory content is required!', 'error');
        return false;
      }

      let tags = {};
      if (tagsText) {
        try {
          tags = JSON.parse(tagsText);
        } catch (e) {
          showToast('Tags must be valid JSON!', 'error');
          return false;
        }
      }

      const ttl = ttlText ? parseInt(ttlText, 10) : null;

      try {
        await api.memory.store(content, tags, scope, ttl);
        showToast('Memory stored successfully!', 'success');
        await loadMemoryList();
        return true;
      } catch (e) {
        showToast(`Failed to store memory: ${e.message}`, 'error');
        return false;
      }
    }, 'Store');
  }
}

// Register memory route
register('memories', renderMemories);
