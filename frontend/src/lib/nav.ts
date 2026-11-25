import { router } from 'expo-router';

/**
 * Back, or home when there is nothing to go back to (a screen opened directly: a web reload,
 * a deep link, a notification). Plain `router.back()` there warns "GO_BACK was not handled".
 */
export function goBack(fallback: '/' | (string & {}) = '/') {
  if (router.canGoBack()) router.back();
  else router.replace(fallback as never);
}
