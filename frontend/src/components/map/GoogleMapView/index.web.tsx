import { useEffect, useMemo, useRef } from 'react';
import { View, useWindowDimensions } from 'react-native';

import { config } from '@/lib/config';
import { useSettings } from '@/store/settings';
import { layout } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

import { Text } from '../../ui/Text';

import { mapPage } from './page';
import { buildPayload } from './payload';
import type { GoogleMapViewProps } from './types';

/** Web build: the same Google Maps page in an iframe (srcdoc), driven with postMessage. */
export function GoogleMapView(props: GoogleMapViewProps) {
  const { children, height, testID, errorText, onStationPress, onTrainPress } = props;
  const { c, dark } = useTheme();
  const lang = useSettings((s) => s.lang);
  const win = useWindowDimensions();
  const frame = useRef<HTMLIFrameElement | null>(null);
  const reserved = (props.bottomInset ?? 0) + (props.reserveSheet ? win.height * layout.dockedSheet : 0);

  const html = useMemo(() => mapPage(config.googleMapsKey, lang, config.googleMapId, dark), [lang, dark]);
  const message = JSON.stringify(buildPayload(props, c, dark, reserved));
  const post = () => frame.current?.contentWindow?.postMessage(message, '*');
  useEffect(post);

  const handlers = useRef({ onStationPress, onTrainPress });
  handlers.current = { onStationPress, onTrainPress };
  useEffect(() => {
    const listen = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow || typeof e.data !== 'string') return;
      try {
        const m = JSON.parse(e.data) as { type: string; id?: string };
        if (m.type === 'station' && m.id) handlers.current.onStationPress?.(m.id);
        else if (m.type === 'train' && m.id) handlers.current.onTrainPress?.(m.id);
      } catch {
        // not ours
      }
    };
    window.addEventListener('message', listen);
    return () => window.removeEventListener('message', listen);
  }, []);

  return (
    <View testID={testID} style={[{ overflow: 'hidden', backgroundColor: c.mapGround }, height != null ? { height } : { flex: 1 }]}>
      {config.googleMapsKey ? (
        <iframe ref={frame} title="Metro Koi map" srcDoc={html} onLoad={post} style={{ border: 0, width: '100%', height: '100%', display: 'block' }} />
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
export type { GoogleMapViewProps, MapStation, MapTrain, MapUser } from './types';
