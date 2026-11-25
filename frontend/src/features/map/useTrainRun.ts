import { useMemo } from 'react';

import { dayTypeOf, dhakaClock, estimatedTrains, etaToStation, parseScheduledId, runStops, terminalDepartures, type StopTime } from '@/lib/schedule';
import type { Direction, Train } from '@/models';

import { useTimetable } from '../timetable/useTimetable';

import { trainSegment, useTrains, type TrainSegment } from './useTrains';

export type RunPhase = 'before' | 'running' | 'after' | 'unknown';

export interface RunStop {
  stationId: string;
  passed: boolean;
  /** standing here right now */
  here: boolean;
  /** seconds until arrival (upcoming stops) */
  etaSec: number | null;
  /** scheduled clock times (seconds after midnight); null for rider-only trains */
  arriveSec: number | null;
  departSec: number | null;
}

export interface TrainRun {
  phase: RunPhase;
  dir: Direction | null;
  train: Train | undefined;
  segment: TrainSegment | null;
  /** stops in travel order */
  stops: RunStop[];
  /** index in `stops` the "train is here" marker follows (-1 = before the first stop) */
  markerAfter: number | null;
  /** seconds until the terminal departure (phase 'before') */
  startsInSec: number | null;
  now: number;
}

/**
 * One train's run, station by station. Scheduled ids (`SB-0710`) work at any
 * time of day: before departure, while running and after arrival. Rider-only
 * trains use their live position and chainage ETAs.
 */
/**
 * The train with this id. A scheduled train whose estimate is hidden on the map because a rider's live train
 * covers it (the 300 m merge rule) is still running: it is drawn from that live train, under its own id.
 */
export function findTrain(trains: Train[], id: string, estimates: Train[]): Train | undefined {
  const shown = trains.find((x) => x.id === id);
  if (shown) return shown;
  // the server names live trains after their scheduled run
  const named = trains.find((x) => x.sched === id);
  if (named) return { ...named, id };
  const est = estimates.find((x) => x.id === id);
  if (!est) return undefined;
  const live = trains
    .filter((l) => l.state !== 'ESTIMATED' && l.dir === est.dir && Math.abs(l.s - est.s) <= 300)
    .sort((a, b) => Math.abs(a.s - est.s) - Math.abs(b.s - est.s))[0];
  return live ? { ...live, id } : est;
}

export function useTrainRun(id: string): TrainRun {
  const tt = useTimetable();
  const { trains, model, now } = useTrains(1000);
  const train = useMemo(() => findTrain(trains, id, estimatedTrains(tt, model, now)), [trains, id, tt, model, now]);
  return useMemo(() => {
    const parsed = parseScheduledId(id);
    const sec = dhakaClock(now).sec;
    const dir = train?.dir ?? parsed?.dir ?? null;
    const scheduledToday = parsed ? terminalDepartures(tt, dayTypeOf(tt, now), parsed.dir).some((d) => d.trainId === id) : false;
    const empty: TrainRun = { phase: 'unknown', dir, train, segment: null, stops: [], markerAfter: null, startsInSec: null, now };
    if (!dir || (!train && !scheduledToday)) return empty;

    const n = model.stationIds.length;
    const order = dir === 'SB' ? [...Array(n).keys()] : [...Array(n).keys()].reverse();
    const sched: StopTime[] | null = parsed && scheduledToday ? runStops(model, dir, parsed.departSec) : null;
    const segment = train ? trainSegment(model, train) : null;
    const k = segment ? order.indexOf(segment.fromIdx) : -1;

    const phase: RunPhase = train ? 'running' : sched && sec < sched[0].departSec ? 'before' : 'after';
    const stops: RunStop[] = order.map((idx, j) => {
      const s = sched?.[j];
      const passed = phase === 'after' || (phase === 'running' && (segment!.atStation ? j < k : j <= k));
      const here = phase === 'running' && segment!.atStation && j === k;
      let etaSec: number | null = null;
      if (!passed) {
        if (s) etaSec = Math.max(0, Math.round(s.arriveSec - sec));
        else if (train) etaSec = etaToStation(model, train, model.stationIds[idx]);
      }
      return { stationId: model.stationIds[idx], passed, here, etaSec, arriveSec: s ? s.arriveSec : null, departSec: s ? s.departSec : null };
    });
    const markerAfter = phase === 'running' ? (segment!.atStation ? k - 1 : k) : null;
    const startsInSec = phase === 'before' && sched ? Math.round(sched[0].departSec - sec) : null;
    return { phase, dir, train, segment, stops, markerAfter, startsInSec, now };
  }, [id, tt, model, now, train]);
}
