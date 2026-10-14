// School calendars and bell schedules.
//
// Sutherland Secondary (SD44 North Vancouver) has its full 2026–27 calendar
// and bell schedule. Every other school gets BC statutory holidays only,
// because district breaks and Pro-D days differ.
//
// Sutherland sources (compiled Oct 2026):
//   https://www.sd44.ca/District/DistrictCalendar/Documents/Final%202026-27%20School%20Calendar.pdf
//   https://www.sd44.ca/school/sutherland/About/Calendar/Documents/Sutherland%20Overview%20Calendar%202026-2027.pdf
//   https://sutherland.sd44.ca/about-our-school/daily-schedules/
//   https://www.sd44.ca/school/sutherland/About/Calendar/Documents/Sutherland%20Bell%20Schedule%202026-2027.pdf
// To verify with the school: lunch time (one source says 13:05–13:50), the school-based
// Pro-D days (Nov 20, Apr 9), the semester turnaround day (Jan 27) and the March
// early-dismissal time.

import { dateKey, parseTime, fmt12 } from '../lib/time';

export interface ClosedDay { date: string; label: string }
export type PeriodKind = 'class' | 'lunch' | 'break' | 'tutorial';
export interface BellPeriod { label: string; start: string; end: string; kind: PeriodKind }

interface SchoolCalendar {
  closedDays: ClosedDay[];
  earlyDismissals: Array<{ date: string; label: string; end: string }>;
  lateStartDays: string[];
  bells: { default: BellPeriod[]; monday?: BellPeriod[]; lateStart?: BellPeriod[] };
}

const range = (from: string, to: string, label: string): ClosedDay[] => {
  const out: ClosedDay[] = [];
  const d = new Date(from + 'T12:00:00');
  const end = new Date(to + 'T12:00:00');
  while (d <= end) {
    if (d.getDay() !== 0 && d.getDay() !== 6) out.push({ date: dateKey(d), label });
    d.setDate(d.getDate() + 1);
  }
  return out;
};

const SUTHERLAND_REGULAR: BellPeriod[] = [
  { label: 'Block 1', start: '09:15', end: '10:25', kind: 'class' },
  { label: 'Block 2', start: '10:35', end: '11:45', kind: 'class' },
  { label: 'Block 3', start: '11:55', end: '12:20', kind: 'class' },
  { label: 'Lunch',   start: '12:20', end: '12:50', kind: 'lunch' },
  { label: 'Block 3', start: '12:50', end: '13:35', kind: 'class' },
  { label: 'Block 4', start: '13:45', end: '15:00', kind: 'class' },
];

