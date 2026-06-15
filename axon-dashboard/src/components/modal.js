import { el, mount } from '../utils/dom.js';

export function openModal(title, content, onConfirm = null, confirmText = 'Confirm') {
  const overlay = document.getElementById('modal-overlay');
  if (!overlay) return;

  const contentContainer = el('div', { className: 'modal-body' });
  if (typeof content === 'string') {
    contentContainer.innerHTML = content;
  } else if (content instanceof Node) {
    contentContainer.appendChild(content);
  }

  const actions = el('div', { className: 'modal-actions' },
    el('button', {
      className: 'btn btn-secondary',
      textContent: 'Cancel',
      onclick: closeModal
    })
  );

  if (onConfirm) {
    actions.appendChild(
      el('button', {
        className: 'btn btn-primary',
        textContent: confirmText,
        onclick: async () => {
          const result = await onConfirm();
          if (result !== false) closeModal(); // Close unless returned false (validation error)
        }
      })
    );
  }

  const modal = el('div', { className: 'modal' },
    el('h3', { className: 'modal-title', textContent: title }),
    contentContainer,
    actions
  );

  mount(overlay, modal);
  overlay.classList.add('active');
}

export function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) {
    overlay.classList.remove('active');
    overlay.innerHTML = '';
  }
}
