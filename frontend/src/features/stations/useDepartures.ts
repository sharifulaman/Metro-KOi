import { useMemo } from 'react';

import { dayTypeOf, etaToStation, serviceWindow, stationDepartures } from '@/lib/schedule';
import type { Departure, Direction, Train } from '@/models';

import { useTrains } from '../map/useTrains';
import { useTimetable } from '../timetable/useTimetable';

export interface StationDepartures {
  byDir: Record<Direction, Departure[]>;
  window: { firstSec: number; lastSec: number };
  isTerminusFor: Record<Direction, boolean>;
  now: number;
}

/**
 * Next trains at a station per direction: LIVE trains approaching (ETA from
 * chainage, spec §6.5) first, then timetable departures not already covered.
 */
export function useDepartures(stationId: string, limit = 3): StationDepartures {
  const tt = useTimetable();
  const { trains, model, now } = useTrains(1000);
  return useMemo(() => {
    const sched = stationDepartures(tt, model, stationId, now, limit + 2);
    const idx = model.stationIds.indexOf(stationId);
    const byDir: Record<Direction, Departure[]> = { SB: [], NB: [] };
    for (const dir of ['SB', 'NB'] as const) {
      const live: Departure[] = trains
        .filter((t: Train) => t.dir === dir && t.state !== 'ESTIMATED')
        .map((t) => ({ t, eta: etaToStation(model, t, stationId) }))
        .filter((x): x is { t: Train; eta: number } => x.eta != null)
        .map(({ t, eta }) => ({ trainId: t.id, direction: dir, platform: dir === 'SB' ? 1 : 2, etaSec: eta, source: 'live' as const, atSec: 0 }));
      // drop scheduled entries a live train already represents (within 2 min)
      const rest = sched[dir].filter((d) => !live.some((l) => Math.abs(l.etaSec - d.etaSec) < 120));
      byDir[dir] = [...live, ...rest].sort((a, b) => a.etaSec - b.etaSec).slice(0, limit);
    }
    return {
      byDir,
      window: serviceWindow(tt, dayTypeOf(tt, now)),
      isTerminusFor: { SB: idx === model.stationIds.length - 1, NB: idx === 0 },
      now,
    };
  }, [tt, model, stationId, now, limit, trains]);
}
