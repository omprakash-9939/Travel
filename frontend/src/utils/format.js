export function formatTime(dateStr) {
  if (!dateStr) return '--:--';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function formatDuration(minutes) {
  if (typeof minutes === 'string') return minutes;
  if (!minutes) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

export function cabinToApi(cabin) {
  return (cabin || 'economy').toLowerCase().replace(/\s+/g, '');
}
