import { useMemo } from 'react';

import { displayedS } from '@/lib/interpolate';
import { estimatedTrains, type RunModel } from '@/lib/schedule';
import type { Train } from '@/models';
import { simNow, useClock } from '@/store/clock';
import { useLive } from '@/store/live';
import { useRider } from '@/store/rider';

import { useNow } from '../common/useNow';
import { useRunModel, useTimetable } from '../timetable/useTimetable';

const MERGE_M = 300;
/** a rider train with no update for this long is shown as STALE (matches the server's live window) */
export const LIVE_WINDOW_MS = 15_000;
/** …and dropped after this long (the server's drop time): a lost connection never leaves ghosts on the map */
export const DROP_AFTER_MS = 180_000;
/** my own train, drawn from the phone's GPS while the server has not accepted the ride (offline / not confirmed) */
export const LOCAL_TRAIN_ID = 'YOU';

/** Chainage of the next station ahead of `s` in the direction of travel (null past the last one). */
export function nextStationS(model: RunModel, dir: Train['dir'], s: number): number | null {
  const c = model.chainage;
  if (dir === 'SB') return c.find((x) => x > s + 1) ?? null;
  for (let i = c.length - 1; i >= 0; i--) if (c[i] < s - 1) return c[i];
  return null;
}

/**
 * A rider train as it should be drawn `now`: extrapolated from its last update, marked STALE when updates stop,
 * and never run past the next station while stale (it may be standing there). Null once it is too old to show.
 */
export function liveTrainAt(t: Train, kin: Parameters<typeof displayedS>[0] | undefined, model: RunModel, now: number): Train | null {
  const age = now - t.ts;
  if (age > DROP_AFTER_MS) return null;
  let s = kin ? displayedS(kin, now) : t.s;
  const stale = age > LIVE_WINDOW_MS;
  if (stale) {
    const stop = nextStationS(model, t.dir, t.s);
    if (stop != null) s = t.dir === 'SB' ? Math.min(s, stop) : Math.max(s, stop);
  }
  s = Math.max(model.chainage[0], Math.min(model.chainage[model.chainage.length - 1], s));
  return { ...t, s, state: stale ? 'STALE' : t.state };
}

/**
 * Live (rider) trains + timetable estimates. An estimate within 300 m of a
 * LIVE/STALE train in the same direction is hidden (spec §6.3 merge rule).
 * `followPlayback`: the live map runs on the timetable playback clock when playback is on (then only the
 * timetable runs: rider data is real-time). Every other screen always uses the real time.
 */
export function useTrains(tickMs = 500, followPlayback = false): { trains: Train[]; model: RunModel; now: number } {
  const playback = useClock((s) => s.playback);
  const sim = followPlayback && playback != null;
  // a sped-up clock needs a faster tick to move smoothly
  const realNow = useNow(sim && playback.rate > 1 ? Math.min(tickMs, 250) : tickMs);
  const now = sim ? simNow(playback, realNow) : realNow;
  const tt = useTimetable();
  const model = useRunModel();
  const live = useLive((s) => s.trains);
  const kin = useLive((s) => s.kin);
  const ride = useRider((s) => s.session);
  const trains = useMemo(() => {
    const liveList = sim ? [] : Object.values(live).flatMap((t) => liveTrainAt(t, kin[t.id], model, now) ?? []);
    const est = estimatedTrains(tt, model, now).filter(
      (e) => !liveList.some((l) => l.sched === e.id || (l.dir === e.dir && Math.abs(l.s - e.s) <= MERGE_M)),
    );
    const own: Train[] =
      !sim && ride && !ride.acked && !ride.stopReason && ride.direction && ride.lastF != null
        ? [{ id: LOCAL_TRAIN_ID, dir: ride.direction, s: model.chainage[0] + ride.lastF * model.lengthM, v: (ride.direction === 'NB' ? -1 : 1) * (ride.lastSpd ?? 0), lat: null, lng: null, hdg: null, state: 'LIVE', riders: 1, nextStation: null, etaSec: null, ts: now }]
        : [];
    return [...liveList, ...est, ...own];
  }, [live, kin, now, tt, model, sim, ride]);
  return { trains, model, now };
}

/** chainage → 0..1 along the line (map + diagram mappers). */
export function fractionOf(model: RunModel, s: number): number {
  return (s - model.chainage[0]) / model.lengthM;
}

/** chainage → fractional station index (LineDiagram `pos`). */
export function stationPos(model: RunModel, s: number): number {
  const c = model.chainage;
  if (s <= c[0]) return 0;
  for (let i = 1; i < c.length; i++) {
    if (s <= c[i]) return i - 1 + (s - c[i - 1]) / (c[i] - c[i - 1]);
  }
  return c.length - 1;
}

export interface TrainSegment {
  /** station index (SB order) the train last left or is standing at */
  fromIdx: number;
  /** station index it is heading to; equals fromIdx at the terminus */
  toIdx: number;
  /** 0..1 between the two stations */
  progress: number;
  atStation: boolean;
}

/** Which two stations a train is between, in its direction of travel. */
export function trainSegment(model: RunModel, train: Pick<Train, 's' | 'dir'>): TrainSegment {
  const c = model.chainage;
  const n = c.length;
  const near = c.findIndex((x) => Math.abs(x - train.s) < 15);
  if (near >= 0) {
    const toIdx = train.dir === 'SB' ? Math.min(near + 1, n - 1) : Math.max(near - 1, 0);
    return { fromIdx: near, toIdx, progress: 0, atStation: true };
  }
  let i = 0;
  while (i < n - 2 && train.s > c[i + 1]) i++;
  const f = Math.max(0, Math.min(1, (train.s - c[i]) / (c[i + 1] - c[i])));
  return train.dir === 'SB'
    ? { fromIdx: i, toIdx: i + 1, progress: f, atStation: false }
    : { fromIdx: i + 1, toIdx: i, progress: 1 - f, atStation: false };
}
