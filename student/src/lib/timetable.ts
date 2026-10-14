import { Class, Timetable, Period } from '../types';
import { getDaySchedule, getClassBlocks } from '../data/schoolCalendars';
import { parseTime } from './time';

export const WEEKDAYS: Array<{ key: '1' | '2' | '3' | '4' | '5'; short: string; long: string }> = [
  { key: '1', short: 'Mon', long: 'Monday' },
  { key: '2', short: 'Tue', long: 'Tuesday' },
  { key: '3', short: 'Wed', long: 'Wednesday' },
  { key: '4', short: 'Thu', long: 'Thursday' },
  { key: '5', short: 'Fri', long: 'Friday' },
];

/** Slots for a new timetable: the school's bell blocks when known, otherwise blank times. */
export function defaultPeriods(count: number, schoolName?: string): Period[] {
  const blocks = schoolName ? getClassBlocks(schoolName) : null;
  return Array.from({ length: count }, (_, i) => ({
    id: `p${i + 1}`,
    label: blocks?.[i]?.label ?? `Class ${i + 1}`,
    start: blocks?.[i]?.start ?? '',
    end: blocks?.[i]?.end ?? '',
  }));
}

/** Every weekday gets the same order, using each class's block number when it has one. */
export function sameOrderDays(periods: Period[], classes: Class[]): Timetable['days'] {
  const row = periods.map((_, i) => {
    const bySlot = classes.find((c) => c.slot === i);
    if (bySlot) return bySlot.id;
    if (classes.some((c) => c.slot !== undefined && c.slot !== null)) return null;
    return classes[i]?.id ?? null;
  });
  return { '1': [...row], '2': [...row], '3': [...row], '4': [...row], '5': [...row] };
}

/** Resize every day's slot list when the number of classes per day changes. */
export function resizeDays(days: Timetable['days'], count: number, classes: Class[]): Timetable['days'] {
  const out = {} as Timetable['days'];
  for (const d of WEEKDAYS) {
    const row = [...(days[d.key] ?? [])].slice(0, count);
    while (row.length < count) row.push(classes[row.length]?.id ?? null);
    out[d.key] = row;
  }
  return out;
}

export interface ScheduledClass {
  cls: Class;
  start: string;
  end: string;
  slotLabel: string;
}

/**
 * The classes on a given date, in order, with that day's real times.
 * For schools with a bell schedule, adjusted days (late start, early
 * dismissal) use the adjusted times for each slot.
 */
export function classesOnDate(date: Date, classes: Class[], timetable: Timetable | null | undefined, schoolName?: string): ScheduledClass[] {
  const dow = date.getDay();
  if (dow === 0 || dow === 6) return [];

  if (!timetable || timetable.periods.length === 0) {
    // Older setups: every class meets every day at its own time
    return classes
      .filter((c) => parseTime(c.start) !== null && parseTime(c.end) !== null)
      .map((c) => ({ cls: c, start: c.start!, end: c.end!, slotLabel: '' }))
      .sort((a, b) => parseTime(a.start)! - parseTime(b.start)!);
  }

  // The day's actual class blocks from the bell schedule (merged around lunch)
  const sched = getDaySchedule(date, schoolName);
  let dayBlocks: Array<{ start: string; end: string }> | null = null;
  if (sched) {
    const merged: Array<{ label: string; start: string; end: string }> = [];
    for (const p of sched.periods) {
      if (p.kind !== 'class') continue;
      const last = merged[merged.length - 1];
      if (last && last.label === p.label) last.end = p.end;
      else merged.push({ label: p.label, start: p.start, end: p.end });
    }
    dayBlocks = merged;
  }

  const row = timetable.days[String(dow) as '1'] ?? [];
  const out: ScheduledClass[] = [];
  timetable.periods.forEach((p, i) => {
    const cls = classes.find((c) => c.id === row[i]);
    if (!cls) return;
    const start = dayBlocks?.[i]?.start ?? p.start;
    const end = dayBlocks?.[i]?.end ?? p.end;
    if (dayBlocks && !dayBlocks[i]) return; // early dismissal cut this block
    if (parseTime(start) === null || parseTime(end) === null) return;
    out.push({ cls, start, end, slotLabel: p.label });
  });
  return out;
}
