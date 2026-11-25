import * as Crypto from 'expo-crypto';
import * as Location from 'expo-location';
import { useCallback } from 'react';

import { snapToLine } from '@/lib/lineGeo';
import { canShare, detectSignals, scoreSignals, type SnappedSample } from '@/lib/riderScore';
import stationsFile from '@/data/stations.json';
import line from '@/data/line6.json';
import type { Direction, RiderSignals, StopReason } from '@/models';
import { useLive } from '@/store/live';
import { useRider } from '@/store/rider';

import { liveClient } from '../live/useLiveConnection';

const FIX_INTERVAL_MS = 3000;
const MAX_SESSION_MS = 90 * 60 * 1000;
/** you can go live only when you are this close to the track (platform / on board) */
const START_MAX_M = 300;
/** within this of the track counts as "on the line" for the score */
const ON_LINE_M = 60;
/** further than this from the track for LEAVE_AFTER_MS ends the ride automatically */
const LEAVE_M = 200;
const LEAVE_AFTER_MS = 30_000;
/** how long to wait for the server to accept the ride */
const ACK_TIMEOUT_MS = 20_000;

// App-wide, not per screen: a ride started on Journey must keep streaming while the rider moves between screens.
const sub: { current: Location.LocationSubscription | null } = { current: null };
/** line length (m) and open stations' chainage, to turn a snapped fraction into metres along the track */
const LINE_M = line.properties.lengthM;
const STATION_M = (stationsFile.stations as { status: string; chainageM: number | null }[]).filter((s) => s.status === 'open' && s.chainageM != null).map((s) => s.chainageM as number);
/** a station platform: within this of a station's chainage and of the track */
const IN_STATION_M = 150;
/** samples kept for the dwell / smoothness signals (~4 min at one fix per 3 s) */
const MAX_SAMPLES = 80;

/** Variance of the GPS speed's rate of change (m/s² squared): low on a train, high in stop-and-go traffic. */
function accelVariance(samples: SnappedSample[]): number | null {
  const a: number[] = [];
  for (let i = 1; i < samples.length; i++) {
    const dt = (samples[i].ts - samples[i - 1].ts) / 1000;
    if (dt > 0.5 && dt < 10) a.push((samples[i].speedMps - samples[i - 1].speedMps) / dt);
  }
  if (a.length < 8) return null;
  const mean = a.reduce((x, y) => x + y, 0) / a.length;
  return a.reduce((x, y) => x + (y - mean) ** 2, 0) / a.length;
}

const signals: { current: RiderSignals } = { current: { confirmed: false, nearLineFor20s: false, trainSpeedSeen: false, stationDwellPattern: false, smoothMotion: false, startedInStation: false } };

export interface RideOptions {
  fromStationId?: string | null;
  toStationId?: string | null;
  direction?: Direction | null;
}

/**
 * Rider mode (spec §6.2, §10.5): confirm → explain → foreground permission →
 * stream fixes while the score allows. Going live needs a position near the
 * track; the ride ends by itself when the rider leaves the corridor, so a
 * person who got off the train never shows up as a train. The server still
 * validates every fix (spec §6.1).
 */
