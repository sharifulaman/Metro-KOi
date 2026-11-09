import { useMemo } from 'react';

import { displayedS } from '@/lib/interpolate';
import { estimatedTrains, type RunModel } from '@/lib/schedule';
import type { Train } from '@/models';
import { useClock } from '@/store/clock';
import { useLive } from '@/store/live';

import { useNow } from '../common/useNow';
import { useRunModel, useTimetable } from '../timetable/useTimetable';

const MERGE_M = 300;

/**
 * Live (rider) trains + timetable estimates. An estimate within 300 m of a
 * LIVE/STALE train in the same direction is hidden (spec §6.3 merge rule).
 * During timetable playback only the timetable runs (rider data is real-time).
 */
export function useTrains(tickMs = 500): { trains: Train[]; model: RunModel; now: number } {
  const now = useNow(tickMs);
  const tt = useTimetable();
  const model = useRunModel();
  const live = useLive((s) => s.trains);
  const kin = useLive((s) => s.kin);
  const playback = useClock((s) => s.playback);
  const trains = useMemo(() => {
    const liveList = playback ? [] : Object.values(live).map((t) => (kin[t.id] ? { ...t, s: displayedS(kin[t.id], now) } : t));
    const est = estimatedTrains(tt, model, now).filter(
      (e) => !liveList.some((l) => l.dir === e.dir && Math.abs(l.s - e.s) <= MERGE_M),
    );
    return [...liveList, ...est];
  }, [live, kin, now, tt, model, playback]);
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
