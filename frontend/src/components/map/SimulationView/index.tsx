import { useEffect, useRef, useState, type ComponentType, type Ref } from 'react';
import { View } from 'react-native';
import { WebView as RNWebView } from 'react-native-webview';
import type { WebViewSharedProps } from 'react-native-webview/lib/WebViewTypes';

import html from '@/data/simHtml';
import { useTheme } from '@/theme/useTheme';

import { Text } from '../../ui/Text';

import { tripScript, type SimulationViewProps } from './tripScript';

// The package types WebView as IOS & Android & Windows props, which collapses
// to `never` under this TypeScript; use the shared props plus the two
// platform props we set.
type WebViewHandle = { injectJavaScript(js: string): void };
const WebView = RNWebView as unknown as ComponentType<
  WebViewSharedProps & {
    ref?: Ref<WebViewHandle>;
    /** Android: localStorage for the page (panel state) */
    domStorageEnabled?: boolean;
    setSupportMultipleWindows?: boolean;
    allowsBackForwardNavigationGestures?: boolean;
  }
>;

/**
 * The 3D "station to station" simulation (three.js page in assets/sim),
 * shown in a WebView. Works in Expo Go. three.js loads from its CDN, so the
 * first open needs internet; city blocks come from OpenStreetMap when online,
 * otherwise demo buildings.
 */
export function SimulationView({ fromIdx, toIdx, errorText, testID }: SimulationViewProps) {
  const { c, space } = useTheme();
  const ref = useRef<WebViewHandle>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  // a new From/To after the page is up: pick it in the page
  useEffect(() => {
    if (loaded) ref.current?.injectJavaScript(tripScript(fromIdx, toIdx));
  }, [fromIdx, toIdx, loaded]);

  if (failed) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: space[5], backgroundColor: c.bg }}>
        <Text tone="muted" align="center">
          {errorText}
        </Text>
      </View>
    );
  }
  return (
    <WebView
      ref={ref}
      testID={testID}
      source={{ html }}
      originWhitelist={['*']}
      injectedJavaScript={tripScript(fromIdx, toIdx)}
      onLoadEnd={() => setLoaded(true)}
      onError={() => setFailed(true)}
      javaScriptEnabled
      domStorageEnabled
      setSupportMultipleWindows={false}
      allowsBackForwardNavigationGestures={false}
      style={{ flex: 1, backgroundColor: c.bg }}
    />
  );
}

export type { SimulationViewProps } from './tripScript';
