import { CalEvent } from '../types';
import { dateKey, isSameDay, parseTime, startOfDay } from './time';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function weekdayName(d: Date): string {
  return DAY_NAMES[d.getDay()];
}

/** Does this event happen on this date? Handles weekly repeats, end dates and skipped days. */
export function occursOn(ev: CalEvent, day: Date): boolean {
  if (!ev.date) return false;
  const first = new Date(ev.date);
  if (ev.repeat !== 'weekly') return isSameDay(first, day);
  const d = startOfDay(day);
  if (d < startOfDay(first)) return false;
  if (d.getDay() !== first.getDay()) return false;
  if (ev.repeatUntil && d > startOfDay(new Date(ev.repeatUntil))) return false;
  if ((ev.skipDates ?? []).includes(dateKey(d))) return false;
  return true;
}

/** Everything happening on a date, earliest first. Each copy knows which day it's for. */
export function eventsOn(events: CalEvent[], day: Date): CalEvent[] {
  return events
    .filter((e) => occursOn(e, day))
    .map((e) => ({ ...e, occurrence: dateKey(day) }))
    .sort((a, b) => (parseTime(a.time) ?? 0) - (parseTime(b.time) ?? 0));
}

/** "Every Thursday" / "Every Thursday until Dec 18", or '' for one-off events. */
export function repeatLabel(ev: CalEvent): string {
  if (ev.repeat !== 'weekly' || !ev.date) return '';
  const base = `Every ${weekdayName(new Date(ev.date))}`;
  return ev.repeatUntil
    ? `${base} until ${new Date(ev.repeatUntil).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}`
    : base;
}

/** Next date (from today) this event happens, or null. */
export function nextOccurrence(ev: CalEvent, from = new Date()): Date | null {
  for (let i = 0; i < 370; i++) {
    const d = new Date(from); d.setDate(from.getDate() + i);
    if (occursOn(ev, d)) return d;
    if (ev.repeat !== 'weekly' && i > 0) break;
  }
  return null;
}