const SUTHERLAND: SchoolCalendar = {
  closedDays: [
    // 2025–26 (kept so earlier months still show correctly)
    { date: '2025-09-01', label: 'Labour Day' },
    { date: '2025-09-02', label: 'Pro-D Day' },
    { date: '2025-09-19', label: 'Pro-D Day' },
    { date: '2025-09-30', label: 'Truth & Reconciliation' },
    { date: '2025-10-13', label: 'Thanksgiving' },
    { date: '2025-10-24', label: 'Pro-D Day' },
    { date: '2025-11-10', label: 'Pro-D Day' },
    { date: '2025-11-11', label: 'Remembrance Day' },
    { date: '2025-12-05', label: 'Pro-D Day' },
    ...range('2025-12-22', '2026-01-02', 'Winter Break'),
    { date: '2026-02-13', label: 'Pro-D Day' },
    { date: '2026-02-16', label: 'Family Day' },
    ...range('2026-03-16', '2026-03-27', 'Spring Break'),
    { date: '2026-04-03', label: 'Good Friday' },
    { date: '2026-04-06', label: 'Easter Monday' },
    { date: '2026-04-24', label: 'Pro-D Day' },
    { date: '2026-05-15', label: 'Pro-D Day' },
    { date: '2026-05-18', label: 'Victoria Day' },
    ...range('2026-06-29', '2026-09-04', 'Summer Break'),

    // 2026–27
    { date: '2026-09-07', label: 'Labour Day' },
    { date: '2026-09-30', label: 'Truth & Reconciliation' },
    { date: '2026-10-12', label: 'Thanksgiving' },
    { date: '2026-10-23', label: 'Pro-D Day' },
    { date: '2026-11-11', label: 'Remembrance Day' },
    { date: '2026-11-20', label: 'Pro-D Day' },
    { date: '2026-12-04', label: 'Pro-D Day' },
    ...range('2026-12-21', '2027-01-01', 'Winter Break'),
    { date: '2027-01-27', label: 'Semester Turnaround' },
    { date: '2027-02-12', label: 'Pro-D Day' },
    { date: '2027-02-15', label: 'Family Day' },
    ...range('2027-03-15', '2027-03-25', 'Spring Break'),
    { date: '2027-03-26', label: 'Good Friday' },
    { date: '2027-03-29', label: 'Easter Monday' },
    { date: '2027-04-09', label: 'Pro-D Day' },
    { date: '2027-04-26', label: 'Pro-D Day' },
    { date: '2027-05-24', label: 'Victoria Day' },
    ...range('2027-06-30', '2027-09-03', 'Summer Break'),
  ],
  earlyDismissals: [
    { date: '2026-10-15', label: 'Parent-teacher conferences', end: '13:45' },
    { date: '2026-10-16', label: 'Parent-teacher conferences', end: '13:45' },
    { date: '2027-03-11', label: 'Parent-teacher conferences', end: '13:45' },
    { date: '2027-03-12', label: 'Parent-teacher conferences', end: '13:45' },
  ],
  lateStartDays: ['2026-10-28', '2027-02-24', '2027-04-28', '2027-05-26'],
  bells: {
    default: [{ label: 'Tutorial (optional)', start: '08:28', end: '09:10', kind: 'tutorial' }, ...SUTHERLAND_REGULAR],
    monday: SUTHERLAND_REGULAR,
    lateStart: [
      { label: 'Block A', start: '09:55', end: '10:55', kind: 'class' },
      { label: 'Block B', start: '11:04', end: '12:05', kind: 'class' },
      { label: 'Block C', start: '12:15', end: '13:15', kind: 'class' },
      { label: 'Lunch',   start: '13:15', end: '14:00', kind: 'lunch' },
      { label: 'Block D', start: '14:00', end: '15:00', kind: 'class' },
    ],
  },
};

const CALENDARS: Record<string, SchoolCalendar> = {
  'Sutherland Secondary': SUTHERLAND,
};

export function hasSchoolCalendar(schoolName: string | undefined): boolean {
  return !!schoolName && !!CALENDARS[schoolName];
}

// ─── BC statutory holidays (every school) ────────────────────────────────────

function nthWeekday(year: number, month: number, weekday: number, n: number): Date {
  const d = new Date(year, month, 1, 12);
  while (d.getDay() !== weekday) d.setDate(d.getDate() + 1);
  d.setDate(d.getDate() + 7 * (n - 1));
  return d;
}

function easterSunday(y: number): Date {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1, day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(y, month, day, 12);
}

