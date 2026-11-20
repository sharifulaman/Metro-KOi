import { useMemo } from 'react';

import { nextServiceStart, stationDepartures } from '@/lib/schedule';
import type { Departure, Direction } from '@/models';

import { useTrains } from '../map/useTrains';
import { useTimetable } from '../timetable/useTimetable';
import { useDepartures } from './useDepartures';

export interface BestTrain {
  dir: Direction;
  trainId: string;
  platform: number;
  source: Departure['source'];
  /** seconds until the train reaches the station (0 when closed: use atSec) */
  etaSec: number;
  /** clock time (seconds after midnight) the train is at the station */
  atSec: number;
  /** the metro is closed: this is tomorrow's (or the next service day's) first train */
  closed: boolean;
  /** seconds the rider can still take before they must leave to make it; null when the walk is unknown */
  leaveInSec: number | null;
}

/** the rider can usually make a train that is at least this much later than their walk */
const SLACK_SEC = 20;

/**
 * The train to take right now at a station, from the rider's time and (optionally) how long they need to walk there.
 * Looks at both directions, drops trains they can no longer reach on foot, and returns the soonest.
 * When the line is closed it returns the first train of the next service day instead.
 */
export function useBestTrain(stationId: string, walkSec: number | null): { best: BestTrain | null; byDir: Record<Direction, BestTrain | null> } {
  const tt = useTimetable();
  const { model, now } = useTrains(1000);
  const deps = useDepartures(stationId, 3);

  return useMemo(() => {
    const empty = { best: null, byDir: { SB: null, NB: null } as Record<Direction, BestTrain | null> };
    const pick = (dir: Direction): BestTrain | null => {
      if (deps.isTerminusFor[dir]) return null;
      const list = deps.byDir[dir];
      const need = walkSec ?? 0;
      const d = list.find((x) => x.etaSec + SLACK_SEC >= need) ?? null;
      if (!d) return null;
      return {
        dir,
        trainId: d.trainId ?? "",
        platform: d.platform,
        source: d.source,
        etaSec: d.etaSec,
        atSec: d.atSec,
        closed: false,
        leaveInSec: walkSec == null ? null : Math.max(0, d.etaSec - walkSec),
      };
    };
    const running = { SB: pick('SB'), NB: pick('NB') };
    const soonest = (a: Record<Direction, BestTrain | null>) =>
      (['SB', 'NB'] as const).map((k) => a[k]).filter((x): x is BestTrain => !!x).sort((x, y) => x.etaSec - y.etaSec)[0] ?? null;

    const running1 = soonest(running);
    if (running1) return { best: running1, byDir: running };

    // nothing left today: the first train of the next service day at this station
    const start = nextServiceStart(tt, model, now);
    if (start == null) return empty;
    const first = stationDepartures(tt, model, stationId, start - 1000, 1);
    const closed: Record<Direction, BestTrain | null> = { SB: null, NB: null };
    for (const dir of ['SB', 'NB'] as const) {
      const d = first[dir][0];
      if (!d || deps.isTerminusFor[dir]) continue;
      closed[dir] = { dir, trainId: d.trainId ?? "", platform: d.platform, source: 'schedule', etaSec: Math.max(0, Math.round((start - now) / 1000)), atSec: d.atSec, closed: true, leaveInSec: null };
    }
    const earliest = (['SB', 'NB'] as const).map((k) => closed[k]).filter((x): x is BestTrain => !!x).sort((x, y) => x.atSec - y.atSec)[0] ?? null;
    return { best: earliest, byDir: closed };
  }, [tt, model, now, stationId, walkSec, deps]);
}
