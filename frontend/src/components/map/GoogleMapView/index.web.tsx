import { useEffect, useMemo, useRef, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';

import { config } from '@/lib/config';
import { getTile, putTile } from '@/lib/tileCache';
import { useSettings } from '@/store/settings';
import { layout } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

import { Text } from '../../ui/Text';

import { cityPage } from './cityPage';
import { mapPage } from './page';
import { scenePage } from './scenePage';
import { CompassButton } from './CompassButton';
import { buildPayload } from './payload';
import type { GoogleMapViewProps } from './types';

/** Web build: the same Google Maps page in an iframe (srcdoc), driven with postMessage. */
export function GoogleMapView(props: GoogleMapViewProps) {
  const { children, height, testID, errorText, onStationPress, onTrainPress, onGatePress } = props;
  const { c, dark } = useTheme();
  const lang = useSettings((s) => s.lang);
  const win = useWindowDimensions();
  const frame = useRef<HTMLIFrameElement | null>(null);
  const reserved = (props.bottomInset ?? 0) + (props.reserveSheet ? win.height * layout.dockedSheet : 0);

  const base = { ...buildPayload(props, c, dark, reserved), lang };
  // 3D: our own scene (no Google Maps, no key needed); otherwise the Google map
  const city = base.view.tilt;
  // the three.js scene needs its library from the CDN; offline it reports an error and the canvas page takes over
  const [engineFailed, setEngineFailed] = useState(false);
  // 2D with no internet / no key / a rejected key: the offline scene (flat, top-down) takes over; 3D tries Google again next time
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
  const message = JSON.stringify(payload);
  const post = () => frame.current?.contentWindow?.postMessage(message, '*');
  useEffect(post);

  const handlers = useRef({ onStationPress, onTrainPress, onGatePress, onMapStatus: props.onMapStatus });
  handlers.current = { onStationPress, onTrainPress, onGatePress, onMapStatus: props.onMapStatus };
  useEffect(() => {
    const listen = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow || typeof e.data !== 'string') return;
      try {
        const m = JSON.parse(e.data) as { type: string; id?: string; kind?: string; state?: string; n?: number; key?: string; data?: string };
        if (m.type === 'error' && m.kind === 'engine') setEngineFailed(true);
        else if (m.type === 'error' && (m.kind === 'load' || m.kind === 'auth')) setGoogleFailed(true);
        else if (m.type === 'tileGet' && m.key != null && m.n != null) frame.current?.contentWindow?.postMessage(JSON.stringify({ __tile: [m.n, getTile(m.key)] }), '*');
        else if (m.type === 'tilePut' && m.key && m.data) putTile(m.key, m.data);
        else if (m.type === 'station' && m.id) handlers.current.onStationPress?.(m.id);
        else if (m.type === 'train' && m.id) handlers.current.onTrainPress?.(m.id);
        else if (m.type === 'gate' && m.id) handlers.current.onGatePress?.(m.id);
        else if (m.type === 'osm' && m.state) handlers.current.onMapStatus?.(m.state as 'loading' | 'ok' | 'fail');
      } catch {
        // not ours
      }
    };
    window.addEventListener('message', listen);
    return () => window.removeEventListener('message', listen);
  }, []);

  return (
    <View testID={testID} style={[{ overflow: 'hidden', backgroundColor: c.mapGround }, height != null ? { height } : { flex: 1 }]}>
      {config.googleMapsKey || city || offline2d ? (
        <iframe key={mode} ref={frame} title="Metro Koi map" srcDoc={html} onLoad={post} style={{ border: 0, width: '100%', height: '100%', display: 'block' }} />
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text tone="muted" align="center">
            {errorText}
          </Text>
        </View>
      )}
      {children}
      {props.compass ? <CompassButton headingUp={props.compass.headingUp} heading={props.user?.heading ?? null} onPress={props.compass.onPress} label={props.compass.label} top={(props.topInset ?? 0) + 12} /> : null}
    </View>
  );
}

export { ZOOM_NEAR } from './payload';
export type { GoogleMapViewProps, MapGate, MapHints, MapStation, MapTrain, MapUser } from './types';
