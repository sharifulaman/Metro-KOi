import { Alert, Linking, Platform } from 'react-native';

export interface AlertAction {
  label: string;
  onPress?: () => void;
}

/**
 * A popup with a title, a message and buttons. React Native's Alert.alert does nothing on the web build and shows a
 * bare title when it is given no message or buttons, so every popup goes through here: native gets a real dialog
 * (the last button is the primary one), the browser gets its own alert.
 */
export function showAlert(title: string, message: string, okLabel: string, extra?: AlertAction) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message, [
    ...(extra ? [{ text: extra.label, onPress: extra.onPress }] : []),
    { text: okLabel, style: 'cancel' as const },
  ]);
}

/** Opens this app's page in the phone's settings (to switch location back on). */
export function openAppSettings() {
  void Linking.openSettings();
}
