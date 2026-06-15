import { el, mount } from '../utils/dom.js';
import { setState } from '../state.js';
import * as api from '../api.js';
import { showToast } from '../components/toast.js';
import { register, navigate } from '../router.js';

export function renderLanding() {
  const container = document.getElementById('content');
  
  // Hide sidebar and header to present a full landing page layout
  const sidebar = document.getElementById('sidebar');
  const header = document.querySelector('header');
  if (sidebar) sidebar.style.display = 'none';
  if (header) header.style.display = 'none';

  // Make main layout full width
  const main = document.querySelector('main');
  if (main) {
    main.style.marginLeft = '0';
    main.style.padding = '0';
    main.style.background = '#030303';
  }

  container.innerHTML = '';

  // 1. Navigation bar
  const nav = el('nav', { className: 'landing-nav animate-fade-in' },
    el('div', { className: 'landing-nav-logo' },
      el('div', { className: 'landing-logo-mark' }, 'A'),
      el('span', { className: 'landing-logo-text', textContent: 'Axon Protocol' })
    ),
    el('div', { className: 'landing-nav-links' },
      el('a', { href: '#features-sec', className: 'landing-nav-link', textContent: 'Features' }),
      el('a', { href: '#arch-sec', className: 'landing-nav-link', textContent: 'Architecture' }),
      el('a', { href: '#docs-sec', className: 'landing-nav-link', textContent: 'SDK Docs' })
    ),
    el('div', { className: 'landing-nav-actions' },
      el('button', { className: 'btn btn-secondary btn-sm', textContent: 'Log In' })
    )
  );

  // Hook scroll to auth block
  const scrollToAuth = (e) => {
    if (e) e.preventDefault();
    const authElement = document.getElementById('auth-sec');
    if (authElement) {
      authElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  nav.querySelector('.landing-nav-actions button').addEventListener('click', scrollToAuth);
  nav.querySelectorAll('.landing-nav-links a').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = a.getAttribute('href').replace('#', '');
      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // 2. Hero Section
  const hero = el('section', { className: 'landing-hero animate-fade-in' },
    el('span', { className: 'landing-hero-tag', textContent: 'Autonomous Coordination Engine' }),
    el('h1', { className: 'landing-hero-title', textContent: 'Distributed Multi-Agent Infrastructure' }),
    el('p', { className: 'landing-hero-subtitle', textContent: 'Synchronize, audit, and route communications across autonomous agent fleets with microsecond synchronization, semantic memories, and cryptographic reasoning traces.' }),
    el('div', { className: 'landing-hero-actions' },
      el('button', { className: 'btn btn-primary', textContent: 'Get Started' }),
      el('button', { className: 'btn btn-secondary', textContent: 'Explore SDK Docs' })
    )
  );

  hero.querySelector('.btn-primary').addEventListener('click', scrollToAuth);
  hero.querySelector('.btn-secondary').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('docs-sec')?.scrollIntoView({ behavior: 'smooth' });
  });

  // 3. Features Section
  const featuresGrid = el('div', { className: 'landing-features-grid animate-fade-in-up stagger-1' },
    createFeatureCard(
      'Overview Console',
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px;"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>`,
      'Real-time overview panel monitors agent statuses, network performance metrics, database health, and active thread pools dynamically.'
    ),
    createFeatureCard(
      'Agent Registry',
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px;"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>`,
      'Track identity, configurations, capability metrics, metadata, and lifecycle statuses of every agent in your fleet.'
    ),
    createFeatureCard(
      'Semantic Memory',
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px;"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>`,
      'Shared vector search stores context, instructions, and historical metadata. Search semantically across agents and nodes.'
    ),
    createFeatureCard(
      'Distributed Locks',
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px;"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
      'Prevent race conditions during agent interactions. Acquire, release, and inspect locks on database rows and third-party APIs.'
    ),
    createFeatureCard(
      'Chained Receipts',
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px;"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>`,
      'Audit log traces that verify execution steps, inputs, thoughts, tool calls, and outputs cryptographically.'
    ),
    createFeatureCard(
      'Agent Messages',
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
      'Peer-to-peer pub/sub messaging channels enable agents to exchange JSON events and coordinate actions safely.'
    )
  );

  const featuresSection = el('section', { id: 'features-sec', className: 'landing-section' },
    el('div', { className: 'landing-section-header' },
      el('span', { className: 'landing-section-tag', textContent: 'Core Capabilities' }),
      el('h2', { className: 'landing-section-title', textContent: 'Everything you need to orchestrate AI' })
    ),
    featuresGrid
  );

  // 4. Architecture Section
  const archFlow = el('div', { className: 'landing-arch-flow animate-fade-in-up stagger-2' },
    createArchNode('Agent Fleet', 'Local Python/JS agents running logic'),
    createArchArrow('SDK calls'),
    createArchNode('Axon Core API', 'FastAPI, Redis, pgvector database'),
    createArchArrow('PubSub stream'),
    createArchNode('Console', 'Real-time Vite UI web console')
  );

  const archSection = el('section', { id: 'arch-sec', className: 'landing-section' },
    el('div', { className: 'landing-section-header' },
      el('span', { className: 'landing-section-tag', textContent: 'Topological Architecture' }),
      el('h2', { className: 'landing-section-title', textContent: 'How Axon Coordinates Operations' }),
      el('p', { className: 'landing-section-subtitle', textContent: 'Axon coordinates agent states globally via a centralized backend gateway and distributes changes to the dashboard using WebSockets.' })
    ),
    archFlow
  );

  // 5. SDK / Docs Section
  const sdkSection = el('section', { id: 'docs-sec', className: 'landing-section' },
    el('div', { className: 'landing-section-header' },
      el('span', { className: 'landing-section-tag', textContent: 'Integration Quickstart' }),
      el('h2', { className: 'landing-section-title', textContent: 'Five lines of code to connect' })
    ),
    createQuickStartComponent()
  );

  // 6. Auth Gateway Section
  const authSection = el('section', { id: 'auth-sec', className: 'landing-section landing-auth-section' });
  renderAuthIn(authSection);

  // 7. Footer Section
  const footer = el('footer', { className: 'landing-footer' },
    el('div', { className: 'landing-footer-logo' },
      el('div', { className: 'landing-logo-mark' }, 'A'),
      el('span', { className: 'landing-logo-text', textContent: 'Axon' })
    ),
    el('div', { className: 'landing-footer-links' },
      el('a', { href: '#features-sec', className: 'landing-footer-link', textContent: 'Features' }),
      el('a', { href: '#arch-sec', className: 'landing-footer-link', textContent: 'Architecture' }),
      el('a', { href: '#docs-sec', className: 'landing-footer-link', textContent: 'Developer Guide' })
    ),
    el('div', { className: 'landing-brand-glow', textContent: 'Built by Zuggu Group' }),
    el('span', { className: 'landing-footer-text', textContent: `© ${new Date().getFullYear()} Axon Protocol. All rights reserved.` })
  );

  // Wrap landing content in a page layout container
  const landingWrapper = el('div', { className: 'landing-container' },
    nav,
    hero,
    featuresSection,
    archSection,
    sdkSection,
    authSection,
    footer
  );

  mount(container, landingWrapper);
}

