// Placeholder trips shown until the rider has real history (card reads / rides), in the
// exact order and amounts of the design (Metro KOI card section, artboards ১ and ৮).
// All numbers and times are samples; they are replaced the moment real history exists.

export interface DemoRow {
  kind: 'trip' | 'recharge';
  from?: string;
  to?: string;
  /** "08:12" — 24-hour Dhaka time, shown as the design writes it */
  hm: string;
  fare: number;
}

export interface DemoDay {
  /** days before today (0 = today) */
  ago: number;
  rows: DemoRow[];
}

const trip = (from: string, to: string, hm: string, fare: number): DemoRow => ({ kind: 'trip', from, to, hm, fare });

/** History page, top to bottom. 14 trips · ৳560 for the month, like the summary card. */
export const DEMO_HISTORY: DemoDay[] = [
  { ago: 0, rows: [trip('agargaon', 'motijheel', '08:12', 40), trip('motijheel', 'agargaon', '18:05', 40)] },
  { ago: 1, rows: [{ kind: 'recharge', hm: '21:30', fare: 500 }, trip('uttara-north', 'farmgate', '09:20', 60)] },
  { ago: 2, rows: [trip('farmgate', 'uttara-north', '17:40', 60), trip('uttara-north', 'farmgate', '09:05', 60), trip('agargaon', 'motijheel', '08:40', 40)] },
  { ago: 3, rows: [trip('motijheel', 'agargaon', '18:30', 40), trip('agargaon', 'motijheel', '08:15', 40)] },
  { ago: 5, rows: [trip('shahbagh', 'mirpur-10', '19:10', 40), trip('mirpur-10', 'shahbagh', '10:00', 40)] },
  { ago: 7, rows: [trip('motijheel', 'agargaon', '18:20', 40), trip('agargaon', 'motijheel', '08:10', 20)] },
  { ago: 9, rows: [trip('farmgate', 'pallabi', '17:50', 20), trip('pallabi', 'farmgate', '09:30', 20)] },
];

/** The three rows under "Recent trips" on the Card home. */
export const DEMO_RECENT: { ago: number; row: DemoRow }[] = [
  { ago: 0, row: trip('agargaon', 'motijheel', '08:12', 40) },
  { ago: 1, row: trip('motijheel', 'agargaon', '18:05', 40) },
  { ago: 1, row: { kind: 'recharge', hm: '21:30', fare: 500 } },
];
