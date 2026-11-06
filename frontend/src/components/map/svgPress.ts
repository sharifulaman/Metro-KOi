import { Platform } from 'react-native';

/**
 * Tap handler props for react-native-svg shapes (<G>, <Circle>, …).
 *
 * On web, react-native-svg turns `onPress` into `onClick` but also copies
 * React Native's responder handlers (onResponderGrant, …) onto the DOM
 * element, and React logs "Unknown event handler property" for each one on
 * every render. Passing `onClick` ourselves with `onPress: null` skips that
 * branch and keeps the click (its `onPress !== null` check would otherwise
 * overwrite onClick with undefined). Native keeps the normal `onPress`.
 */
export function svgPress(onPress?: () => void): { onPress?: () => void } {
  if (!onPress) return {};
  if (Platform.OS === 'web') return { onPress: null, onClick: onPress } as unknown as { onPress?: () => void };
  return { onPress };
}
