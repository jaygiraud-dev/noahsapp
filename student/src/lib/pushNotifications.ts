import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  // Web platform does not support Expo push tokens
  if (Platform.OS === 'web') return null;

  // Expo push tokens only work on physical devices
  if (!Device.isDevice) return null;

  // Cast to any to work around PermissionResponse type not being re-exported
  // from the 'expo' package in this SDK version's type definitions
  let permission = await Notifications.getPermissionsAsync() as any;

  if (!permission.granted) {
    permission = await Notifications.requestPermissionsAsync() as any;
  }

  if (!permission.granted) return null;

  const tokenData = await Notifications.getExpoPushTokenAsync();
  return tokenData.data;
}
