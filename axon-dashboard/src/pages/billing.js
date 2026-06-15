import { el, mount } from '../utils/dom.js';
import { getState, setState } from '../state.js';
import * as api from '../api.js';
import { showToast } from '../components/toast.js';
import { register } from '../router.js';

export async function renderBilling() {
  const container = document.getElementById('content');
  const state = getState();

  // 1. Loading screen
  container.innerHTML = `
    <div class="page-header animate-fade-in">
      <div>
        <h1 class="page-title">Billing & Quota Control</h1>
        <p class="page-subtitle">Manage your cloud subscription plan and monitor multi-tenant usage metrics</p>
      </div>
    </div>
    <div class="grid-2 section-gap">
      <div class="card skeleton" style="height: 350px;"></div>
      <div class="card skeleton" style="height: 350px;"></div>
    </div>
  `;

  // Handle mock checkout success callback if present in URL
  const urlParams = new URLSearchParams(window.location.search);
  const mockCheckout = urlParams.get('mock_checkout');
  const mockUserId = urlParams.get('user_id');
  if (mockCheckout === 'success' && mockUserId) {
    try {
      await fetch('/v1/billing/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'subscription.updated', user_id: mockUserId })
      });
      window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
      showToast('Mock upgrade session completed successfully! You are now Pro.', 'success');
    } catch (e) {
      console.error('Failed to trigger mock upgrade webhook:', e);
    }
  }

  // Handle mock portal success
  const mockPortal = urlParams.get('mock_portal');
  if (mockPortal === 'success') {
    window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
    showToast('Mock billing customer portal loaded successfully.', 'info');
  }

  // 2. Fetch User & Project Stats
  let plan = 'free';
  let status = 'active';
  let projectCount = 0;
  let agentCount = 0;
  let memoryCount = 0;

  try {
    const userRes = await api.auth.me();
    const projectList = await api.projects.list().catch(() => []);
    projectCount = projectList.length;

    const activeProject = localStorage.getItem('axon_project_id');
    if (activeProject) {
      const agentsRes = await api.agents.list().catch(() => ({ agents: [] }));
      agentCount = agentsRes.agents?.length || 0;
      const memoriesRes = await api.memory.list().catch(() => ({ memories: [] }));
      memoryCount = memoriesRes.memories?.length || 0;
    }

    const subResponse = await fetch('/v1/billing/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'query', user_id: userRes.user_id })
    }).then(r => r.json()).catch(() => ({ plan: 'free', status: 'active' }));
    
    plan = subResponse.plan || 'free';
    status = subResponse.status || 'active';
  } catch (err) {
    console.error('Failed to resolve billing details:', err);
  }

  container.innerHTML = '';

  const header = el('div', { className: 'page-header animate-fade-in' },
    el('div', {},
      el('h1', { className: 'page-title', textContent: 'Billing & Quota Control' }),
      el('p', { className: 'page-subtitle', textContent: 'Manage your cloud subscription plan and monitor multi-tenant usage metrics' })
    )
  );

  // Define Limits
  const projectLimit = plan === 'free' ? 1 : 10;
  const agentLimit = plan === 'free' ? 3 : 50;
  const memoryLimit = plan === 'free' ? 1000 : 100000;
  const lockRateLimit = plan === 'free' ? '5 req/min' : '300 req/min';

  // Circular SVG progress ring generator
  const createCircularRing = (title, current, limit) => {
    const pct = Math.min(100, Math.round((current / limit) * 100));
    const radius = 30;
    const circumference = 2 * Math.PI * radius; // 188.49
    const offset = circumference - (pct / 100) * circumference;

    return el('div', { 
      style: 'display: flex; flex-direction: column; align-items: center; gap: var(--space-sm); background: rgba(255, 255, 255, 0.01); border: 1px solid rgba(255, 255, 255, 0.03); border-radius: var(--radius-md); padding: var(--space-md) var(--space-lg); min-width: 140px; transition: transform 0.2s ease, border-color 0.2s ease;' 
    },
      el('div', { style: 'position: relative; width: 80px; height: 80px;' },
        el('div', {
          innerHTML: `
            <svg width="80" height="80" style="transform: rotate(-90deg); overflow: visible;">
              <defs>
                <linearGradient id="billing-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="var(--accent-primary, #8b5cf6)" />
                  <stop offset="100%" stop-color="var(--accent-secondary, #ec4899)" />
                </linearGradient>
              </defs>
              <circle cx="40" cy="40" r="${radius}" stroke="var(--bg-tertiary, #1f2937)" stroke-width="6" fill="transparent" />
              <circle cx="40" cy="40" r="${radius}" stroke="url(#billing-ring-grad)" stroke-width="6" fill="transparent"
                stroke-dasharray="${circumference}" 
                stroke-dashoffset="${offset}"
                style="stroke-linecap: round; transition: stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1);" />
            </svg>
            <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800; color: var(--text-primary);">
              ${pct}%
            </div>
          `
        })
      ),
      el('span', { style: 'font-size: 13px; font-weight: 700; color: var(--text-secondary); text-align: center;', textContent: title }),
      el('span', { style: 'font-size: 11px; color: var(--text-muted); font-family: var(--font-mono);', textContent: `${current} / ${limit}` })
    );
  };

  // 1. Quota Usage Card
  const quotaCard = el('div', { className: 'card animate-fade-in-up stagger-1', style: 'padding: var(--space-xl); background: rgba(255,255,255,0.01); border: 1px solid rgba(255,255,255,0.05);' },
    el('div', { className: 'card-header', style: 'margin-bottom: var(--space-lg);' },
      el('span', { className: 'card-title', style: 'font-size: 16px; font-weight: 700;', textContent: 'Current Resource Allocations' }),
      el('span', { className: `badge ${plan === 'pro' ? 'badge-purple' : 'badge-info'}`, textContent: `Active: ${plan.toUpperCase()}` })
    ),
    el('div', { style: 'display: flex; flex-wrap: wrap; gap: var(--space-lg); justify-content: space-around; margin-top: var(--space-xl);' },
      createCircularRing('Projects Managed', projectCount, projectLimit),
      createCircularRing('Registered Agents', agentCount, agentLimit),
      createCircularRing('Semantic Memories', memoryCount, memoryLimit)
    ),
    el('div', { style: 'display: flex; justify-content: space-between; align-items: center; font-size: 13px; font-weight: 600; border-top: 1px solid var(--border-color); padding-top: var(--space-lg); margin-top: var(--space-xl); color: var(--text-secondary);' },
      el('span', { textContent: 'Lock Operations Rate Limit' }),
      el('span', { className: 'badge badge-dark', style: 'font-family: var(--font-mono); font-size: 12px;', textContent: lockRateLimit })
    )
  );

  // checkout callback click
  const handlePricingAction = async (targetPlan, btnElement) => {
    btnElement.disabled = true;
    btnElement.innerHTML = `<span class="spinner" style="margin-right: 8px;"></span>Redirecting securely...`;
    
    try {
      let res;
      if (targetPlan === 'pro') {
        res = await api.billing.checkout(window.location.origin);
      } else {
        res = await api.billing.portal(window.location.origin);
      }
      // Simulate nice fadeout transition before redirecting
      document.getElementById('content').style.opacity = '0.3';
      setTimeout(() => {
        window.location.href = res.url || res.checkout_url || res.portal_url;
      }, 300);
    } catch (e) {
      showToast(e.message || 'Billing session redirect failed', 'error');
      btnElement.disabled = false;
      btnElement.innerHTML = targetPlan === 'pro' ? 'Upgrade to Cloud Pro' : 'Manage Subscription';
    }
  };

  // Plan Button Creators
  const freeBtn = el('button', { 
    className: 'btn btn-secondary', 
    style: 'width: 100%; justify-content: center; padding: var(--space-md); font-weight: 700; margin-top: var(--space-xl);', 
    textContent: plan === 'free' ? 'Current Active Plan' : 'Manage Downgrade'
  });
  if (plan !== 'free') {
    freeBtn.addEventListener('click', (e) => handlePricingAction('free', freeBtn));
  } else {
    freeBtn.disabled = true;
  }

  const proBtn = el('button', { 
    className: 'btn btn-primary', 
    style: 'width: 100%; justify-content: center; padding: var(--space-md); font-weight: 700; margin-top: var(--space-xl); background: var(--accent-gradient); border: none; box-shadow: 0 4px 14px 0 rgba(139, 92, 246, 0.4);', 
    textContent: plan === 'pro' ? 'Manage Subscription' : 'Upgrade to Cloud Pro' 
  });
  proBtn.addEventListener('click', (e) => handlePricingAction(plan === 'pro' ? 'portal' : 'pro', proBtn));

  // 2. Pricing Plan Cards Grid (Glassmorphism layout)
  const plansContainer = el('div', { className: 'grid-2 section-gap', style: 'margin-top: var(--space-xl);' },
    // Plan 1: Free Tier Card
    el('div', { 
      className: 'card animate-fade-in-up stagger-2', 
      style: `
        display: flex; flex-direction: column; justify-content: space-between; 
        background: rgba(255, 255, 255, 0.02); 
        backdrop-filter: blur(12px); 
        border: 1px solid rgba(255, 255, 255, 0.04);
        border-radius: var(--radius-lg);
        padding: var(--space-xl);
        position: relative;
        overflow: hidden;
        transition: border-color 0.3s ease, box-shadow 0.3s ease;
      ` 
    },
      el('div', {},
        el('div', { style: 'display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-md);' },
          el('h3', { style: 'font-size: 18px; font-weight: 700; color: var(--text-primary);', textContent: 'Free Tier' }),
          plan === 'free' ? el('span', { className: 'badge badge-success', textContent: 'Active' }) : null
        ),
        el('div', { style: 'margin-bottom: var(--space-lg);' },
          el('span', { style: 'font-size: 32px; font-weight: 800; color: var(--text-primary);', textContent: '$0' }),
          el('span', { style: 'font-size: 13px; color: var(--text-muted); margin-left: 4px;', textContent: '/ forever' })
        ),
        el('p', { style: 'font-size: 13px; color: var(--text-muted); line-height: 1.5; margin-bottom: var(--space-xl);', textContent: 'Perfect for prototyping, testing agent coordination, and single-project evaluation.' }),
        el('ul', { style: 'display: flex; flex-direction: column; gap: var(--space-md); font-size: 13px; color: var(--text-secondary); list-style: none; padding: 0; margin: 0;' },
          el('li', { textContent: '✔ 1 Active Database Project' }),
          el('li', { textContent: '✔ Max 3 Registered Agents' }),
          el('li', { textContent: '✔ 1,000 vector memory entries' }),
          el('li', { textContent: '✔ 5 lock operations/min rate limit' }),
          el('li', { textContent: '✔ reasoning logs chain integrity verification' })
        )
      ),
      freeBtn
    ),

    // Plan 2: Pro Tier Card (Vivid glassmorphism styling)
    el('div', { 
      className: 'card animate-fade-in-up stagger-3', 
      style: `
        display: flex; flex-direction: column; justify-content: space-between; 
        background: rgba(139, 92, 246, 0.04); 
        backdrop-filter: blur(12px); 
        border: 1px solid rgba(139, 92, 246, 0.2);
        box-shadow: 0 8px 32px 0 rgba(139, 92, 246, 0.08);
        border-radius: var(--radius-lg);
        padding: var(--space-xl);
        position: relative;
        overflow: hidden;
        transition: border-color 0.3s ease, box-shadow 0.3s ease;
      ` 
    },
      el('div', {},
        // Floating gradient glow
        el('div', { style: 'position: absolute; top: -50px; right: -50px; width: 120px; height: 120px; border-radius: var(--radius-full); background: radial-gradient(circle, rgba(139,92,246,0.3) 0%, rgba(236,72,153,0.1) 100%); filter: blur(20px); pointer-events: none;' }),
        el('div', { style: 'display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-md);' },
          el('h3', { style: 'font-size: 18px; font-weight: 700; color: var(--text-primary);', textContent: 'Cloud Pro Tier' }),
          plan === 'pro' ? el('span', { className: 'badge badge-purple', textContent: 'Active' }) : el('span', { className: 'badge badge-purple', textContent: 'Popular' })
        ),
        el('div', { style: 'margin-bottom: var(--space-lg);' },
          el('span', { style: 'font-size: 32px; font-weight: 800; color: var(--text-primary);', textContent: '$29' }),
          el('span', { style: 'font-size: 13px; color: var(--text-muted); margin-left: 4px;', textContent: '/ month' })
        ),
        el('p', { style: 'font-size: 13px; color: var(--text-muted); line-height: 1.5; margin-bottom: var(--space-xl);', textContent: 'Designed for production workloads with large persistent memories and high lock density.' }),
        el('ul', { style: 'display: flex; flex-direction: column; gap: var(--space-md); font-size: 13px; color: var(--text-secondary); list-style: none; padding: 0; margin: 0;' },
          el('li', { textContent: '✔ Up to 10 Active Scoped Projects' }),
          el('li', { textContent: '✔ Up to 50 Concurrent Agents' }),
          el('li', { textContent: '✔ 100,000 vector memory entries' }),
          el('li', { textContent: '✔ 300 lock operations/min rate limit' }),
          el('li', { textContent: '✔ Priority WebSocket event propagation' }),
          el('li', { textContent: '✔ Custom vector embedding dimensions' })
        )
      ),
      proBtn
    )
  );

  const mainLayout = el('div', { className: 'section-gap' }, quotaCard, plansContainer);

  mount(container, header, mainLayout);
}

register('billing', renderBilling);
