import { el } from '../utils/dom.js';

export function createEmptyState(title, text, iconSvg = '') {
  return el('div', { className: 'empty-state animate-fade-in' },
    el('div', { className: 'empty-state-icon', innerHTML: iconSvg || '📁' }),
    el('div', { className: 'empty-state-title', textContent: title }),
    el('p', { className: 'empty-state-text', textContent: text })
  );
}
