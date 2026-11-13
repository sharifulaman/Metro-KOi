import type { Platform } from './station';
import type { Direction } from './timetable';

/** Where a number came from: riders (`live`) or the timetable (`schedule`). */
export type Source = 'live' | 'schedule';

/** Track states (spec §6.3). */
export type TrainState = 'LIVE' | 'STALE' | 'ESTIMATED';

/** Train as sent by the server (`trains.snapshot` / `train.update`, spec §7.2). */
export interface Train {
  id: string;
  dir: Direction;
  /** Chainage in metres from Uttara North. */
  s: number;
  /** Speed m/s, signed along chainage (SB positive). */
  v: number;
  lat: number | null;
  lng: number | null;
  hdg: number | null;
  state: TrainState;
  riders: number;
  nextStation: string | null;
  etaSec: number | null;
  /** Client receive time, ms epoch (for interpolation). */
  ts: number;
  /**
   * Seconds until the train leaves the station it is standing at. Only the
   * timetable engine knows this exactly, so riders' LIVE trains leave it unset.
   */
  dwellLeftSec?: number;
}

/** 0–100 per coach; 6 coaches. */
export type CrowdLevels = [number, number, number, number, number, number];

/** One upcoming train at a station (`GET /stations/{id}/departures`). */
export interface Departure {
  trainId?: string;
  direction: Direction;
  platform: Platform;
  etaSec: number;
  source: Source;
  /** Seconds after local midnight. */
  atSec: number;
}

export type TrainEta = { sec: number } | { state: 'at_station' | 'departed' };

export type ConnectionState = 'live' | 'reconnecting' | 'offline';
