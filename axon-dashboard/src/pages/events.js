import { el, mount } from '../utils/dom.js';
import { getState, setState } from '../state.js';
import * as ws from '../ws.js';
import { createEventBadge } from '../components/event-badge.js';
import { formatDate } from '../utils/format.js';
import { register } from '../router.js';

export function renderEvents() {
  const container = document.getElementById('content');
  const state = getState();

  let isPaused = false;
  let eventList = []; // Local view of events (combines history + new ones)
  let filterType = 'all';

  container.innerHTML = `
    <div class="page-header animate-fade-in">
      <div>
        <h1 class="page-title">Live WebSocket Event Log</h1>
        <p class="page-subtitle">Stream real-time locks, memories, and receipts activity from agents</p>
      </div>
      <div style="display: flex; gap: var(--space-sm); align-items: center;">
        <label for="filter-event-type" style="font-size: 13px; color: var(--text-secondary);">Filter:</label>
        <select id="filter-event-type" class="input" style="padding: 4px var(--space-sm); font-size: 13px;">
          <option value="all">All Events</option>
          <option value="lock">Locks</option>
          <option value="memory">Memories</option>
          <option value="receipt">Receipts</option>
        </select>
        <button class="btn btn-secondary" id="btn-pause-events">Pause Stream</button>
        <button class="btn btn-danger" id="btn-clear-events">Clear Log</button>
      </div>
    </div>
    <div class="card animate-fade-in-up stagger-1" style="padding: 0; overflow: hidden;">
      <div id="events-feed" class="event-log" style="height: 600px; padding: var(--space-md);"></div>
    </div>
  `;

  const feedEl = document.getElementById('events-feed');
  const pauseBtn = document.getElementById('btn-pause-events');
  const clearBtn = document.getElementById('btn-clear-events');
  const filterSelect = document.getElementById('filter-event-type');

  // Load existing events from state
  eventList = [...state.events];
  renderAllEvents();

  pauseBtn.onclick = () => {
    isPaused = !isPaused;
    pauseBtn.textContent = isPaused ? 'Resume Stream' : 'Pause Stream';
    pauseBtn.className = isPaused ? 'btn btn-primary' : 'btn btn-secondary';
  };

  clearBtn.onclick = () => {
    eventList = [];
    setState('events', []); // Clear global store too
    feedEl.innerHTML = `
      <div id="events-empty-tip" style="padding: var(--space-2xl); text-align: center; color: var(--text-muted); font-size: 14px;">
        Cleared. Active WebSocket events will print here as they occur.
      </div>
    `;
  };

  filterSelect.onchange = () => {
    filterType = filterSelect.value;
    renderAllEvents();
  };

  function renderAllEvents() {
    feedEl.innerHTML = '';
    const filtered = getFilteredEvents();
    
    if (filtered.length === 0) {
      feedEl.innerHTML = `
        <div id="events-empty-tip" style="padding: var(--space-2xl); text-align: center; color: var(--text-muted); font-size: 14px;">
          No events recorded yet. Connect agents to trigger locks, memory stores, and receipts.
        </div>
      `;
      return;
    }

    filtered.forEach(ev => appendEventToFeed(ev));
    scrollToBottom();
  }

  function getFilteredEvents() {
    if (filterType === 'all') return eventList;
    return eventList.filter(ev => ev.type.includes(filterType));
  }

  function appendEventToFeed(ev) {
    // Remove placeholder if present
    const tip = document.getElementById('events-empty-tip');
    if (tip) tip.remove();

    const evEl = el('div', { className: 'event-item' },
      el('span', { className: 'event-time', textContent: formatDate(ev.timestamp || new Date()) }),
      el('span', { className: 'event-type' }, createEventBadge(ev.type)),
      el('span', { className: 'event-detail mono', textContent: JSON.stringify(ev.payload || ev) })
    );
    feedEl.appendChild(evEl);
  }

  function scrollToBottom() {
    feedEl.scrollTop = feedEl.scrollHeight;
  }

  // Subscribe to WebSocket events
  const unsubscribe = ws.subscribe((data) => {
    if (isPaused) return;

    // Add to local list and global store
    eventList.push(data);
    setState('events', [...state.events, data]);

    // Render if matches filter
    if (filterType === 'all' || data.type.includes(filterType)) {
      appendEventToFeed(data);
      scrollToBottom();
    }
  });

  // Cleanup subscription on page unmount
  const checkPageChange = () => {
    if (!document.getElementById('events-feed')) {
      unsubscribe();
      window.removeEventListener('hashchange', checkPageChange);
    }
  };
  window.addEventListener('hashchange', checkPageChange);
}

// Register route
register('events', renderEvents);
