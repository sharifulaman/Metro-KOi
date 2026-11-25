// Automatic "is this person on the metro?" detector (docs/train-tracking-plan.md §5.5). Pure: one step per GPS
// fix, no React or device APIs, so it runs in node tests. The line runs above roads, so position alone cannot
// tell a train from the bus below: it needs station-only stops, train speed between stations and the timetable.
import type { Direction } from '../models';

export type RidePhase = 'IDLE' | 'NEAR_STATION' | 'AT_STATION' | 'CANDIDATE' | 'ON_TRAIN' | 'REJECTED';

export interface RideFix {
  /** ms epoch */
  ts: number;
  /** metres along the track from Uttara North (snapped) */
  s: number;
  /** metres from the track */
  offsetM: number;
  /** GPS speed m/s (≥ 0) */
  speed: number;
}

export interface RideContext {
  /** chainage (m) of each open station, north → south */
  stationM: number[];
  /** the scheduled train near this place and time, if any (±90 s of its timetable position) */
  match?: (dir: Direction, s: number, ts: number) => string | null;
}

export interface RideState {
  phase: RidePhase;
  /** when the current phase began */
  since: number;
  dir: Direction | null;
  /** station index the ride started from (null when it started mid-line) */
  fromIdx: number | null;
  /** last station index stood at or passed */
  lastIdx: number | null;
  trainId: string | null;
  score: number;
  /** signals seen during this ride */
  seen: { speed: boolean; dwell: boolean; schedule: boolean; fromStation: boolean; smooth: boolean };
  /** chainage where moving began, to require one full segment before ON_TRAIN */
  startS: number | null;
  /** current stop: since when and where (null while moving) */
  stopAt: { ts: number; s: number } | null;
  /** since when the rider has been away from the track (null when on it) */
  awaySince: number | null;
  /** recent fixes (for speed changes and direction) */
  recent: RideFix[];
  /** a ride that just ended (ON_TRAIN → left), for the trip history; cleared on the next ride */
  finished: { fromIdx: number | null; toIdx: number | null; dir: Direction; trainId: string | null; startedAt: number; endedAt: number } | null;
  /** start of the ride (ms) */
  startedAt: number | null;
}

export const RIDE = {
  /** a fix this close to a station (along the track) and to the track is "at the station" */
  stationM: 150,
  trackM: 60,
  /** further than this from the track for `awayMs`: not on the line any more */
  awayM: 200,
  awayMs: 30_000,
  /** in or near the station this long before moving: started in a station */
  atStationMs: 60_000,
  /** moving: GPS speed above this (≈ 29 km/h) */
  movingMps: 8,
  stoppedMps: 1,
  /** the top speed between stations that a road vehicle in Dhaka rarely holds (45 km/h) */
  trainMps: 12.5,
  dwellMinMs: 20_000,
  dwellMaxMs: 45_000,
  /** stopped this long between stations before ON_TRAIN: road traffic */
  offStationStopMs: 15_000,
  /** distance that counts as one full station-to-station segment */
  segmentM: 1_000,
  minScore: 3,
  /** after a rejection, wait before trying again */
  cooldownMs: 5 * 60_000,
  maxRecent: 40,
} as const;

export function initialRide(now = 0): RideState {
  return {
    phase: 'IDLE',
    since: now,
    dir: null,
    fromIdx: null,
    lastIdx: null,
    trainId: null,
    score: 0,
    seen: { speed: false, dwell: false, schedule: false, fromStation: false, smooth: false },
    startS: null,
    stopAt: null,
    awaySince: null,
    recent: [],
    finished: null,
    startedAt: null,
  };
}

/** Index of the station within `RIDE.stationM` of chainage `s`, or -1. */
export function stationAt(ctx: RideContext, s: number): number {
  let best = -1;
  let bestD: number = RIDE.stationM;
  ctx.stationM.forEach((c, i) => {
    const d = Math.abs(c - s);
    if (d <= bestD) {
      best = i;
      bestD = d;
    }
  });
  return best;
}

/** The next station index ahead of `s` in `dir`, or null at the end of the line. */
export function nextStationIdx(ctx: RideContext, dir: Direction, s: number): number | null {
  const c = ctx.stationM;
  if (dir === 'SB') {
    const i = c.findIndex((x) => x > s + 20);
    return i < 0 ? null : i;
  }
  for (let i = c.length - 1; i >= 0; i--) if (c[i] < s - 20) return i;
  return null;
}

function speedChangeVariance(fixes: RideFix[]): number | null {
  const a: number[] = [];
  for (let i = 1; i < fixes.length; i++) {
    const dt = (fixes[i].ts - fixes[i - 1].ts) / 1000;
    if (dt > 0.5 && dt < 10) a.push((fixes[i].speed - fixes[i - 1].speed) / dt);
  }
  if (a.length < 8) return null;
  const mean = a.reduce((x, y) => x + y, 0) / a.length;
  return a.reduce((x, y) => x + (y - mean) ** 2, 0) / a.length;
}

function scoreOf(seen: RideState['seen']): number {
  return Object.values(seen).filter(Boolean).length;
}

const reset = (st: RideState, phase: RidePhase, ts: number): RideState => ({
  ...initialRide(ts),
  phase,
  finished: st.finished,
  recent: st.recent,
});

