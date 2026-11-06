import * as Crypto from 'expo-crypto';
import * as Location from 'expo-location';
import { useCallback, useEffect, useRef } from 'react';

import { canShare, scoreSignals } from '@/lib/riderScore';
import type { RiderSignals } from '@/models';
import { useLive } from '@/store/live';
import { useRider } from '@/store/rider';

import { liveClient } from '../live/useLiveConnection';

const FIX_INTERVAL_MS = 3000;
const MAX_SESSION_MS = 90 * 60 * 1000;

/**
 * Rider mode (spec §6.2, §10.5): confirm → explain → foreground permission →
 * stream fixes while the score allows. Snapping-based signals need the OSM
 * line geometry; until it ships only the speed signal can be evaluated on the
 * phone, and the server still validates every fix (spec §6.1).
 */
export function useRiderSession() {
  const phase = useRider((s) => s.phase);
  const session = useRider((s) => s.session);
  const helping = useLive((s) => s.helping);
  const sub = useRef<Location.LocationSubscription | null>(null);
  const signals = useRef<RiderSignals>({ confirmed: false, nearLineFor20s: false, trainSpeedSeen: false, stationDwellPattern: false, smoothMotion: false, startedInStation: false });

  const stopWatching = useCallback(() => {
    sub.current?.remove();
    sub.current = null;
  }, []);

  const start = useCallback(async () => {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (perm.status !== 'granted') {
      useRider.getState().setPermissionDenied(true);
      useRider.getState().setPhase('idle');
      return;
    }
    const sessionId = Crypto.randomUUID();
    signals.current = { ...signals.current, confirmed: true };
    useRider.getState().begin({ sessionId, startedAt: Date.now(), fromStationId: null, toStationId: null, direction: null, score: scoreSignals(signals.current), fixesSent: 0, helping: 0 });
    let announced = false;
    sub.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: FIX_INTERVAL_MS, distanceInterval: 0 },
      (loc) => {
        const st = useRider.getState();
        if (!st.session) return;
        if (Date.now() - st.session.startedAt > MAX_SESSION_MS) {
          stop('timeout');
          return;
        }
        const spd = loc.coords.speed ?? 0;
        if (spd * 3.6 >= 40 && spd * 3.6 <= 85) signals.current.trainSpeedSeen = true;
        const score = scoreSignals(signals.current);
        st.update({ score });
        if (!canShare(signals.current)) return;
        const client = liveClient();
        if (!announced) {
          client?.send({ t: 'rider.start', sessionId, score });
          announced = true;
        }
        client?.send({
          t: 'rider.fix',
          sessionId,
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
          acc: loc.coords.accuracy ?? 99,
          spd,
          hdg: loc.coords.heading ?? 0,
          ts: loc.timestamp,
        });
        st.update({ fixesSent: st.session.fixesSent + 1 });
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stop = useCallback(
    (reason: 'user' | 'timeout' | 'left_corridor' | 'terminal' = 'user') => {
      stopWatching();
      const s = useRider.getState().session;
      if (s) liveClient()?.send({ t: 'rider.stop', sessionId: s.sessionId });
      useRider.getState().update({ helping });
      useRider.getState().end(reason);
    },
    [helping, stopWatching],
  );

  useEffect(() => () => stopWatching(), [stopWatching]);

  return { phase, session, helping, start, stop, sharing: !!session && session.score >= 3 };
}
