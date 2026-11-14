// Sample values for the Stations page, exactly as the design shows them (artboard ১৩).
// Index = station order from Uttara North (0) to Motijheel (15). All times are samples.

export interface DemoEta {
  /** whole minutes until the next train */
  min: number;
  live: boolean;
}

/** Towards Motijheel (SB): the first three are timetable estimates, then six live trains, the rest unlabelled. */
const SB: (DemoEta | null)[] = [
  { min: 4, live: false },
  { min: 6, live: false },
  { min: 8, live: false },
  { min: 2, live: true },
  { min: 4, live: true },
  { min: 5, live: true },
  { min: 7, live: true },
  { min: 8, live: true },
  { min: 10, live: true },
  null, null, null, null, null, null, null,
];

/** Towards Uttara (NB): the same line read from the other end. */
const NB: (DemoEta | null)[] = [...SB].reverse();

export const DEMO_STATION_ETAS = { SB, NB } as const;

/** Where the little black train sits on the line: between the 3rd and 4th stop, 40% of the way. */
export const DEMO_TRAIN = { SB: { afterIndex: 2, progress: 0.4, live: true }, NB: { afterIndex: 11, progress: 0.4, live: true } } as const;

/** "Your nearest station" banner. */
export const DEMO_NEAREST = { stationId: 'farmgate', walkMeters: 220, walkMinutes: 3, etaMin: 4 } as const;