// Helper: Feature card creator
function createFeatureCard(title, iconHtml, desc) {
  const iconDiv = el('div', { className: 'landing-feature-icon' });
  iconDiv.innerHTML = iconHtml;

  return el('div', { className: 'landing-feature-card' },
    iconDiv,
    el('h3', { className: 'landing-feature-title', textContent: title }),
    el('p', { className: 'landing-feature-desc', textContent: desc })
  );
}

// Helper: Architecture nodes
function createArchNode(title, subtitle) {
  return el('div', { className: 'landing-arch-node' },
    el('div', { className: 'landing-arch-node-title', textContent: title }),
    el('div', { className: 'landing-arch-node-subtitle', textContent: subtitle })
  );
}

function createArchArrow(text) {
  return el('div', { className: 'landing-arch-arrow' },
    el('span', { textContent: text }),
    el('div', { className: 'landing-arch-arrow-line' })
  );
}

// Helper: SDK Quick Start Code tabs switcher
function createQuickStartComponent() {
  const pythonCode = `
<span class="syntax-keyword">from</span> axon <span class="syntax-keyword">import</span> AxonClient

client = AxonClient(api_key=<span class="syntax-string">"your_token"</span>, project_id=<span class="syntax-string">"project_id"</span>)

<span class="syntax-comment"># Acquire lock to synchronize agent execution flow</span>
<span class="syntax-keyword">with</span> client.lock(<span class="syntax-string">"database_write_lock"</span>, timeout=<span class="syntax-string">30</span>):
    client.memory.store(
        content=<span class="syntax-string">"Task successfully completed by agent-01"</span>,
        tags={<span class="syntax-string">"agent"</span>: <span class="syntax-string">"alpha"</span>}
    )
  `.trim();

  const jsCode = `
<span class="syntax-keyword">import</span> { AxonClient } <span class="syntax-keyword">from</span> <span class="syntax-string">'@axon/sdk'</span>;

<span class="syntax-keyword">const</span> client = <span class="syntax-keyword">new</span> AxonClient({ apiKey: <span class="syntax-string">'your_token'</span>, projectId: <span class="syntax-string">'project_id'</span> });

<span class="syntax-comment">// Acquire coordination lock</span>
<span class="syntax-keyword">await</span> client.lock(<span class="syntax-string">'database_write_lock'</span>, <span class="syntax-keyword">async</span> () => {
  <span class="syntax-keyword">await</span> client.memory.store({
    content: <span class="syntax-string">'Task successfully completed by agent-01'</span>,
    tags: { agent: <span class="syntax-string">'alpha'</span> }
  });
});
  `.trim();

  const codeDisplay = el('code');
  codeDisplay.innerHTML = pythonCode;

  const pythonTab = el('button', { className: 'landing-tab active', textContent: 'Python SDK' });
  const jsTab = el('button', { className: 'landing-tab', textContent: 'JavaScript SDK' });

  pythonTab.addEventListener('click', () => {
    pythonTab.classList.add('active');
    jsTab.classList.remove('active');
    codeDisplay.innerHTML = pythonCode;
  });

  jsTab.addEventListener('click', () => {
    jsTab.classList.add('active');
    pythonTab.classList.remove('active');
    codeDisplay.innerHTML = jsCode;
  });

  return el('div', { className: 'landing-quickstart-container animate-fade-in-up stagger-3' },
    el('div', { className: 'landing-tabs' }, pythonTab, jsTab),
    el('div', { className: 'landing-code-card' },
      el('div', { className: 'landing-code-header' },
        el('div', { className: 'landing-code-dots' },
          el('div', { className: 'landing-code-dot' }),
          el('div', { className: 'landing-code-dot' }),
          el('div', { className: 'landing-code-dot' })
        ),
        el('div', { className: 'landing-code-lang', textContent: 'Example integration' })
      ),
      el('pre', { className: 'landing-code-content' }, codeDisplay)
    )
  );
}

