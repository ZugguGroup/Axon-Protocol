import { el } from '../utils/dom.js';

export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = el('div', {
    className: `toast toast-${type}`,
    textContent: message
  });

  container.appendChild(toast);

  // Auto remove after 4 seconds
  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease-out forwards';
    toast.addEventListener('animationend', () => {
      toast.remove();
    });
  }, 4000);
}
