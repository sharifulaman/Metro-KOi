import { useEffect, useRef } from 'react';

import { config } from '@/lib/config';
import { SupabaseLiveClient } from '@/lib/supabaseLive';
import type { LiveTransport } from '@/lib/supabaseLive';
import type { ConnectionState, ServerMessage } from '@/models';
import { useLive } from '@/store/live';
import { useSettings } from '@/store/settings';

let shared: LiveTransport | null = null;

/** The app-wide realtime connection; mounted once in the root layout. */
export function useLiveConnection(): void {
  const deviceId = useSettings((s) => s.deviceId);
  const lang = useSettings((s) => s.lang);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const common = {
      deviceId,
      lang,
      onMessage: (m: ServerMessage) => useLive.getState().handle(m),
      onState: (s: ConnectionState) => useLive.getState().setConnection(s),
    };
    // No Supabase keys -> stay offline: the app shows the timetable only.
    if (!config.supabaseUrl || !config.supabaseAnonKey) return;
    shared = new SupabaseLiveClient({ ...common, supabaseUrl: config.supabaseUrl, anonKey: config.supabaseAnonKey });
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

export function liveClient(): LiveTransport | null {
  return shared;
}
