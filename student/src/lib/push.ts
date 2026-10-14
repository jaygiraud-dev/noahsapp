import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { updateProfile } from './db';

/**
 * Registers this phone for push notifications and saves the token on the
 * profile, so parents get "homework done" pushes and kids get nudges.
 * Browsers can't receive Expo push notifications, so web is a no-op.
 */
export async function registerPush(userId: string): Promise<void> {
  try {
    if (Platform.OS === 'web' || !Device.isDevice) return;
    let perm = (await Notifications.getPermissionsAsync()) as any;
    if (!perm.granted) perm = (await Notifications.requestPermissionsAsync()) as any;
    if (!perm.granted) return;
    const { data } = await Notifications.getExpoPushTokenAsync();
    if (data) await updateProfile(userId, { pushToken: data });
  } catch {
    // Push is optional; the in-app feed still works without it.
  }
}
