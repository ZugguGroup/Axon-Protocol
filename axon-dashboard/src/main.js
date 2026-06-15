import { el, mount } from './utils/dom.js';
import { getState, setState, watch } from './state.js';
import * as api from './api.js';
import * as ws from './ws.js';
import * as router from './router.js';
import { showToast } from './components/toast.js';
import { openModal, closeModal } from './components/modal.js';
import { renderSidebar } from './components/sidebar.js';
import { renderHeader } from './components/header.js';
import { initParticles } from './utils/particles.js';

// Import pages to ensure they are registered with the router
import './pages/landing.js';
import './pages/dashboard.js';
import './pages/agents.js';
import './pages/memories.js';
import './pages/locks.js';
import './pages/receipts.js';
import './pages/receipt-detail.js';
import './pages/events.js';
import './pages/messages.js';
import './pages/login.js';
import './pages/projects.js';
import './pages/billing.js';

async function init() {
  console.log('[Axon App] Initializing...');

  // Initialize particle background
  initParticles();

  // 1. Initial health ping to verify server status
  await checkHealth();

  // 2. Setup credentials from localStorage if present
  const savedKey = localStorage.getItem('axon_api_key');
  const savedProject = localStorage.getItem('axon_project_id');
  const savedUserToken = localStorage.getItem('axon_user_token');

  if (savedUserToken) {
    api.setCredentials(savedKey || null, savedProject || null, savedUserToken);
    setState('credentials', { apiKey: savedKey || null, projectId: savedProject || null, userToken: savedUserToken });
    
    if (savedProject) {
      // Connect WebSocket
      ws.connect(savedProject);
    }
  } else {
    // Navigate to landing if no user token exists
    router.navigate('landing');
  }

  // 3. Render base application layout
  renderSidebar();
  renderHeader();

  // 4. Start periodic health ping
  setInterval(checkHealth, 5000);

  // 5. Start the router
  router.start('dashboard');
}

async function checkHealth() {
  try {
    await api.health.ping();
    if (!getState().serverOnline) {
      setState('serverOnline', true);
      // If we went online and have credentials, connect WebSocket
      const creds = getState().credentials;
      if (creds.apiKey && creds.projectId) {
        ws.connect(creds.projectId);
      }
    }
  } catch (e) {
    if (getState().serverOnline) {
      setState('serverOnline', false);
      ws.disconnect();
    }
  }
}

function showSetupModal() {
  const form = el('div', { style: 'display: flex; flex-direction: column; gap: var(--space-md); text-align: left;' },
    el('p', { style: 'font-size: 13px; color: var(--text-secondary); line-height: 1.4;', textContent: 'Axon Dashboard needs credentials to query resources. Register a new agent or connect using existing SDK credentials.' }),
    el('div', { className: 'input-group' },
      el('label', { className: 'input-label', textContent: 'API Key (Token)' }),
      el('input', { id: 'setup-key', className: 'input mono', placeholder: 'Enter API Key...' })
    ),
    el('div', { className: 'input-group' },
      el('label', { className: 'input-label', textContent: 'Project ID' }),
      el('input', { id: 'setup-project', className: 'input mono', placeholder: 'Enter Project ID...' })
    ),
    el('p', { style: 'font-size: 11px; color: var(--text-muted);', textContent: 'Don\'t have credentials? Cancel and go to the "Agents" tab to register one.' })
  );

  openModal('Connect to Axon Project', form, async () => {
    const key = document.getElementById('setup-key').value.trim();
    const project = document.getElementById('setup-project').value.trim();

    if (!key || !project) {
      showToast('Both API Key and Project ID are required!', 'error');
      return false; // keep open
    }

    localStorage.setItem('axon_api_key', key);
    localStorage.setItem('axon_project_id', project);
    
    api.setCredentials(key, project);
    setState('credentials', { apiKey: key, projectId: project });

    // Connect WebSocket and reload
    ws.connect(project);
    showToast('Credentials loaded successfully!', 'success');

    // Reload active page
    const route = router.currentRoute();
    router.navigate(route);

    return true; // close modal
  }, 'Connect');
}

// Allow header to open credentials setup modal by clicking on project block
document.addEventListener('click', (e) => {
  const projectBox = e.target.closest('.header-right');
  if (projectBox && projectBox.textContent.includes('PROJECT:')) {
    showSetupModal();
  }
});

// Run application
init().catch(err => {
  console.error('[Axon App] Failed to initialize:', err);
});
