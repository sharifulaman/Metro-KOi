import type { Source } from './train';
import type { Direction } from './timetable';

/** Fare data (spec §4.5). `amounts` is TO FETCH from the official DMTCL chart. */
export interface FaresFile {
  source: string;
  status: 'official' | 'derived' | 'TO_FETCH';
  currency: 'BDT';
  /** Rapid Pass multiplier (0.9 = 10% off). */
  rapidPassMultiplier: number;
  /** key `${fromId}|${toId}` → Taka. Null until the official chart is imported. */
  amounts: Record<string, number> | null;
}

export interface JourneyOption {
  trainId: string;
  direction: Direction;
  departSec: number;
  arriveSec: number;
  durationSec: number;
  waitSec: number;
  fareBdt: number | null;
  fareRapidPassBdt: number | null;
  source: Source;
}

export interface JourneyQuery {
  fromId: string;
  toId: string;
}
