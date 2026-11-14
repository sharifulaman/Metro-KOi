import type { Direction } from './timetable';

export type RiderPhase = 'idle' | 'ask' | 'explain' | 'active' | 'ended';

/** A raw GPS fix from expo-location. */
export interface GpsFix {
  lat: number;
  lng: number;
  /** metres */
  acc: number;
  /** m/s */
  spd: number | null;
  hdg: number | null;
  /** ms epoch */
  ts: number;
}

/** Signals behind the "really on the train?" score (spec §6.2). */
export interface RiderSignals {
  confirmed: boolean;
  nearLineFor20s: boolean;
  trainSpeedSeen: boolean;
  stationDwellPattern: boolean;
  smoothMotion: boolean;
  startedInStation: boolean;
}

export type StopReason = 'user' | 'left_corridor' | 'stationary' | 'timeout' | 'terminal' | 'refused';

export interface RiderSession {
  sessionId: string;
  startedAt: number;
  fromStationId: string | null;
  toStationId: string | null;
  direction: Direction | null;
  score: number;
  fixesSent: number;
  helping: number;
  /** the server accepted this session (rider.ack); until then we are not live */
  acked?: boolean;
  stopReason?: StopReason;
}
