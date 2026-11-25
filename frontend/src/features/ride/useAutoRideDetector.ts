import * as Location from 'expo-location';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import line from '@/data/line6.json';
import { useT } from '@/i18n';
import { snapToLine } from '@/lib/lineGeo';
import { initialRide, nextStationIdx, stepRide, type RideContext, type RideState } from '@/lib/rideDetector';
import { etaToStation } from '@/lib/schedule';
import { useAutoRide } from '@/store/autoRide';
import { useRider } from '@/store/rider';
import { useSettings } from '@/store/settings';

import { showNotification } from '../notify/notify';
import { useRiderSession } from '../rider/useRiderSession';

import { matchScheduled } from './matchScheduled';
import { stationName, useStations } from '../stations/useStations';
import { useRunModel, useTimetable } from '../timetable/useTimetable';

const LINE_M = line.properties.lengthM;
/** ask about the exit when the next station (the rider's destination) is this close */
const EXIT_ALERT_SEC = 120;
/**
 * Automatic ride detection (docs/train-tracking-plan.md §5): while the app is open and location is already
 * allowed, it watches for "in a station, then moving like the metro" and names the train. Nothing is shared
 * unless the rider turned on ride sharing; then an ON_TRAIN ride starts sharing by itself.
 * Mounted once, app-wide.
 */
export function useAutoRideDetector(): void {
  const tt = useTimetable();
  const model = useRunModel();
  const { byId, list } = useStations();
  const { t, lang } = useT();
  const onboarded = useSettings((s) => s.onboarded);
  const rider = useRiderSession();
  const ctxRef = useRef({ tt, model, list, byId, t, lang, rider });
  ctxRef.current = { tt, model, list, byId, t, lang, rider };

  useEffect(() => {
    if (!onboarded) return;
    let sub: Location.LocationSubscription | null = null;
    let state: RideState = initialRide(Date.now());
    let alertedFor: string | null = null;
    let shareStartedFor: number | null = null;
    let alive = true;

    const detectorCtx = (): RideContext => {
      const { tt: tt2, model: m } = ctxRef.current;
      return { stationM: m.chainage, match: (dir, s, ts) => matchScheduled(tt2, m, dir, s, ts) };
    };

    const onFix = (loc: Location.LocationObject) => {
      const c = ctxRef.current;
      const snap = snapToLine(loc.coords.latitude, loc.coords.longitude);
      const s = c.model.chainage[0] + snap.f * LINE_M;
      state = stepRide(state, { ts: loc.timestamp, s, offsetM: snap.metres, speed: Math.max(0, loc.coords.speed ?? 0) }, detectorCtx());

      const ids = c.model.stationIds;
      const nextIdx = state.dir ? nextStationIdx(detectorCtx(), state.dir, s) : null;
      const nextStationId = nextIdx != null ? ids[nextIdx] : null;
      const nextEtaSec = state.dir && nextStationId ? etaToStation(c.model, { s, dir: state.dir }, nextStationId) : null;
      const finished = state.finished;
      useAutoRide.getState().set({
        phase: state.phase,
        dir: state.dir,
        trainId: state.trainId,
        fromStationId: state.fromIdx != null ? ids[state.fromIdx] : null,
        nextStationId: state.phase === 'ON_TRAIN' ? nextStationId : null,
        nextEtaSec: state.phase === 'ON_TRAIN' ? nextEtaSec : null,
        lastTrip: finished
          ? { fromStationId: finished.fromIdx != null ? ids[finished.fromIdx] : null, toStationId: finished.toIdx != null ? ids[finished.toIdx] : null, trainId: finished.trainId, startedAt: finished.startedAt, endedAt: finished.endedAt }
          : useAutoRide.getState().lastTrip,
      });

      if (state.phase !== 'ON_TRAIN' || !state.dir) return;
      const settings = useSettings.getState();
      // exit alarm: the next station is where the rider said they are going
      if (settings.notifications && nextStationId && nextStationId === settings.tripTo && nextEtaSec != null && nextEtaSec <= EXIT_ALERT_SEC && alertedFor !== nextStationId) {
        alertedFor = nextStationId;
        const st = c.byId[nextStationId];
        void showNotification(c.t('autoRide.exitTitle'), c.t('autoRide.exitBody', { name: st ? stationName(st, c.lang) : nextStationId }));
      }
      // ride sharing turned on once: an ON_TRAIN ride shares by itself (only one per ride, never over a manual one)
      if (settings.shareRides && !useRider.getState().session && shareStartedFor !== state.startedAt) {
        shareStartedFor = state.startedAt;
        void c.rider.start({ direction: state.dir, fromStationId: state.fromIdx != null ? ids[state.fromIdx] : null, toStationId: settings.tripTo });
      }
    };

    const startWatch = async () => {
      if (sub || !alive) return;
      const perm = await Location.getForegroundPermissionsAsync().catch(() => null);
      if (!perm?.granted || !alive) return; // never asks: the first launch already did
      sub = await Location.watchPositionAsync({ accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 0 }, onFix).catch(() => null);
      if (!alive) sub?.remove();
    };
    const stopWatch = () => {
      sub?.remove();
      sub = null;
    };

    // foreground only: the screen is on and the app is open
    void startWatch();
    const appSub = AppState.addEventListener('change', (s) => (s === 'active' ? void startWatch() : stopWatch()));
    return () => {
      alive = false;
      appSub.remove();
      stopWatch();
    };
  }, [onboarded]);
}
