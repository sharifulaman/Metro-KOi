import { useMemo } from 'react';

import { displayedS } from '@/lib/interpolate';
import { estimatedTrains, type RunModel } from '@/lib/schedule';
import type { Train } from '@/models';
import { useLive } from '@/store/live';

import { useNow } from '../common/useNow';
import { useRunModel, useTimetable } from '../timetable/useTimetable';

const MERGE_M = 300;

/**
 * Live (rider) trains + timetable estimates. An estimate within 300 m of a
 * LIVE/STALE train in the same direction is hidden (spec §6.3 merge rule).
 */
export function useTrains(tickMs = 500): { trains: Train[]; model: RunModel; now: number } {
  const now = useNow(tickMs);
  const tt = useTimetable();
  const model = useRunModel();
  const live = useLive((s) => s.trains);
  const kin = useLive((s) => s.kin);
  const trains = useMemo(() => {
    const liveList = Object.values(live).map((t) => (kin[t.id] ? { ...t, s: displayedS(kin[t.id], now) } : t));
    const est = estimatedTrains(tt, model, now).filter(
      (e) => !liveList.some((l) => l.dir === e.dir && Math.abs(l.s - e.s) <= MERGE_M),
    );
    return [...liveList, ...est];
  }, [live, kin, now, tt, model]);
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
