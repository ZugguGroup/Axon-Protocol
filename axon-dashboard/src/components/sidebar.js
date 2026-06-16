import { el, mount } from '../utils/dom.js';
import { currentRoute } from '../router.js';
import * as api from '../api.js';

// SVG Icons
const icons = {
  dashboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="sidebar-link-icon"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>`,
  projects: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="sidebar-link-icon"><path d="M4 22V4c0-.5.2-1 .6-1.4C5 2.2 5.5 2 6 2h12c.5 0 1 .2 1.4.6.4.4.6.9.6 1.4v18l-8-4-8 4z"/></svg>`,
  billing: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="sidebar-link-icon"><rect width="20" height="14" x="2" y="5" rx="2" ry="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>`,
  agents: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="sidebar-link-icon"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  memories: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="sidebar-link-icon"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`, // Note: represents memory/store (dollar/value or folder-like)
  database: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="sidebar-link-icon"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>`,
  locks: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="sidebar-link-icon"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  receipts: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="sidebar-link-icon"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>`,
  events: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="sidebar-link-icon"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>`, // Activity / log icon
  activity: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="sidebar-link-icon"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`,
  message: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="sidebar-link-icon"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  logout: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="sidebar-link-icon"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>`
};

export function renderSidebar() {
  const activePage = currentRoute();
  
  // Do not render sidebar contents if we are on the login page
  const userToken = localStorage.getItem('axon_user_token');
  const sidebarContainer = document.getElementById('sidebar');
  if (!userToken) {
    if (sidebarContainer) sidebarContainer.style.display = 'none';
    return;
  } else {
    if (sidebarContainer) sidebarContainer.style.display = '';
  }

  const logo = el('div', { className: 'sidebar-logo' },
    el('div', { className: 'sidebar-logo-icon' }, 'A'),
    el('span', { className: 'sidebar-logo-text' }, 'Axon Protocol'),
    el('span', { className: 'sidebar-logo-version' }, 'v0.1')
  );

  const links = [
    { name: 'Dashboard', path: 'dashboard', icon: icons.dashboard },
    { name: 'Projects', path: 'projects', icon: icons.projects },
    { name: 'Billing', path: 'billing', icon: icons.billing },
    { name: 'Agents', path: 'agents', icon: icons.agents },
    { name: 'Memories', path: 'memories', icon: icons.database },
    { name: 'Active Locks', path: 'locks', icon: icons.locks },
    { name: 'Chained Receipts', path: 'receipts', icon: icons.receipts },
    { name: 'Agent Messages', path: 'messages', icon: icons.message },
    { name: 'Live Event Stream', path: 'events', icon: icons.activity }
  ];

  const logoutLink = el('a', {
    href: '#/login',
    className: 'sidebar-link',
    style: 'margin-top: auto; border-top: 1px solid var(--border-color); padding-top: var(--space-md);'
  });
  logoutLink.innerHTML = icons.logout + `<span>Logout</span>`;
  logoutLink.addEventListener('click', (e) => {
    e.preventDefault();
    api.clearCredentials();
    window.location.hash = '#/login';
  });

  const nav = el('nav', { className: 'sidebar-nav', style: 'height: calc(100% - 70px); display: flex; flex-direction: column;' },
    el('div', { className: 'sidebar-section-label' }, 'Menu'),
    ...links.map(link => {
      const a = el('a', {
        href: `#/${link.path}`,
        className: `sidebar-link ${activePage === link.path ? 'active' : ''}`
      });
      a.innerHTML = link.icon + `<span>${link.name}</span>`;
      return a;
    }),
    logoutLink
  );

  mount('#sidebar', logo, nav);
}

// Re-render sidebar when route changes
window.addEventListener('hashchange', renderSidebar);
