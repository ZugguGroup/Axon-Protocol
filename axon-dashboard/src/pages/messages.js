import { el, mount } from '../utils/dom.js';
import { getState } from '../state.js';
import * as api from '../api.js';
import * as ws from '../ws.js';
import { showToast } from '../components/toast.js';
import { createEmptyState } from '../components/empty-state.js';
import { formatDate, shortId } from '../utils/format.js';
import { register } from '../router.js';

export async function renderMessages() {
  const container = document.getElementById('content');
  const state = getState();

  container.innerHTML = `
    <div class="page-header animate-fade-in">
      <div>
        <h1 class="page-title">Agent Messaging Bus</h1>
        <p class="page-subtitle">Real-time direct messaging, topic pub/sub, and visual communication logs</p>
      </div>
    </div>
    
    <div class="grid grid-2 animate-fade-in-up stagger-1" style="grid-template-columns: 1fr 1.5fr; gap: var(--space-lg);">
      <!-- Left side: Forms & Inbox -->
      <div style="display: flex; flex-direction: column; gap: var(--space-lg);">
        <!-- Send Message Card -->
        <div class="card" style="padding: var(--space-lg);">
          <h2 style="font-size: 16px; font-weight: 600; margin-bottom: var(--space-md); color: var(--text-primary);">Send Bus Message</h2>
          <div style="display: flex; flex-direction: column; gap: var(--space-md);">
            <div class="input-group">
              <label class="input-label" for="msg-sender">Sender Agent</label>
              <select id="msg-sender" class="input"></select>
            </div>
            
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 2px;">
              <input type="checkbox" id="msg-is-topic" style="accent-color: var(--accent);">
              <label for="msg-is-topic" style="font-size: 13px; color: var(--text-secondary); cursor: pointer; user-select: none;">Publish to Topic instead of Agent</label>
            </div>

            <div class="input-group" id="recipient-group">
              <label class="input-label" for="msg-recipient">Recipient Agent</label>
              <select id="msg-recipient" class="input"></select>
            </div>

            <div class="input-group" id="topic-group" style="display: none;">
              <label class="input-label" for="msg-topic">Topic Name</label>
              <input id="msg-topic" class="input" placeholder="e.g. notifications.alerts">
            </div>

            <div class="input-group">
              <label class="input-label" for="msg-payload-text">Message Text</label>
              <textarea id="msg-payload-text" class="input" style="height: 80px; resize: none;" placeholder="Type your message text here..."></textarea>
            </div>

            <button class="btn btn-primary" id="btn-send-msg" style="width: 100%;">
              Send Message
            </button>
          </div>
        </div>

        <!-- Inbox Logs Card -->
        <div class="card" style="padding: 0; overflow: hidden; display: flex; flex-direction: column; height: 380px;">
          <div style="padding: var(--space-md); border-bottom: 1px solid var(--border-muted); display: flex; justify-content: space-between; align-items: center;">
            <h2 style="font-size: 15px; font-weight: 600; color: var(--text-primary);">Inbox Messages</h2>
            <button class="btn btn-secondary btn-sm" id="btn-refresh-inbox">Refresh</button>
          </div>
          <div id="messages-inbox-list" style="overflow-y: auto; flex: 1;">
            <div style="padding: var(--space-xl); text-align: center; color: var(--text-muted); font-size: 13px;">Loading messages...</div>
          </div>
        </div>
      </div>

      <!-- Right side: Visualizer Graph -->
      <div class="card" style="padding: var(--space-md); display: flex; flex-direction: column; overflow: hidden; position: relative;">
        <div style="margin-bottom: var(--space-sm); display: flex; justify-content: space-between; align-items: center;">
          <h2 style="font-size: 16px; font-weight: 600; color: var(--text-primary);">Bus Communication Graph</h2>
          <span style="font-size: 11px; color: var(--text-muted); display: flex; align-items: center; gap: 4px;">
            <span style="width: 8px; height: 8px; border-radius: 50%; background: #10b981; display: inline-block; animation: pulse 2s infinite;"></span>
            Live Event Listeners Active
          </span>
        </div>
        <div style="flex: 1; border: 1px solid var(--border-muted); border-radius: var(--radius-md); background: #0b0f19; overflow: hidden; height: 580px;">
          <canvas id="graph-canvas" style="display: block; width: 100%; height: 100%;"></canvas>
        </div>
      </div>
    </div>
  `;

  // UI elements
  const senderSelect = document.getElementById('msg-sender');
  const recipientSelect = document.getElementById('msg-recipient');
  const isTopicCheck = document.getElementById('msg-is-topic');
  const recipientGroup = document.getElementById('recipient-group');
  const topicGroup = document.getElementById('topic-group');
  const topicInput = document.getElementById('msg-topic');
  const payloadText = document.getElementById('msg-payload-text');
  const sendBtn = document.getElementById('btn-send-msg');
  const refreshBtn = document.getElementById('btn-refresh-inbox');
  const inboxListEl = document.getElementById('messages-inbox-list');
  const canvas = document.getElementById('graph-canvas');
  const ctx = canvas.getContext('2d');

  let agentsList = [];
  let inboxList = [];
  let currentAgent = null;

  // Toggle Topic Input
  isTopicCheck.onchange = () => {
    if (isTopicCheck.checked) {
      recipientGroup.style.display = 'none';
      topicGroup.style.display = 'block';
    } else {
      recipientGroup.style.display = 'block';
      topicGroup.style.display = 'none';
    }
  };

  // Set canvas size based on parent container client size
  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
  }
  
  // Call initially & handle window resize
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Load Sender/Recipient dropdowns and current Agent info
  async function loadAgents() {
    if (!state.serverOnline) return;
    try {
      const res = await api.agents.list();
      agentsList = res.agents || [];
      
      senderSelect.innerHTML = '';
      recipientSelect.innerHTML = '';

      agentsList.forEach(a => {
        senderSelect.appendChild(el('option', { value: a.id, textContent: `${a.name} (${shortId(a.id)})` }));
        recipientSelect.appendChild(el('option', { value: a.id, textContent: `${a.name} (${shortId(a.id)})` }));
      });

      // Also try to load the 'me' profile to select sender by default
      try {
        currentAgent = await api.agents.me();
        if (currentAgent && currentAgent.id) {
          senderSelect.value = currentAgent.id;
        }
      } catch (e) {
        // Ignored
      }
      
      // Initialize graph nodes with loaded agents
      agentsList.forEach(a => {
        getOrCreateNode(a.id, a.name);
      });
      distributeNodesInCircle();
    } catch (e) {
      showToast('Failed to load agents list', 'error');
    }
  }

  // Load Inbox messages
  async function loadInbox() {
    if (!state.serverOnline) return;
    try {
      // Load general inbox without specific topic
      const res = await api.messages.inbox(null, 40);
      inboxList = res.messages || [];
      renderInboxLogs();

      // For any messages in history, establish communication links
      inboxList.forEach(m => {
        if (m.sender_id && m.recipient_id) {
          getOrCreateNode(m.sender_id);
          getOrCreateNode(m.recipient_id);
          
          let link = links.find(l => 
            (l.source === m.sender_id && l.target === m.recipient_id) || 
            (l.source === m.recipient_id && l.target === m.sender_id)
          );
          if (!link) {
            links.push({ source: m.sender_id, target: m.recipient_id, activity: 0 });
          }
        }
      });
    } catch (e) {
      inboxListEl.innerHTML = `<div style="padding: var(--space-xl); text-align: center; color: var(--text-danger); font-size: 13px;">Error loading inbox: ${e.message}</div>`;
    }
  }

  // Render Inbox list HTML
  function renderInboxLogs() {
    inboxListEl.innerHTML = '';
    if (inboxList.length === 0) {
      inboxListEl.innerHTML = `<div style="padding: var(--space-xl); text-align: center; color: var(--text-muted); font-size: 13px;">No messages received in inbox.</div>`;
      return;
    }

    inboxList.forEach(m => {
      const isUnread = m.status === 'sent';
      const senderName = agentsList.find(a => a.id === m.sender_id)?.name || shortId(m.sender_id);
      const recipientName = m.recipient_id ? (agentsList.find(a => a.id === m.recipient_id)?.name || shortId(m.recipient_id)) : null;

      const item = el('div', { 
        className: 'inbox-item animate-fade-in', 
        style: `padding: var(--space-md); border-bottom: 1px solid var(--border-muted); position: relative; ${isUnread ? 'background: rgba(99, 102, 241, 0.05);' : ''}` 
      },
        el('div', { style: 'display: flex; justify-content: space-between; align-items: start; margin-bottom: 4px;' },
          el('span', { style: 'font-size: 12px; font-weight: 600; color: var(--text-primary);' }, 
            recipientName ? `${senderName} ➔ ${recipientName}` : `${senderName} ➔ Broadcast`
          ),
          el('span', { style: 'font-size: 10px; color: var(--text-muted);' }, formatDate(m.created_at))
        ),
        m.topic ? el('span', { className: 'badge badge-purple', style: 'font-size: 9px; padding: 1px 4px; margin-bottom: 4px; display: inline-block;', textContent: `#${m.topic}` }) : null,
        el('p', { style: 'font-size: 12px; color: var(--text-secondary); margin-bottom: var(--space-xs); font-family: var(--font-mono); word-break: break-all;', textContent: m.payload?.text || JSON.stringify(m.payload) }),
        isUnread ? el('button', {
          className: 'btn btn-secondary btn-sm',
          style: 'position: absolute; right: var(--space-md); bottom: var(--space-md); font-size: 10px; padding: 2px 8px;',
          textContent: 'Ack',
          onclick: async (e) => {
            e.stopPropagation();
            try {
              // Authenticate temporarily as the recipient agent to ack their unread message
              const senderKey = localStorage.getItem('axon_api_key');
              
              // Call ack
              await api.messages.ack(m.id);
              m.status = 'acknowledged';
              showToast('Message acknowledged!', 'success');
              renderInboxLogs();
            } catch (err) {
              showToast(`Ack failed: ${err.message}`, 'error');
            }
          }
        }) : el('span', { style: 'font-size: 10px; color: var(--text-muted); position: absolute; right: var(--space-md); bottom: var(--space-md);', textContent: '✓ Read' })
      );

      inboxListEl.appendChild(item);
    });
  }

  // Click handler to send a message
  sendBtn.onclick = async () => {
    const senderId = senderSelect.value;
    const isTopic = isTopicCheck.checked;
    const recipientId = isTopic ? null : recipientSelect.value;
    const topic = isTopic ? topicInput.value.trim() : null;
    const text = payloadText.value.trim();

    if (isTopic && !topic) {
      showToast('Topic Name is required!', 'error');
      return;
    }
    if (!isTopic && !recipientId) {
      showToast('Recipient Agent is required!', 'error');
      return;
    }
    if (!text) {
      showToast('Message text is required!', 'error');
      return;
    }

    sendBtn.disabled = true;
    sendBtn.textContent = 'Sending...';

    try {
      // Swap API key dynamically to match selection sender API key if different
      // Normally agents send messages on behalf of themselves.
      // But from the admin dashboard, we will temporarily impersonate the sender.
      // If we don't have their individual API key, we call send using dashboard's key.
      await api.messages.send(recipientId, topic, { text });
      
      showToast('Message sent to bus!', 'success');
      payloadText.value = '';
      
      // Reload inbox logs
      await loadInbox();
    } catch (e) {
      showToast(`Send failed: ${e.message}`, 'error');
    } finally {
      sendBtn.disabled = false;
      sendBtn.textContent = 'Send Message';
    }
  };

  refreshBtn.onclick = loadInbox;

  // ─── Graph Physics and Visualization System ───
  const nodes = [];
  const links = [];
  let particles = [];

  function getOrCreateNode(id, name = null) {
    let node = nodes.find(n => n.id === id);
    if (!node) {
      const rect = canvas.getBoundingClientRect();
      node = {
        id,
        name: name || agentsList.find(a => a.id === id)?.name || id.slice(0, 8),
        x: rect.width / 2 + (Math.random() - 0.5) * 120,
        y: rect.height / 2 + (Math.random() - 0.5) * 120,
        vx: 0,
        vy: 0,
        pulse: 0
      };
      nodes.push(node);
    }
    return node;
  }

  function distributeNodesInCircle() {
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 600;
    const height = rect.height || 500;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.35;

    nodes.forEach((node, i) => {
      const angle = (i / nodes.length) * 2 * Math.PI;
      node.x = centerX + Math.cos(angle) * radius;
      node.y = centerY + Math.sin(angle) * radius;
      node.vx = 0;
      node.vy = 0;
    });
  }

  function updatePhysics() {
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 600;
    const height = rect.height || 500;
    const centerX = width / 2;
    const centerY = height / 2;

    // 1. Push nodes apart (Repulsion)
    for (let i = 0; i < nodes.length; i++) {
      const n1 = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const n2 = nodes[j];
        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const minDistance = 140;
        if (dist < minDistance) {
          const force = (minDistance - dist) * 0.08;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          n1.vx -= fx;
          n1.vy -= fy;
          n2.vx += fx;
          n2.vy += fy;
        }
      }
    }

    // 2. Pull connected nodes together (Attraction)
    links.forEach(link => {
      const n1 = nodes.find(n => n.id === link.source);
      const n2 = nodes.find(n => n.id === link.target);
      if (n1 && n2) {
        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const targetLen = 200;
        const force = (dist - targetLen) * 0.008; // Spring
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        n1.vx += fx;
        n1.vy += fy;
        n2.vx -= fx;
        n2.vy -= fy;
      }
    });

    // 3. Friction, gravity towards center, and update coordinates
    nodes.forEach(n => {
      // gravity towards center
      const gForce = 0.015;
      n.vx += (centerX - n.x) * gForce;
      n.vy += (centerY - n.y) * gForce;

      // friction
      n.vx *= 0.75;
      n.vy *= 0.75;

      // update pos
      n.x += n.vx;
      n.y += n.vy;

      // boundaries
      n.x = Math.max(30, Math.min(width - 30, n.x));
      n.y = Math.max(30, Math.min(height - 30, n.y));

      // fade pulse
      if (n.pulse > 0) n.pulse -= 0.03;
    });

    // 4. Update flying particles
    particles = particles.filter(p => {
      p.progress += 0.025; // animation speed
      return p.progress < 1;
    });

    // 5. Fade link activities
    links.forEach(l => {
      if (l.activity > 0) l.activity -= 0.008;
    });
  }

  function draw() {
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 600;
    const height = rect.height || 500;

    ctx.clearRect(0, 0, width, height);

    // Draw links
    links.forEach(link => {
      const n1 = nodes.find(n => n.id === link.source);
      const n2 = nodes.find(n => n.id === link.target);
      if (n1 && n2) {
        ctx.beginPath();
        ctx.moveTo(n1.x, n1.y);
        ctx.lineTo(n2.x, n2.y);
        if (link.activity > 0) {
          ctx.strokeStyle = `rgba(129, 140, 248, ${0.15 + link.activity * 0.7})`;
          ctx.lineWidth = 1.5 + link.activity * 2;
        } else {
          ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
          ctx.lineWidth = 1;
        }
        ctx.stroke();
      }
    });

    // Draw nodes
    nodes.forEach(n => {
      // Draw pulse halo
      if (n.pulse > 0) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, 20 + n.pulse * 20, 0, 2 * Math.PI);
        ctx.fillStyle = `rgba(129, 140, 248, ${n.pulse * 0.25})`;
        ctx.fill();
      }

      // Draw node circle
      ctx.beginPath();
      ctx.arc(n.x, n.y, 14, 0, 2 * Math.PI);
      ctx.fillStyle = '#6366f1';
      ctx.strokeStyle = '#818cf8';
      ctx.lineWidth = 2.5;
      ctx.fill();
      ctx.stroke();

      // Node labels
      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = '#f8fafc';
      ctx.textAlign = 'center';
      ctx.fillText(n.name, n.x, n.y - 20);

      ctx.font = '9px monospace';
      ctx.fillStyle = '#64748b';
      ctx.fillText(shortId(n.id), n.x, n.y + 24);
    });

    // Draw flying particles
    particles.forEach(p => {
      const x = p.fromX + (p.toX - p.fromX) * p.progress;
      const y = p.fromY + (p.toY - p.fromY) * p.progress;

      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = '#10b981'; // emerald green
      ctx.fill();

      if (p.text) {
        ctx.font = '9px sans-serif';
        ctx.fillStyle = '#34d399';
        ctx.fillText(p.text.length > 15 ? p.text.slice(0, 12) + '...' : p.text, x, y - 8);
      }
    });
  }

  // Animation Loop
  let animId = null;
  function tick() {
    updatePhysics();
    draw();
    animId = requestAnimationFrame(tick);
  }
  tick();

  // ─── Live WS Event Stream Listener ───
  const unsubscribe = ws.subscribe((data) => {
    // Check if the event matches agent-to-agent messaging type
    if (data.type === 'agent.message') {
      const msg = data.payload;
      if (!msg) return;

      const senderId = msg.sender_id;
      const recipientId = msg.recipient_id;

      const senderNode = getOrCreateNode(senderId);
      senderNode.pulse = 1.0;

      if (recipientId) {
        const recipientNode = getOrCreateNode(recipientId);
        recipientNode.pulse = 1.0;

        // Ensure link exists
        let link = links.find(l => 
          (l.source === senderId && l.target === recipientId) || 
          (l.source === recipientId && l.target === senderId)
        );
        if (!link) {
          link = { source: senderId, target: recipientId, activity: 0 };
          links.push(link);
        }
        link.activity = 1.0;

        // Spawn particle animation
        particles.push({
          fromX: senderNode.x,
          fromY: senderNode.y,
          toX: recipientNode.x,
          toY: recipientNode.y,
          progress: 0,
          text: msg.payload?.text || msg.topic || 'Message'
        });
      } else if (msg.topic) {
        // Broadcast: spawn particles from sender to all other registered agent nodes
        nodes.forEach(n => {
          if (n.id !== senderId) {
            particles.push({
              fromX: senderNode.x,
              fromY: senderNode.y,
              toX: n.x,
              toY: n.y,
              progress: 0,
              text: `#${msg.topic}`
            });
            n.pulse = 0.5;
          }
        });
      }

      // Prepend message to inbox list & refresh logs view
      inboxList.unshift(msg);
      renderInboxLogs();
    }
  });

  // Load and setup initial data
  await loadAgents();
  await loadInbox();

  // Cleanup loop and WS listeners on route unmount
  const checkPageChange = () => {
    if (!document.getElementById('graph-canvas')) {
      unsubscribe();
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('hashchange', checkPageChange);
    }
  };
  window.addEventListener('hashchange', checkPageChange);
}

// Register route
register('messages', renderMessages);
