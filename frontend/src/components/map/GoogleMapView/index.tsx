import { useEffect, useMemo, useRef, useState, type ComponentType, type Ref } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { WebView as RNWebView } from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';
import type { WebViewSharedProps } from 'react-native-webview/lib/WebViewTypes';

import { config } from '@/lib/config';
import { getTile, putTile } from '@/lib/tileCache';
import { useSettings } from '@/store/settings';
import { layout } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

import { Text } from '../../ui/Text';

import { cityPage } from './cityPage';
import { mapPage } from './page';
import { scenePage } from './scenePage';
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

  const base = { ...buildPayload(props, c, dark, reserved), lang };
  // 3D: our own scene (no Google Maps, no key needed); otherwise the Google map
  const city = base.view.tilt;
  // the three.js scene needs its library from the CDN; offline it reports an error and the canvas page takes over
  const [engineFailed, setEngineFailed] = useState(false);
  // 2D with no internet / no key / a rejected key: Google cannot draw, so the offline scene (flat, top-down) takes over; 3D tries Google again next time
  const [googleFailed, setGoogleFailed] = useState(false);
  useEffect(() => {
    if (city) setGoogleFailed(false);
  }, [city]);
  const offline2d = !city && (googleFailed || !config.googleMapsKey);
  const mode = city ? (engineFailed ? 'city' : 'scene') : offline2d ? (engineFailed ? 'city' : 'flat') : 'google';
  const payload = mode === 'flat' ? { ...base, view: { ...base.view, flat: true } } : base;
  const html = useMemo(
    () => (mode === 'scene' || mode === 'flat' ? scenePage(dark) : mode === 'city' ? cityPage(dark) : mapPage(config.googleMapsKey, lang, config.googleMapId, dark)),
    [mode, lang, dark],
  );
  const script = `window.__set(${JSON.stringify(payload)});true;`;
  useEffect(() => {
    if (loaded) ref.current?.injectJavaScript(script);
  });

  const onMessage = (e: WebViewMessageEvent) => {
    try {
      const m = JSON.parse(e.nativeEvent.data) as { type: string; id?: string; kind?: string; state?: string; n?: number; key?: string; data?: string };
      if (m.type === 'error' && m.kind === 'engine') setEngineFailed(true);
      else if (m.type === 'error' && (m.kind === 'load' || m.kind === 'auth')) setGoogleFailed(true);
      else if (m.type === 'tileGet' && m.key != null && m.n != null) ref.current?.injectJavaScript(`window.__tile(${m.n},${JSON.stringify(getTile(m.key))});true;`);
      else if (m.type === 'tilePut' && m.key && m.data) putTile(m.key, m.data);
      else if (m.type === 'station' && m.id) onStationPress?.(m.id);
      else if (m.type === 'train' && m.id) onTrainPress?.(m.id);
      else if (m.type === 'gate' && m.id) onGatePress?.(m.id);
      else if (m.type === 'osm' && m.state) props.onMapStatus?.(m.state as 'loading' | 'ok' | 'fail');
    } catch {
      // not ours
    }
  };

  return (
    <View testID={testID} style={[{ overflow: 'hidden', backgroundColor: c.mapGround }, height != null ? { height } : { flex: 1 }]}>
      {config.googleMapsKey || city || offline2d ? (
        <WebView
          key={mode}
          ref={ref}
          source={{ html }}
          onLoadStart={() => setLoaded(false)}
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
export type { GoogleMapViewProps, MapGate, MapHints, MapStation, MapTrain, MapUser } from './types';