// Helper: Render inline Login/Signup form
function renderAuthIn(authSection) {
  let isSignup = false;

  function renderForm() {
    authSection.innerHTML = '';

    const titleText = isSignup ? 'Create developer account' : 'Access Developer Console';
    const subtitleText = isSignup ? 'Get started with Zuggu Group\'s multi-agent platform' : 'Enter your credentials to manage Axon resources';
    const submitText = isSignup ? 'Sign Up' : 'Log In';
    const toggleText = isSignup ? 'Already have an account? Log in' : "Don't have an account? Create one";

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
        el('h2', { style: 'font-family: "JetBrains Mono", monospace; font-size: 20px; font-weight: 800; color: var(--text-primary);', textContent: titleText }),
        el('p', { style: 'font-size: 13px; color: var(--text-muted); margin-top: var(--space-xs); line-height: 1.4;', textContent: subtitleText })
      ),
      form,
      toggleLink
    );

    authSection.appendChild(authCard);
  }

  function restoreLayout() {
    const sidebar = document.getElementById('sidebar');
    const header = document.querySelector('header');
    const main = document.querySelector('main');
    
    if (sidebar) sidebar.style.display = 'block';
    if (header) header.style.display = 'flex';
    if (main) {
      main.style.marginLeft = '';
      main.style.padding = '';
      main.style.background = '';
    }
  }

  renderForm();
}

// Register landing page route
register('landing', renderLanding);
