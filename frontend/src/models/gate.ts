export type Gate = 'A' | 'B' | 'C' | 'D';
export type Corner = 'NW' | 'NE' | 'SW' | 'SE';
export const GATES: readonly Gate[] = ['A', 'B', 'C', 'D'];

/** Default corner per gate (spec §18.2): A=NW, B=NE, C=SW, D=SE. */
export const DEFAULT_CORNER: Record<Gate, Corner> = { A: 'NW', B: 'NE', C: 'SW', D: 'SE' };

/**
 * One entry/exit of a station (spec §18.2, §7.3 `station_gates`).
 * `hasLift` / `hasEscalator` are `null` when unknown — never guess.
 */
export interface StationGate {
  stationId: string;
  gate: Gate;
  corner: Corner;
  lat: number | null;
  lng: number | null;
  landmarkBn: string | null;
  landmarkEn: string | null;
  hasLift: boolean | null;
  hasEscalator: boolean | null;
  openFrom: string | null;
  openTo: string | null;
  /** Static walking estimate gate → platform, minutes (until measured). */
  walkMin: number | null;
  /** true while lat/lng are an estimate (not a surveyed entrance point). */
  approx?: boolean;
}

export type GateMode = 'entry' | 'exit';

/** Steps for the inside-the-station route (spec §18.3). */
export type RouteStepKind = 'gate' | 'toConcourse' | 'tapCard' | 'toPlatform' | 'platform';

export interface RouteStep {
  n: number;
  kind: RouteStepKind;
  /** i18n key */
  textKey: string;
  params?: Record<string, string | number>;
}
