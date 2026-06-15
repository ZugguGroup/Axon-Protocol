import { el, mount } from '../utils/dom.js';
import { setState } from '../state.js';
import * as api from '../api.js';
import { showToast } from '../components/toast.js';
import { register, navigate } from '../router.js';

export function renderLogin() {
  const container = document.getElementById('content');
  
  // Hide sidebar and header during login/signup to present a clean standalone auth gate
  const sidebar = document.getElementById('sidebar');
  const header = document.querySelector('header');
  if (sidebar) sidebar.style.display = 'none';
  if (header) header.style.display = 'none';

  // Make main layout full screen
  const main = document.querySelector('main');
  if (main) {
    main.style.marginLeft = '0';
    main.style.padding = '0';
    main.style.display = 'flex';
    main.style.justifyContent = 'center';
    main.style.alignItems = 'center';
    main.style.minHeight = '100vh';
    main.style.background = '#030303';
  }

  let isSignup = false;

  function renderForm() {
    container.innerHTML = '';

    const titleText = isSignup ? 'Create account' : 'Welcome back';
    const subtitleText = isSignup ? 'Get started with your multi-tenant developer console' : 'Log in to manage your multi-agent infrastructure';
    const submitText = isSignup ? 'Sign Up' : 'Log In';
    const toggleText = isSignup ? 'Already have an account? Log in' : "Don't have an account? Sign up";

    const emailInput = el('input', { type: 'email', className: 'input', placeholder: 'name@company.com', required: true });
    const passwordInput = el('input', { type: 'password', className: 'input', placeholder: '••••••••', required: true });

    const submitBtn = el('button', { className: 'btn btn-primary', style: 'width: 100%; justify-content: center; margin-top: var(--space-md); padding: var(--space-md); font-size: 14px; height: auto;', textContent: submitText });

    const toggleLink = el('a', { 
      href: '#', 
      style: 'display: block; text-align: center; margin-top: var(--space-lg); font-size: 13px; color: var(--text-secondary); text-decoration: none; font-weight: 500;',
      textContent: toggleText
    });

    toggleLink.addEventListener('click', (e) => {
      e.preventDefault();
      isSignup = !isSignup;
      renderForm();
    });

    const form = el('form', { style: 'display: flex; flex-direction: column; gap: var(--space-md); margin-top: var(--space-lg);' },
      el('div', { className: 'input-group' },
        el('label', { className: 'input-label', textContent: 'Email Address' }),
        emailInput
      ),
      el('div', { className: 'input-group' },
        el('label', { className: 'input-label', textContent: 'Password' }),
        passwordInput
      ),
      submitBtn
    );

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = emailInput.value.trim();
      const password = passwordInput.value;

      if (!email || !password) {
        showToast('Please fill in all fields!', 'error');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = isSignup ? 'Creating account...' : 'Logging in...';

      try {
        let res;
        if (isSignup) {
          res = await api.auth.signup(email, password);
          showToast('Account created successfully!', 'success');
        } else {
          res = await api.auth.login(email, password);
          showToast('Welcome back!', 'success');
        }

        // Set credentials in memory and localStorage
        api.setCredentials(null, null, res.token);
        setState('credentials', { apiKey: null, projectId: null, userToken: res.token });
        
        // Restore layout styles
        restoreLayout();

        // Navigate to projects to create/select one
        navigate('projects');
      } catch (err) {
        showToast(err.message || 'Authentication failed', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = submitText;
      }
    });

    const authCard = el('div', { 
      className: 'card animate-fade-in', 
      style: 'width: 100%; max-width: 420px; padding: var(--space-2xl); border-radius: 16px; border: 1px solid var(--border-color); box-shadow: var(--shadow-lg); background: #09090b;' 
    },
      el('div', { style: 'text-align: center; margin-bottom: var(--space-lg);' },
        el('div', { 
          style: 'width: 44px; height: 44px; border-radius: 8px; background: #09090b; border: 1px solid rgba(255, 255, 255, 0.12); color: white; display: flex; align-items: center; justify-content: center; font-family: "JetBrains Mono", monospace; font-size: 18px; font-weight: 700; margin: 0 auto var(--space-md) auto; box-shadow: 0 0 12px rgba(255, 255, 255, 0.05);' 
        }, 'A'),
        el('h1', { style: 'font-size: 20px; font-weight: 800; color: var(--text-primary);', textContent: titleText }),
        el('p', { style: 'font-size: 13px; color: var(--text-muted); margin-top: var(--space-xs); line-height: 1.4;', textContent: subtitleText })
      ),
      form,
      toggleLink
    );

    mount(container, authCard);
  }

  function restoreLayout() {
    if (sidebar) sidebar.style.display = 'block';
    if (header) header.style.display = 'flex';
    if (main) {
      main.style.marginLeft = '';
      main.style.padding = '';
      main.style.display = '';
      main.style.justifyContent = '';
      main.style.alignItems = '';
      main.style.minHeight = '';
      main.style.background = '';
    }
  }

  renderForm();
}

// Register login route
register('login', renderLogin);