/** One detector step for a new fix. */
export function stepRide(prev: RideState, fx: RideFix, ctx: RideContext): RideState {
  const recent = [...prev.recent, fx].slice(-RIDE.maxRecent);
  let st: RideState = { ...prev, recent };
  const onTrack = fx.offsetM <= RIDE.trackM;
  const idx = onTrack ? stationAt(ctx, fx.s) : -1;
  const moving = fx.speed >= RIDE.movingMps && onTrack;

  // away from the line long enough: whatever was happening is over
  if (fx.offsetM > RIDE.awayM) {
    const awaySince = st.awaySince ?? fx.ts;
    st = { ...st, awaySince };
    if (fx.ts - awaySince >= RIDE.awayMs && st.phase !== 'IDLE' && st.phase !== 'REJECTED') return end(st, fx);
    return st;
  }
  st = { ...st, awaySince: null };

  switch (st.phase) {
    case 'REJECTED':
      return fx.ts - st.since >= RIDE.cooldownMs ? reset(st, 'IDLE', fx.ts) : st;

    case 'IDLE':
      if (idx >= 0) return { ...st, phase: 'NEAR_STATION', since: fx.ts, lastIdx: idx, finished: null };
      return st;

    case 'NEAR_STATION':
    case 'AT_STATION': {
      if (moving) {
        const fromStation = st.phase === 'AT_STATION';
        return {
          ...st,
          phase: 'CANDIDATE',
          since: fx.ts,
          startS: fx.s,
          startedAt: fx.ts,
          fromIdx: st.lastIdx,
          seen: { ...st.seen, fromStation },
          score: fromStation ? 1 : 0,
          stopAt: null,
        };
      }
      if (idx < 0 && !onTrack) return reset(st, 'IDLE', fx.ts);
      if (st.phase === 'NEAR_STATION' && fx.ts - st.since >= RIDE.atStationMs) return { ...st, phase: 'AT_STATION', since: fx.ts };
      return idx >= 0 ? { ...st, lastIdx: idx } : st;
    }

    case 'CANDIDATE':
    case 'ON_TRAIN':
      return ride(st, fx, ctx, idx);
  }
}

/** CANDIDATE / ON_TRAIN: watch the motion, collect signals, end the ride. */
function ride(st: RideState, fx: RideFix, ctx: RideContext, idx: number): RideState {
  // direction from the net movement along the track
  const first = st.recent.find((r) => r.ts >= fx.ts - 60_000) ?? st.recent[0];
  let dir = st.dir;
  if (!dir && first && Math.abs(fx.s - first.s) >= 40) dir = fx.s > first.s ? 'SB' : 'NB';
  const seen = { ...st.seen };
  let { stopAt, lastIdx } = st;
  if (idx >= 0) lastIdx = idx;

  if (fx.speed < RIDE.stoppedMps) {
    stopAt ??= { ts: fx.ts, s: fx.s };
    const stoppedFor = fx.ts - stopAt.ts;
    const atStation = stationAt(ctx, stopAt.s) >= 0;
    // terminal: the ride is over after a proper stop at the end of the line
    if (st.phase === 'ON_TRAIN' && atStation && dir && nextStationIdx(ctx, dir, stopAt.s) == null && stoppedFor >= RIDE.dwellMinMs) {
      return end({ ...st, dir, lastIdx }, fx);
    }
    // stuck between stations before we were sure: a road vehicle
    if (st.phase === 'CANDIDATE' && !atStation && stoppedFor >= RIDE.offStationStopMs) return reset(st, 'REJECTED', fx.ts);
    // stood at a station far longer than a train does: the rider got off and is waiting
    if (atStation && stoppedFor > 3 * 60_000) return end({ ...st, dir, lastIdx }, fx);
  } else {
    if (stopAt) {
      const dur = fx.ts - stopAt.ts;
      if (stationAt(ctx, stopAt.s) >= 0 && dur >= RIDE.dwellMinMs && dur <= RIDE.dwellMaxMs) seen.dwell = true;
    }
    stopAt = null;
    if (fx.speed >= RIDE.trainMps && idx < 0) seen.speed = true;
  }
  const v = speedChangeVariance(st.recent);
  if (v != null && v < 0.6) seen.smooth = true;
  let trainId = st.trainId;
  if (dir && ctx.match) {
    const id = ctx.match(dir, fx.s, fx.ts);
    if (id) {
      trainId = id;
      seen.schedule = true;
    }
  }
  const score = scoreOf(seen);
  const segment = st.startS != null && Math.abs(fx.s - st.startS) >= RIDE.segmentM;
  const phase: RidePhase = st.phase === 'ON_TRAIN' || (dir && segment && score >= RIDE.minScore) ? 'ON_TRAIN' : 'CANDIDATE';
  return { ...st, phase, since: phase === st.phase ? st.since : fx.ts, dir, seen, score, stopAt, lastIdx, trainId };
}

/** Close a ride: an ON_TRAIN ride is kept as `finished` for the trip history. */
function end(st: RideState, fx: RideFix): RideState {
  const finished =
    st.phase === 'ON_TRAIN' && st.dir
      ? { fromIdx: st.fromIdx, toIdx: st.lastIdx, dir: st.dir, trainId: st.trainId, startedAt: st.startedAt ?? st.since, endedAt: fx.ts }
      : st.finished;
  return { ...initialRide(fx.ts), finished, recent: [] };
}
