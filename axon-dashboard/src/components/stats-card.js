import { el } from '../utils/dom.js';

export function createStatsCard(title, value, colorClass = 'purple', iconSvg = '', subtitle = '') {
  const valueEl = el('div', { className: 'card-value', textContent: '0' });

  const card = el('div', { className: 'card stat-card' },
    el('div', { className: 'card-header' },
      el('span', { className: 'card-title', textContent: title }),
      el('div', { className: `stat-icon ${colorClass}`, innerHTML: iconSvg })
    ),
    valueEl,
    el('div', { className: 'card-subtitle', textContent: subtitle })
  );

  // Animate value
  const targetVal = parseInt(value, 10);
  if (!isNaN(targetVal) && targetVal > 0) {
    let startTimestamp = null;
    const duration = 800; // ms
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      valueEl.textContent = Math.floor(progress * targetVal);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  } else {
    valueEl.textContent = value;
  }

  return card;
}
