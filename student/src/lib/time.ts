// Shared time helpers. Class times are stored as 24-hour "HH:MM";
// events keep whatever the student typed ("3:30 PM"), so everything that
// reads a time goes through parseTime().

/**
 * Parses "9", "9am", "9:05", "09:05", "13:10", "1:10 pm", "3:30 PM".
 * Without am/pm, 1–6 o'clock is read as afternoon (school-day heuristic).
 * Returns minutes after midnight, or null when it can't be read.
 */
export function parseTime(raw: string | undefined | null): number | null {
  if (!raw) return null;
  const m = raw.trim().toLowerCase().match(/^(\d{1,2})(?::|\.|h)?(\d{2})?\s*(a\.?m\.?|p\.?m\.?)?$/);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  const ap = m[3]?.[0];
  if (h > 23 || min > 59) return null;
  if (ap === 'p' && h < 12) h += 12;
  else if (ap === 'a' && h === 12) h = 0;
  else if (!ap && h >= 1 && h <= 6) h += 12;
  return h * 60 + min;
}

export function toHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** "13:10" → "1:10 PM", "09:00" → "9 AM". Falls back to the raw text. */
export function fmt12(raw: string | number | undefined | null): string {
  const total = typeof raw === 'number' ? raw : parseTime(raw);
  if (total === null || total === undefined) return typeof raw === 'string' ? raw : '';
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  const ap = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return m === 0 ? `${h12} ${ap}` : `${h12}:${String(m).padStart(2, '0')} ${ap}`;
}

/** Normalises a typed time to "HH:MM", or returns null when it can't be read. */
export function normalizeTime(raw: string | undefined): string | null {
  const t = parseTime(raw);
  return t === null ? null : toHHMM(t);
}

export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function startOfDay(d: Date): Date {
  const x = new Date(d); x.setHours(0, 0, 0, 0); return x;
}

/** The streak only counts if the student did something today or yesterday. */
export function effectiveStreak(streak: number | null | undefined, lastActivityDate: string | null | undefined): number {
  if (!streak || !lastActivityDate) return 0;
  const today = dateKey(new Date());
  const y = new Date(); y.setDate(y.getDate() - 1);
  return lastActivityDate === today || lastActivityDate === dateKey(y) ? streak : 0;
}

/** "just now", "12 min ago", "2:14 PM", "Yesterday 7:30 PM", "Mon 4:02 PM", "Sep 3" */
export function relativeTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMin = Math.round((now.getTime() - d.getTime()) / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  const time = d.toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit' });
  if (isSameDay(d, now)) return time;
  const y = new Date(now); y.setDate(now.getDate() - 1);
  if (isSameDay(d, y)) return `Yesterday ${time}`;
  if (now.getTime() - d.getTime() < 6 * 86400000) return `${d.toLocaleDateString('en-CA', { weekday: 'short' })} ${time}`;
  return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
}
