import type { Direction } from './timetable';
import type { TrainState } from './train';

export type Lang = 'bn' | 'en';

/** Wire shape of a train (spec §7.2). */
export interface WireTrain {
  id: string;
  dir: Direction;
  s: number;
  v: number;
  lat?: number | null;
  lng?: number | null;
  hdg?: number | null;
  state: TrainState;
  riders: number;
  nextStation?: string | null;
  etaSec?: number | null;
}

// Client → server
export type ClientMessage =
  | { t: 'hello'; deviceId: string; v: 1; lang: Lang }
  | { t: 'rider.start'; sessionId: string; score: number }
  | { t: 'rider.fix'; sessionId: string; lat: number; lng: number; acc: number; spd: number; hdg: number; ts: number }
  | { t: 'rider.stop'; sessionId: string }
  | { t: 'report.station'; stationId: string; direction: Direction; ts: number };

// Server → client
export type ServerMessage =
  | { t: 'trains.snapshot'; ts: number; trains: WireTrain[] }
  | { t: 'train.update'; train: WireTrain }
  | { t: 'train.remove'; id: string }
  | { t: 'notice'; level: 'info' | 'warn' | 'alert'; textBn: string; textEn: string }
  | { t: 'rider.ack'; sessionId: string; helping: number };

export interface Notice {
  level: 'info' | 'warn' | 'alert';
  textBn: string;
  textEn: string;
}
