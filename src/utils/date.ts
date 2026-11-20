/**
 * Local-time date and minute helpers.
 * Always computes YYYY-MM-DD from local calendar components — never via toISOString().
 */

export function getLocalDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 12, 0, 0, 0);
}

export function addDays(dateKey: string, deltaDays: number): string {
  const d = parseDateKey(dateKey);
  d.setDate(d.getDate() + deltaDays);
  return getLocalDateKey(d);
}

export function diffDays(fromDateKey: string, toDateKey: string): number {
  const from = parseDateKey(fromDateKey);
  const to = parseDateKey(toDateKey);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((to.getTime() - from.getTime()) / msPerDay);
}

export function getWeekday(dateKey: string): 0 | 1 | 2 | 3 | 4 | 5 | 6 {
  return parseDateKey(dateKey).getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
}

export function getLastNDaysKeys(n: number, endDateKey: string = getLocalDateKey()): string[] {
  const result: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    result.push(addDays(endDateKey, -i));
  }
  return result;
}

export function formatMinutes(totalMin: number): string {
  const clamped = Math.max(0, Math.min(24 * 60 - 1, Math.round(totalMin)));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function formatMinutes12h(totalMin: number): string {
  const clamped = Math.max(0, Math.min(24 * 60 - 1, Math.round(totalMin)));
  const h24 = Math.floor(clamped / 60);
  const m = clamped % 60;
  const period = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

export function parseTimeToMinutes(hhmm: string): number {
  const parts = hhmm.split(':');
  if (parts.length !== 2) return 0;
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return Math.max(0, Math.min(24 * 60 - 1, h * 60 + m));
}

export function getNowMinutes(now: Date = new Date()): number {
  return now.getHours() * 60 + now.getMinutes();
}

export function formatDisplayDate(dateKey: string): string {
  const d = parseDateKey(dateKey);
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDurationCompact(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
