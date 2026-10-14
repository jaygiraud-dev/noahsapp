import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Class, Timetable } from '../types';
import { parseTime } from './time';

// Phone-only: browsers can't schedule notifications for later.
// Every scheduled notification gets an identifier prefix so class bells and
// homework/event reminders can be cancelled independently.

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function cancelByPrefix(prefix: string): Promise<void> {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    all.filter((n) => n.identifier.startsWith(prefix))
       .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
  );
}

export async function scheduleClassNotifications(classes: Class[], timetable?: Timetable | null): Promise<void> {
  if (Platform.OS === 'web') return;
  await cancelByPrefix('class-');

  // Expo weekdays: 1 = Sunday, so Monday = 2 … Friday = 6
  for (let wd = 1; wd <= 5; wd++) {
    const slots: Array<{ cls: Class; start: number | null; end: number | null; i: number }> = timetable && timetable.periods.length
      ? timetable.periods.map((p, i) => ({
          cls: classes.find((c) => c.id === timetable.days[String(wd) as '1'][i])!,
          start: parseTime(p.start), end: parseTime(p.end), i,
        })).filter((x) => x.cls)
      : classes.map((c, i) => ({ cls: c, start: parseTime(c.start), end: parseTime(c.end), i }));
    for (const { cls, start, end, i } of slots) {
      const weekday = wd + 1;
      if (start !== null) {
        const t = (start - 5 + 1440) % 1440;
        await Notifications.scheduleNotificationAsync({
          identifier: `class-${wd}-${i}-start`,
          content: { title: `Get ready for ${cls.name} 📓`, body: 'Starts in 5 min' },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.CALENDAR, weekday, hour: Math.floor(t / 60), minute: t % 60, repeats: true },
        });
      }
      if (end !== null) {
        await Notifications.scheduleNotificationAsync({
          identifier: `class-${wd}-${i}-end`,
          content: { title: '📸 Class done!', body: `Snap your notes before you leave ${cls.name}` },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.CALENDAR, weekday, hour: Math.floor(end / 60), minute: end % 60, repeats: true },
        });
      }
    }
  }
}

// ─── Reminders ───────────────────────────────────────────────────────────────

export const HW_REMINDERS = ['None', 'Tonight 7 PM', 'Tomorrow 7:30 AM', "Morning it's due"] as const;
export const EVENT_REMINDERS = ['None', '15 min before', '1 hour before', 'Morning of', 'Night before'] as const;

function at(base: Date, h: number, m: number, dayOffset = 0): Date {
  const d = new Date(base); d.setDate(d.getDate() + dayOffset); d.setHours(h, m, 0, 0); return d;
}

/** When a reminder option should fire, or null for "None"/unknown. */
export function reminderTime(option: string | null | undefined, opts: { dueDate?: string; eventDate?: string; eventTime?: string }): Date | null {
  if (!option || option === 'None') return null;
  const now = new Date();
  if (opts.dueDate) {
    const due = new Date(opts.dueDate);
    if (option === 'Tonight 7 PM') return at(now, 19, 0);
    if (option === 'Tomorrow 7:30 AM') return at(now, 7, 30, 1);
    if (option === "Morning it's due") return at(due, 7, 30);
  }
  if (opts.eventDate) {
    const day = new Date(opts.eventDate);
    const start = parseTime(opts.eventTime);
    const startAt = start !== null ? at(day, Math.floor(start / 60), start % 60) : at(day, 9, 0);
    if (option === '15 min before') return new Date(startAt.getTime() - 15 * 60000);
    if (option === '1 hour before') return new Date(startAt.getTime() - 60 * 60000);
    if (option === 'Morning of') return at(day, 7, 30);
    if (option === 'Night before') return at(day, 20, 0, -1);
  }
  return null;
}

export async function scheduleReminder(id: string, title: string, body: string, when: Date | null): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelScheduledNotificationAsync(`rem-${id}`).catch(() => {});
  if (!when || when.getTime() <= Date.now()) return;
  await Notifications.scheduleNotificationAsync({
    identifier: `rem-${id}`,
    content: { title, body },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when },
  });
}

/** Repeats every week at the same weekday and time as `firstFire`. */
export async function scheduleWeeklyReminder(id: string, title: string, body: string, firstFire: Date | null): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelScheduledNotificationAsync(`rem-${id}`).catch(() => {});
  if (!firstFire) return;
  await Notifications.scheduleNotificationAsync({
    identifier: `rem-${id}`,
    content: { title, body },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: firstFire.getDay() + 1,
      hour: firstFire.getHours(),
      minute: firstFire.getMinutes(),
    },
  });
}

export async function cancelReminder(id: string): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelScheduledNotificationAsync(`rem-${id}`).catch(() => {});
}
