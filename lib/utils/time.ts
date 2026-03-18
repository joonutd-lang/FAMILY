export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function toIsoDate(iso: string) {
  return iso.slice(0, 10);
}

export function formatDateShort(d: Date) {
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export function formatTimeShort(d: Date) {
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function formatDateTimeShort(d: Date) {
  return `${formatDateShort(d)} • ${formatTimeShort(d)}`;
}

export function formatCountdown(ms: number) {
  const total = Math.max(0, ms);
  const s = Math.floor(total / 1000);
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export function getNowIso() {
  return new Date().toISOString();
}