const statCache: Record<number, Map<string, string>> = {};
function statHolidays(year: number): Map<string, string> {
  if (statCache[year]) return statCache[year];
  const map = new Map<string, string>();
  const add = (d: Date, label: string) => map.set(dateKey(d), label);
  add(new Date(year, 0, 1, 12), "New Year's Day");
  add(nthWeekday(year, 1, 1, 3), 'Family Day');
  const easter = easterSunday(year);
  add(new Date(easter.getTime() - 2 * 86400000), 'Good Friday');
  add(new Date(easter.getTime() + 1 * 86400000), 'Easter Monday');
  const may25 = new Date(year, 4, 24, 12);
  while (may25.getDay() !== 1) may25.setDate(may25.getDate() - 1);
  add(may25, 'Victoria Day');
  add(new Date(year, 6, 1, 12), 'Canada Day');
  add(nthWeekday(year, 7, 1, 1), 'BC Day');
  add(nthWeekday(year, 8, 1, 1), 'Labour Day');
  add(new Date(year, 8, 30, 12), 'Truth & Reconciliation');
  add(nthWeekday(year, 9, 1, 2), 'Thanksgiving');
  add(new Date(year, 10, 11, 12), 'Remembrance Day');
  add(new Date(year, 11, 25, 12), 'Christmas Day');
  add(new Date(year, 11, 26, 12), 'Boxing Day');
  statCache[year] = map;
  return map;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/** Why there's no school on this date for this school, or null if it's a school day. */
export function getClosedReason(date: Date, schoolName?: string): string | null {
  const key = dateKey(date);
  const cal = schoolName ? CALENDARS[schoolName] : undefined;
  if (cal) {
    const hit = cal.closedDays.find((d) => d.date === key);
    if (hit) return hit.label;
  }
  return statHolidays(date.getFullYear()).get(key) ?? null;
}

/** Every closed day in a month — used to colour the month view. */
export function closedDaysInMonth(year: number, month: number, schoolName?: string): Map<string, string> {
  const out = new Map<string, string>();
  const d = new Date(year, month, 1, 12);
  while (d.getMonth() === month) {
    const r = getClosedReason(d, schoolName);
    if (r) out.set(dateKey(d), r);
    d.setDate(d.getDate() + 1);
  }
  return out;
}

export interface DaySchedule {
  periods: BellPeriod[];
  /** Start of the first class (not the optional tutorial) */
  dayStart: string;
  dayEnd: string;
  note?: string;
}

/** The bell schedule for one date, or null on weekends/closed days/unknown schools. */
export function getDaySchedule(date: Date, schoolName?: string): DaySchedule | null {
  const cal = schoolName ? CALENDARS[schoolName] : undefined;
  if (!cal) return null;
  if (date.getDay() === 0 || date.getDay() === 6) return null;
  if (getClosedReason(date, schoolName)) return null;
  const key = dateKey(date);

  let periods: BellPeriod[];
  let note: string | undefined;
  if (cal.lateStartDays.includes(key) && cal.bells.lateStart) {
    periods = cal.bells.lateStart;
    note = `Late start ${fmt12(periods[0].start)} — staff collaboration`;
  } else if (date.getDay() === 1 && cal.bells.monday) {
    periods = cal.bells.monday;
  } else {
    periods = cal.bells.default;
  }

  const early = cal.earlyDismissals.find((e) => e.date === key);
  if (early) {
    const cut = parseTime(early.end)!;
    periods = periods
      .filter((p) => parseTime(p.start)! < cut)
      .map((p) => (parseTime(p.end)! > cut ? { ...p, end: early.end } : p));
    note = `Early dismissal ${fmt12(early.end)} — ${early.label}`;
  }

  const classes = periods.filter((p) => p.kind === 'class');
  return {
    periods,
    dayStart: classes[0]?.start ?? periods[0].start,
    dayEnd: classes[classes.length - 1]?.end ?? periods[periods.length - 1].end,
    note,
  };
}

/**
 * The class blocks of a regular day, with blocks split by lunch merged back
 * together — used to pre-fill class times during setup.
 */
export function getClassBlocks(schoolName: string): Array<{ label: string; start: string; end: string }> | null {
  const cal = CALENDARS[schoolName];
  if (!cal) return null;
  const blocks: Array<{ label: string; start: string; end: string }> = [];
  for (const p of cal.bells.default) {
    if (p.kind !== 'class') continue;
    const last = blocks[blocks.length - 1];
    if (last && last.label === p.label) last.end = p.end;
    else blocks.push({ label: p.label, start: p.start, end: p.end });
  }
  return blocks;
}
