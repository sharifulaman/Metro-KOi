import { useEffect, useRef } from 'react';

import { config } from '@/lib/config';
import { LiveClient } from '@/lib/ws';
import { useLive } from '@/store/live';
import { useSettings } from '@/store/settings';

let shared: LiveClient | null = null;

/** The app-wide realtime connection; mounted once in the root layout. */
export function useLiveConnection(): void {
  const deviceId = useSettings((s) => s.deviceId);
  const lang = useSettings((s) => s.lang);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    shared = new LiveClient({
      url: config.wsUrl,
      deviceId,
      lang,
      onMessage: (m) => useLive.getState().handle(m),
      onState: (s) => useLive.getState().setConnection(s),
    });
    shared.start();
    return () => {
      shared?.stop();
      shared = null;
      started.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId]);
  useEffect(() => shared?.setLang(lang), [lang]);
}

export function liveClient(): LiveClient | null {
  return shared;
}
