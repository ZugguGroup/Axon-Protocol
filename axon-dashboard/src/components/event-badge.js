import { el } from '../utils/dom.js';

export function createEventBadge(eventType) {
  let badgeClass = 'badge-info';
  let label = eventType;

  if (eventType.includes('lock.acquired')) {
    badgeClass = 'badge-info';
    label = 'Lock Acquired';
  } else if (eventType.includes('lock.released')) {
    badgeClass = 'badge-success';
    label = 'Lock Released';
  } else if (eventType.includes('memory.stored')) {
    badgeClass = 'badge-purple';
    label = 'Memory Stored';
  } else if (eventType.includes('receipt.created')) {
    badgeClass = 'badge-warning';
    label = 'Receipt Created';
  } else if (eventType === 'ws.connected') {
    badgeClass = 'badge-success';
    label = 'WS Connected';
  } else if (eventType === 'ws.disconnected') {
    badgeClass = 'badge-error';
    label = 'WS Offline';
  }

  return el('span', { className: `badge ${badgeClass}`, textContent: label });
}