export function useRiderSession() {
  const phase = useRider((s) => s.phase);
  const session = useRider((s) => s.session);
  const helping = useLive((s) => s.helping);

  const stopWatching = useCallback(() => {
    sub.current?.remove();
    sub.current = null;
  }, []);

  const stop = useCallback(
    (reason: StopReason = 'user') => {
      stopWatching();
      const s = useRider.getState().session;
      if (s) liveClient()?.send({ t: 'rider.stop', sessionId: s.sessionId });
      useRider.getState().update({ helping: useLive.getState().helping });
      useRider.getState().end(reason);
    },
    [stopWatching],
  );

  const start = useCallback(
    async (opts: RideOptions = {}) => {
      const rider = useRider.getState();
      rider.setTooFar(false);
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') {
        rider.setPermissionDenied(true);
        rider.setPhase('idle');
        return false;
      }
      // not at / near a metro line → cannot go live
      const first = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const startSnap = snapToLine(first.coords.latitude, first.coords.longitude);
      if (startSnap.metres > START_MAX_M) {
        rider.setTooFar(true);
        rider.setPhase('idle');
        return false;
      }

      const sessionId = Crypto.randomUUID();
      signals.current = { confirmed: true, nearLineFor20s: false, trainSpeedSeen: false, stationDwellPattern: false, smoothMotion: false, startedInStation: startSnap.metres <= 60 && STATION_M.some((c) => Math.abs(c - startSnap.f * LINE_M) <= IN_STATION_M) };
      const samples: SnappedSample[] = [];
      rider.begin({
        sessionId,
        startedAt: Date.now(),
        fromStationId: opts.fromStationId ?? null,
        toStationId: opts.toStationId ?? null,
        direction: opts.direction ?? null,
        score: scoreSignals(signals.current),
        fixesSent: 0,
        helping: 0,
      });

      let announcedEpoch = -1;
      let nearSince: number | null = null;
      let outsideSince: number | null = null;
      sub.current = await Location.watchPositionAsync({ accuracy: Location.Accuracy.High, timeInterval: FIX_INTERVAL_MS, distanceInterval: 0 }, (loc) => {
        const st = useRider.getState();
        if (!st.session) return;
        const now = Date.now();
        if (now - st.session.startedAt > MAX_SESSION_MS) return stop('timeout');

        const snap = snapToLine(loc.coords.latitude, loc.coords.longitude);
        const accurate = (loc.coords.accuracy ?? 99) <= 100;

        // out of range: away from the track for 30 s → no longer live
        if (accurate && snap.metres > LEAVE_M) {
          outsideSince ??= now;
          if (now - outsideSince >= LEAVE_AFTER_MS) return stop('left_corridor');
          return; // do not publish a position that is off the line
        }
        outsideSince = null;

        // reached the end of the line in the direction of travel
        const dir = st.session.direction;
        if (dir && ((dir === 'SB' && snap.f >= 0.995) || (dir === 'NB' && snap.f <= 0.005))) return stop('terminal');

        if (snap.metres <= ON_LINE_M) {
          nearSince ??= now;
          if (now - nearSince >= 20_000) signals.current.nearLineFor20s = true;
        } else nearSince = null;
        const spd = loc.coords.speed ?? 0;
        if (spd * 3.6 >= 40 && spd * 3.6 <= 85) signals.current.trainSpeedSeen = true;
        // dwell only at stations + smooth motion (spec §6.2): read from the recent snapped fixes
        if (accurate) {
          samples.push({ ts: loc.timestamp, chainageM: snap.f * LINE_M, offsetM: snap.metres, speedMps: Math.max(0, spd) });
          if (samples.length > MAX_SAMPLES) samples.shift();
          const seen = detectSignals(samples, STATION_M, signals.current.startedInStation, accelVariance(samples));
          // once seen, a signal stays for the ride
          signals.current.stationDwellPattern ||= seen.stationDwellPattern;
          signals.current.smoothMotion ||= seen.smoothMotion;
        }
        const score = scoreSignals(signals.current);
        st.update({ score, lastF: snap.f, lastSpd: spd });
        if (!canShare(signals.current)) return;

        // Offline (not connected) the ride still runs on the phone: the trip view uses the timetable and GPS.
        // Sharing starts - and restarts after every reconnect, once the connection is live.
        const lv = useLive.getState();
        if (lv.connection !== 'live') return;
        const client = liveClient();
        if (announcedEpoch !== lv.epoch) {
          announcedEpoch = lv.epoch;
          st.update({ acked: false });
          client?.send({ t: 'rider.start', sessionId, score });
          // connected but never accepted (3 rides a day, low score): not live
          setTimeout(() => {
            const cur = useRider.getState().session;
            if (cur && cur.sessionId === sessionId && !cur.acked && !cur.stopReason && useLive.getState().epoch === announcedEpoch && useLive.getState().connection === 'live') stop('refused');
          }, ACK_TIMEOUT_MS);
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
      });
      return true;
    },
    [stop],
  );

  return { phase, session, helping, start, stop, sharing: !!session && session.score >= 3 && !!session.acked };
}
