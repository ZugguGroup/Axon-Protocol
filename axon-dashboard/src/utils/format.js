export function shortId(uuid) {
  if (!uuid) return '—';
  return uuid.substring(0, 8);
}

export function timeAgo(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
}

export function countdown(expiresAt) {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diff = expires - now;

  if (diff <= 0) return { text: 'Expired', status: 'expired' };

  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  const text = `${minutes}m ${seconds}s`;
  const status = minutes < 1 ? 'expiring' : 'safe';
  return { text, status };
}

export function truncate(str, maxLen = 80) {
  if (!str || str.length <= maxLen) return str;
  return str.substring(0, maxLen) + '…';
}
