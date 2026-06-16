import { el, mount } from '../utils/dom.js';
import { setState } from '../state.js';
import * as api from '../api.js';
import { showToast } from '../components/toast.js';
import { register, navigate } from '../router.js';

export function renderLogin() {
  const container = document.getElementById('content');
  let isSignup = false;

  function renderForm() {
    container.innerHTML = '';

    const titleText = isSignup ? 'Create account' : 'Welcome back';
    const subtitleText = isSignup ? 'Get started with your multi-tenant developer console' : 'Log in to manage your multi-agent infrastructure';
    const submitText = isSignup ? 'Create Account' : 'Log In';
    const toggleText = isSignup ? 'Already have an account? Log in' : "Don't have an account? Sign up";

    const emailInput = el('input', { type: 'email', id: 'auth-email', className: 'input', placeholder: 'name@company.com', required: true, autocomplete: 'email' });
    const passwordInput = el('input', { type: 'password', id: 'auth-password', className: 'input', placeholder: '••••••••', required: true, autocomplete: isSignup ? 'new-password' : 'current-password' });

    const submitBtn = el('button', { 
      type: 'submit',
      id: 'auth-submit',
      className: 'btn btn-primary', 
      style: 'width: 100%; justify-content: center; padding: 12px 24px; font-size: 14px; height: auto; font-weight: 700; letter-spacing: 0.02em;', 
      textContent: submitText 
    });

    const toggleLink = el('a', { 
      href: '#', 
      id: 'auth-toggle',
      style: 'display: block; text-align: center; margin-top: 24px; font-size: 13px; color: var(--text-secondary); text-decoration: none; font-weight: 500; transition: color 150ms ease;',
      textContent: toggleText
    });

    toggleLink.addEventListener('mouseenter', () => { toggleLink.style.color = 'var(--text-primary)'; });
    toggleLink.addEventListener('mouseleave', () => { toggleLink.style.color = 'var(--text-secondary)'; });

    toggleLink.addEventListener('click', (e) => {
      e.preventDefault();
      isSignup = !isSignup;
      renderForm();
    });

    const form = el('form', { 
      id: 'auth-form',
      style: 'display: flex; flex-direction: column; gap: 16px; margin-top: 24px;' 
    },
      el('div', { className: 'input-group' },
        el('label', { className: 'input-label', htmlFor: 'auth-email', textContent: 'Email Address' }),
        emailInput
      ),
      el('div', { className: 'input-group' },
        el('label', { className: 'input-label', htmlFor: 'auth-password', textContent: 'Password' }),
        passwordInput
      ),
      el('div', { style: 'margin-top: 8px;' }, submitBtn)
    );

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = emailInput.value.trim();
      const password = passwordInput.value;

      if (!email || !password) {
        showToast('Please fill in all fields!', 'error');
        return;
      }

      if (isSignup && password.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.7';
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
        
        // Navigate to projects to create/select one
        navigate('projects');
      } catch (err) {
        showToast(err.message || 'Authentication failed', 'error');
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        submitBtn.textContent = submitText;
      }
    });

    // Logo mark
    const logoMark = el('div', { 
      style: 'width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #09090b, #18181b); border: 1px solid rgba(255, 255, 255, 0.12); color: white; display: flex; align-items: center; justify-content: center; font-family: "JetBrains Mono", monospace; font-size: 20px; font-weight: 700; margin: 0 auto 16px auto; box-shadow: 0 0 20px rgba(255, 255, 255, 0.04), 0 4px 16px rgba(0, 0, 0, 0.4);' 
    }, 'A');

    // Divider with "or"
    const divider = el('div', { 
      style: 'display: flex; align-items: center; gap: 12px; margin-top: 20px;' 
    },
      el('div', { style: 'flex: 1; height: 1px; background: var(--border-color);' }),
      el('span', { style: 'font-size: 11px; color: var(--text-muted); font-weight: 500; text-transform: uppercase; letter-spacing: 0.1em;', textContent: 'or' }),
      el('div', { style: 'flex: 1; height: 1px; background: var(--border-color);' })
    );

    // Back to landing link
    const backLink = el('a', {
      href: '#/landing',
      style: 'display: block; text-align: center; font-size: 12px; color: var(--text-muted); text-decoration: none; margin-top: 12px; transition: color 150ms ease;',
      textContent: '← Back to home'
    });
    backLink.addEventListener('mouseenter', () => { backLink.style.color = 'var(--text-secondary)'; });
    backLink.addEventListener('mouseleave', () => { backLink.style.color = 'var(--text-muted)'; });

    const authCard = el('div', { 
      className: 'card auth-card animate-scale-in', 
      id: 'auth-card'
    },
      el('div', { style: 'text-align: center; margin-bottom: 8px;' },
        logoMark,
        el('h1', { style: 'font-family: "JetBrains Mono", monospace; font-size: 22px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.02em;', textContent: titleText }),
        el('p', { style: 'font-size: 13px; color: var(--text-muted); margin-top: 8px; line-height: 1.5;', textContent: subtitleText })
      ),
      form,
      toggleLink,
      divider,
      backLink
    );

    mount(container, authCard);

    // Auto-focus the email field
    requestAnimationFrame(() => emailInput.focus());
  }

  renderForm();
}

// Register login route
register('login', renderLogin);
