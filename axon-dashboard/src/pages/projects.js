import { el, mount } from '../utils/dom.js';
import { getState, setState } from '../state.js';
import * as api from '../api.js';
import * as ws from '../ws.js';
import { showToast } from '../components/toast.js';
import { openModal } from '../components/modal.js';
import { register, navigate } from '../router.js';
import { formatDate } from '../utils/format.js';

export async function renderProjects() {
  const container = document.getElementById('content');
  const state = getState();

  // Ensure sidebar/header are shown if returning from login
  const sidebar = document.getElementById('sidebar');
  const header = document.querySelector('header');
  if (sidebar) sidebar.style.display = 'block';
  if (header) header.style.display = 'flex';
  
  const main = document.querySelector('main');
  if (main && main.style.marginLeft === '0px') {
    main.style.marginLeft = '';
    main.style.padding = '';
    main.style.display = '';
    main.style.justifyContent = '';
    main.style.alignItems = '';
    main.style.minHeight = '';
    main.style.background = '';
  }

  container.innerHTML = `
    <div class="page-header animate-fade-in">
      <div>
        <h1 class="page-title">Projects</h1>
        <p class="page-subtitle">Manage your isolated multi-tenant project spaces and API credentials</p>
      </div>
      <button id="btn-create-project" class="btn btn-primary">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><path d="M5 12h14M12 5v14"/></svg>
        <span>New Project</span>
      </button>
    </div>
    <div id="projects-grid" class="grid-3 animate-fade-in-up stagger-1">
      <div class="card skeleton skeleton-card"></div>
      <div class="card skeleton skeleton-card"></div>
      <div class="card skeleton skeleton-card"></div>
    </div>
  `;

  // Fetch projects list
  let projectList = [];
  try {
    projectList = await api.projects.list();
  } catch (err) {
    showToast(err.message || 'Failed to fetch projects', 'error');
  }

  const grid = document.getElementById('projects-grid');
  grid.innerHTML = '';

  if (projectList.length === 0) {
    grid.className = '';
    mount(grid, el('div', { className: 'empty-state animate-fade-in-up' },
      el('div', { className: 'empty-state-icon', textContent: '📁' }),
      el('h3', { className: 'empty-state-title', textContent: 'No Projects Found' }),
      el('p', { className: 'empty-state-text', textContent: 'Create a new project to start registering agents, storing memories, and tracking receipts.' }),
      el('button', { className: 'btn btn-primary section-gap', textContent: 'Create First Project' }).addEventListener('click', triggerCreateModal)
    ));
  } else {
    grid.className = 'grid-3 animate-fade-in-up stagger-1';
    
    // Sort so active project is first
    const activeProjectId = localStorage.getItem('axon_project_id');
    projectList.sort((a, b) => {
      if (a.id === activeProjectId) return -1;
      if (b.id === activeProjectId) return 1;
      return 0;
    });

    projectList.forEach(project => {
      const isActive = project.id === activeProjectId;
      
      const selectBtn = el('button', { 
        className: `btn ${isActive ? 'btn-secondary' : 'btn-primary'} btn-sm`, 
        textContent: isActive ? 'Active Space' : 'Select Project'
      });
      
      if (isActive) {
        selectBtn.disabled = true;
      } else {
        selectBtn.addEventListener('click', () => selectActiveProject(project));
      }

      const rotateBtn = el('button', { 
        className: 'btn btn-secondary btn-sm', 
        textContent: 'Rotate Key' 
      });
      rotateBtn.addEventListener('click', () => triggerRotateKey(project));

      const deleteBtn = el('button', { 
        className: 'btn btn-danger btn-sm', 
        textContent: 'Delete' 
      });
      deleteBtn.addEventListener('click', () => triggerDeleteProject(project));

      const card = el('div', { className: `card ${isActive ? 'active-project-card' : ''}`, style: isActive ? 'border-color: var(--accent-primary); background: rgba(99, 102, 241, 0.05);' : '' },
        el('div', { className: 'card-header' },
          el('span', { className: 'card-title', style: 'font-size: 16px; font-weight: 700; color: var(--text-primary);', textContent: project.name }),
          isActive ? el('span', { className: 'badge badge-success', textContent: 'Active' }) : null
        ),
        el('div', { style: 'display: flex; flex-direction: column; gap: var(--space-sm); margin-bottom: var(--space-lg); font-size: 13px;' },
          el('div', { style: 'display: flex; justify-content: space-between;' },
            el('span', { className: 'mono', textContent: 'ID:' }),
            el('span', { className: 'mono', textContent: project.id })
          ),
          el('div', { style: 'display: flex; justify-content: space-between;' },
            el('span', { className: 'mono', textContent: 'Created:' }),
            el('span', { textContent: formatDate(project.created_at) })
          )
        ),
        el('div', { style: 'display: flex; gap: var(--space-sm); justify-content: flex-end;' },
          deleteBtn,
          rotateBtn,
          selectBtn
        )
      );

      mount(grid, card);
    });
  }

  // Bind create button
  const createBtn = document.getElementById('btn-create-project');
  if (createBtn) {
    createBtn.addEventListener('click', triggerCreateModal);
  }

  function triggerCreateModal() {
    const input = el('input', { className: 'input', placeholder: 'My Awesome Workspace...', required: true });
    const modalContent = el('div', { style: 'display: flex; flex-direction: column; gap: var(--space-md); text-align: left;' },
      el('label', { className: 'input-label', textContent: 'Project Name' }),
      input
    );

    openModal('Create New Project', modalContent, async () => {
      const name = input.value.trim();
      if (!name) {
        showToast('Project name is required!', 'error');
        return false;
      }
      try {
        const res = await api.projects.create(name);
        showToast(`Project "${name}" created successfully!`, 'success');
        
        // Present key warning modal
        showKeyWarningModal(res);
        
        // Auto select if it is the first project
        if (projectList.length === 0) {
          await selectActiveProject(res);
        } else {
          renderProjects();
        }
        return true;
      } catch (err) {
        showToast(err.message || 'Failed to create project', 'error');
        return false;
      }
    }, 'Create');
  }

  function showKeyWarningModal(project) {
    const keyBox = el('div', { 
      className: 'mono', 
      style: 'background: var(--bg-tertiary); border: 1px solid var(--border-color); padding: var(--space-md); border-radius: var(--radius-md); display: flex; justify-content: space-between; align-items: center; margin-top: var(--space-md); font-weight: bold; font-size: 14px; color: var(--text-primary);' 
    },
      el('span', { textContent: project.api_key }),
      el('button', { className: 'btn btn-secondary btn-sm', textContent: 'Copy' }).addEventListener('click', () => {
        navigator.clipboard.writeText(project.api_key);
        showToast('API Key copied to clipboard!', 'success');
      })
    );

    const content = el('div', { style: 'text-align: left;' },
      el('p', { style: 'color: var(--color-warning); font-weight: bold; margin-bottom: var(--space-sm);', textContent: '⚠️ CRITICAL: Copy your Project API Key now!' }),
      el('p', { style: 'font-size: 13px; color: var(--text-secondary); line-height: 1.4;', textContent: 'This API key is hashed and stored securely. It will never be displayed again. Register your agents or construct your SDK instances using this key.' }),
      keyBox
    );

    openModal('Project Credentials Created', content, () => true, 'Done');
  }

  async function triggerRotateKey(project) {
    const content = el('div', { style: 'text-align: left;' },
      el('p', { style: 'color: var(--color-error); font-weight: bold; margin-bottom: var(--space-sm);', textContent: '⚠️ WARNING: Key Rotation is a destructive action!' }),
      el('p', { style: 'font-size: 13px; color: var(--text-secondary); line-height: 1.4;', textContent: 'Any active agents using the current API Key will instantly fail to authenticate. You must reinitialize your SDKs and CLI with the new key.' })
    );

    openModal('Rotate Project API Key', content, async () => {
      try {
        const res = await api.projects.rotateKey(project.id);
        showToast('API Key rotated successfully!', 'success');
        
        // Show key warning
        showKeyWarningModal(res);

        // If the rotated project was active, refresh credentials
        const activeProjectId = localStorage.getItem('axon_project_id');
        if (project.id === activeProjectId) {
          api.setCredentials(res.api_key, res.id);
        }
        
        renderProjects();
        return true;
      } catch (err) {
        showToast(err.message || 'Failed to rotate API Key', 'error');
        return false;
      }
    }, 'Rotate Key');
  }

  async function triggerDeleteProject(project) {
    const activeProjectId = localStorage.getItem('axon_project_id');
    const isCurrentActive = project.id === activeProjectId;

    const content = el('div', { style: 'text-align: left;' },
      el('p', { style: 'color: var(--color-error); font-weight: bold; margin-bottom: var(--space-sm);', textContent: '⚠️ DANGER: This action is irreversible!' }),
      el('p', { style: 'font-size: 13px; color: var(--text-secondary); line-height: 1.4;', textContent: `Are you sure you want to delete project "${project.name}"? This will permanently delete all associated agents, memories, locks, receipts, and messages.` })
    );

    openModal('Delete Project', content, async () => {
      try {
        await api.projects.delete(project.id);
        showToast(`Project "${project.name}" deleted successfully`, 'success');

        if (isCurrentActive) {
          // Clear credentials
          api.clearCredentials();
          setState('credentials', { apiKey: null, projectId: null, userToken: localStorage.getItem('axon_user_token') });
          // Disconnect WebSocket
          ws.disconnect();
          showToast('Active project was deleted. Please select or create another project.', 'info');
        }

        renderProjects();
        return true;
      } catch (err) {
        showToast(err.message || 'Failed to delete project', 'error');
        return false;
      }
    }, 'Delete');
  }

  async function selectActiveProject(project) {
    // If we rotated the key earlier, we might not have the raw key in project object (project.api_key is only returned on creation/rotation).
    // In that case, we need to prompt the user to input the Project API Key to authenticate if it is not saved yet, or if they choose it.
    let savedKey = localStorage.getItem('axon_api_key');
    const savedProjectId = localStorage.getItem('axon_project_id');

    if (project.api_key) {
      savedKey = project.api_key;
    } else if (project.id !== savedProjectId || !savedKey) {
      // Prompt for Project Key
      const keyPromptInput = el('input', { type: 'password', className: 'input', placeholder: 'Enter API Key for this project...', required: true });
      const promptContent = el('div', { style: 'display: flex; flex-direction: column; gap: var(--space-md); text-align: left;' },
        el('p', { style: 'font-size: 13px; color: var(--text-secondary);', textContent: `Enter your API key for project "${project.name}" to connect.` }),
        keyPromptInput
      );

      const approved = await new Promise((resolve) => {
        openModal('Select Active Project', promptContent, () => {
          const val = keyPromptInput.value.trim();
          if (!val) {
            showToast('API key is required to connect!', 'error');
            return false;
          }
          savedKey = val;
          resolve(true);
          return true;
        }, 'Connect');
      });

      if (!approved) return;
    }

    api.setCredentials(savedKey, project.id);
    setState('credentials', { apiKey: savedKey, projectId: project.id, userToken: localStorage.getItem('axon_user_token') });
    
    // Connect WebSocket
    ws.connect(project.id);

    showToast(`Workspace switched to project: "${project.name}"`, 'success');
    renderProjects();
  }
}

// Register route
register('projects', renderProjects);
