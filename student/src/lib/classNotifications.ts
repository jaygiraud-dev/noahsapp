import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Class } from '../types';

// Set the notification handler so alerts show while the app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function scheduleClassNotifications(classes: Class[]): Promise<void> {
  // expo-notifications scheduling is not supported on web
  if (Platform.OS === 'web') return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  // Weekdays: Mon–Fri in Expo's 1=Sun notation → 2, 3, 4, 5, 6
  const weekdays = [2, 3, 4, 5, 6];

  for (const cls of classes) {
    if (!cls.start && !cls.end) continue;

    // 5 minutes before class starts
    if (cls.start) {
      const [startHourStr, startMinStr] = cls.start.split(':');
      let startHour = parseInt(startHourStr, 10);
      let startMin = parseInt(startMinStr, 10);

      // Subtract 5 minutes, handle hour rollback
      let reminderMin = startMin - 5;
      let reminderHour = startHour;
      if (reminderMin < 0) {
        reminderMin += 60;
        reminderHour -= 1;
        if (reminderHour < 0) reminderHour = 23;
      }

      for (const weekday of weekdays) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `Get ready for ${cls.name} 📓`,
            body: `Starts in 5 min`,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
            weekday,
            hour: reminderHour,
            minute: reminderMin,
            repeats: true,
          },
        });
      }
    }

    // At class end
    if (cls.end) {
      const [endHourStr, endMinStr] = cls.end.split(':');
      const endHour = parseInt(endHourStr, 10);
      const endMin = parseInt(endMinStr, 10);

      for (const weekday of weekdays) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `📸 Class done!`,
            body: `Snap your notes before you leave ${cls.name}`,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
            weekday,
            hour: endHour,
            minute: endMin,
            repeats: true,
          },
        });
      }
    }
  }
}

export async function cancelClassNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}
