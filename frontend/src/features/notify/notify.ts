import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Show notifications as a banner even while the app is open (that is when the rider is near a station).
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

if (Platform.OS === 'android') {
  void Notifications.setNotificationChannelAsync('default', { name: 'Metro Koi', importance: Notifications.AndroidImportance.HIGH }).catch(() => undefined);
}

/** Asks for notification permission (only if it has not been given yet). Returns whether notifications are allowed. */
export async function enableNotifications(): Promise<boolean> {
  try {
    const cur = await Notifications.getPermissionsAsync();
    if (cur.granted) return true;
    return (await Notifications.requestPermissionsAsync()).granted;
  } catch {
    return false;
  }
}

/** Shows a notification right now. */
export async function showNotification(title: string, body: string): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({ content: { title, body }, trigger: null });
  } catch {
    // notifications are not available here: nothing to show
  }
}
