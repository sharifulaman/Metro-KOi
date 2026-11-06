/** Day types (spec §4.1). `holiday` resolves to `holidayAs` (default `fri`, UNVERIFIED). */
export type DayType = 'sun_thu' | 'fri' | 'sat' | 'holiday';
export type ServiceDayType = Exclude<DayType, 'holiday'>;

/** SB = Uttara North → Motijheel, NB = Motijheel → Uttara North. */
export type Direction = 'SB' | 'NB';

/** [from "HH:mm", to "HH:mm", headway minutes] — inclusive, from the terminal. */
export type HeadwayBandTuple = [string, string, number];

export interface HeadwayBand {
  from: string;
  to: string;
  headwayMin: number;
}

/** Shape of `data/timetable.json` and `GET /v1/timetable` (spec §4.2). */
export interface TimetableFile {
  source: string;
  verifiedAt: string;
  version: string;
  holidayAs: ServiceDayType;
  /** UNVERIFIED defaults (spec §4.4). */
  endToEndMin: number;
  dwellSec: number;
  bands: Record<ServiceDayType, Record<Direction, HeadwayBandTuple[]>>;
}

/** A generated terminal departure. */
export interface TerminalDeparture {
  direction: Direction;
  /** Seconds after local (Asia/Dhaka) midnight. */
  departSec: number;
  trainId: string;
}
