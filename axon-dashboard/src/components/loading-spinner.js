import { el } from '../utils/dom.js';

export function createSkeletonCard() {
  return el('div', { className: 'card skeleton skeleton-card' });
}

export function createSkeletonTable(rows = 5, cols = 4) {
  const tbody = el('tbody');
  for (let r = 0; r < rows; r++) {
    const tr = el('tr');
    for (let c = 0; c < cols; c++) {
      tr.appendChild(
        el('td', {},
          el('div', {
            className: `skeleton skeleton-line ${c === 0 ? 'medium' : 'short'}`
          })
        )
      );
    }
    tbody.appendChild(tr);
  }

  return el('div', { className: 'table-container' },
    el('table', {},
      el('thead', {},
        el('tr', {},
          ...Array(cols).fill(0).map(() => el('th', {}, el('div', { className: 'skeleton skeleton-line short' })))
        )
      ),
      tbody
    )
  );
}
