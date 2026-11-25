import { create } from 'zustand';

import type { Direction } from '@/models';
import type { RidePhase } from '@/lib/rideDetector';

/** What the automatic ride detector currently believes (not persisted). */
export interface AutoRideState {
  phase: RidePhase;
  dir: Direction | null;
  /** scheduled train matched by the timetable, e.g. SB-0810 */
  trainId: string | null;
  /** station id the ride started at, the next one ahead */
  fromStationId: string | null;
  nextStationId: string | null;
  /** seconds to the next station (timetable speed) */
  nextEtaSec: number | null;
  /** last finished ride, for a "your trip" summary */
  lastTrip: { fromStationId: string | null; toStationId: string | null; trainId: string | null; startedAt: number; endedAt: number } | null;
  set(patch: Partial<Omit<AutoRideState, 'set'>>): void;
}

export const useAutoRide = create<AutoRideState>()((set) => ({
  phase: 'IDLE',
  dir: null,
  trainId: null,
  fromStationId: null,
  nextStationId: null,
  nextEtaSec: null,
  lastTrip: null,
  set: (patch) => set(patch),
}));
