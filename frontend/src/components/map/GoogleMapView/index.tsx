import { useEffect, useMemo, useRef, useState, type ComponentType, type Ref } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { WebView as RNWebView } from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';
import type { WebViewSharedProps } from 'react-native-webview/lib/WebViewTypes';

import { config } from '@/lib/config';
import { useSettings } from '@/store/settings';
import { layout } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

import { Text } from '../../ui/Text';

import { mapPage } from './page';
import { buildPayload } from './payload';
import type { GoogleMapViewProps } from './types';

// The package types WebView as IOS & Android & Windows props, which collapses
// to `never` under this TypeScript; use the shared props plus what we set.
type WebViewHandle = { injectJavaScript(js: string): void };
const WebView = RNWebView as unknown as ComponentType<
  WebViewSharedProps & {
    ref?: Ref<WebViewHandle>;
    domStorageEnabled?: boolean;
    setSupportMultipleWindows?: boolean;
  }
>;

/**
 * The live map: Google Maps (Maps JavaScript API) in a WebView, with the line,
 * station pins and trains drawn on top. Works in Expo Go; needs internet and
 * EXPO_PUBLIC_GOOGLE_MAPS_API_KEY. The web build uses an iframe instead (index.web.tsx).
 *
 * `zoom` and `focus` choose what is framed (the whole line, or a street-level
 * stretch around a station or a train to follow); the user can also pan and
 * pinch the map freely. Taps on pins come back from the page as messages.
 */
export function GoogleMapView(props: GoogleMapViewProps) {
  const { children, height, testID, errorText, onStationPress, onTrainPress, onGatePress } = props;
  const { c, dark } = useTheme();
  const lang = useSettings((s) => s.lang);
  const win = useWindowDimensions();
  const ref = useRef<WebViewHandle>(null);
  const [loaded, setLoaded] = useState(false);
  const reserved = (props.bottomInset ?? 0) + (props.reserveSheet ? win.height * layout.dockedSheet : 0);

  const html = useMemo(() => mapPage(config.googleMapsKey, lang, config.googleMapId, dark), [lang, dark]);
  const script = `window.__set(${JSON.stringify(buildPayload(props, c, dark, reserved))});true;`;
  useEffect(() => {
    if (loaded) ref.current?.injectJavaScript(script);
  });

  const onMessage = (e: WebViewMessageEvent) => {
    try {
      const m = JSON.parse(e.nativeEvent.data) as { type: string; id?: string };
      if (m.type === 'station' && m.id) onStationPress?.(m.id);
      else if (m.type === 'train' && m.id) onTrainPress?.(m.id);
      else if (m.type === 'gate' && m.id) onGatePress?.(m.id);
    } catch {
      // not ours
    }
  };

  return (
    <View testID={testID} style={[{ overflow: 'hidden', backgroundColor: c.mapGround }, height != null ? { height } : { flex: 1 }]}>
      {config.googleMapsKey ? (
        <WebView
          ref={ref}
          source={{ html }}
          originWhitelist={['*']}
          injectedJavaScript={script}
          onMessage={onMessage}
          onLoadEnd={() => setLoaded(true)}
          javaScriptEnabled
          domStorageEnabled
          setSupportMultipleWindows={false}
          style={{ flex: 1, backgroundColor: c.mapGround }}
        />
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text tone="muted" align="center">
            {errorText}
          </Text>
        </View>
      )}
      {children}
    </View>
  );
}

export { ZOOM_NEAR } from './payload';
export type { GoogleMapViewProps, MapGate, MapStation, MapTrain, MapUser } from './types';
