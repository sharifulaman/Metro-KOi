// Where everything sits on the three pre-rendered Live maps (design ১০ · ১১ · ১২), in the 390×844
// coordinate space the map art was drawn in. Sample data: the trains, rings and times are placeholders.

export type LiveStage = 'overview' | 'city' | 'station';

export interface StagePill {
  x: number;
  y: number;
  /** station id (the name comes from the app's station list) */
  id: string;
  selected?: boolean;
  /** the bigger selected pill used when zoomed in */
  big?: boolean;
}
export interface StageRing {
  x: number;
  y: number;
  size: number;
  live: boolean;
}
export interface StageTag {
  x: number;
  y: number;
  /** train id, e.g. "SB-0630" */
  id: string;
  kind: 'live' | 'estimated' | 'atStation';
}
export interface StageGate {
  x: number;
  y: number;
  letter: string;
}

export interface StageLayout {
  /** station dots along the viaduct (top-left of a 12px circle) */
  dots?: [number, number][];
  pills: StagePill[];
  rings: StageRing[];
  tags: StageTag[];
  gates?: StageGate[];
  /** soft fade from the map colour at the top of the screen */
  fade: boolean;
  /** vertical positions of the floating UI, per stage */
  ui: { ride?: number; zoom: number; credit: number; sheet: number };
}

export const STAGES: Record<LiveStage, StageLayout> = {
  overview: {
    dots: [
      [316, 171], [294, 185], [271, 198], [244, 212], [216, 225], [185, 238], [155, 253], [127, 271],
      [105, 294], [89, 320], [77, 350], [75, 382], [75, 417], [72, 455], [63, 498], [43, 543],
    ],
    pills: [
      { x: 260, y: 169, id: 'uttara-north' },
      { x: 261, y: 236, id: 'mirpur-10' },
      { x: 181, y: 292, id: 'agargaon' },
      { x: 153, y: 348, id: 'farmgate', selected: true },
      { x: 49, y: 539, id: 'motijheel' },
    ],
    rings: [
      { x: 69, y: 398, size: 24, live: true },
      { x: 113, y: 270, size: 24, live: true },
      { x: 234, y: 205, size: 24, live: false },
    ],
    tags: [],
    fade: true,
    ui: { ride: 494, zoom: 516, credit: 545, sheet: 560 },
  },
  city: {
    pills: [
      { x: 234, y: 430, id: 'karwan-bazar' },
      { x: 189, y: 203, id: 'farmgate', selected: true, big: true },
      { x: 162, y: 94, id: 'bijoy-sarani' },
    ],
    rings: [
      { x: 175, y: 270, size: 36, live: true },
      { x: 201, y: 375, size: 36, live: false },
    ],
    tags: [
      { x: 193, y: 274, id: 'SB-0630', kind: 'live' },
      { x: 219, y: 379, id: 'NB-0612', kind: 'estimated' },
    ],
    fade: true,
    ui: { ride: 464, zoom: 486, credit: 515, sheet: 530 },
  },
  station: {
    pills: [],
    rings: [{ x: 173, y: 222, size: 44, live: true }],
    tags: [{ x: 131, y: 202, id: 'SB-0630', kind: 'atStation' }],
    gates: [
      { x: 154, y: 316, letter: 'A' },
      { x: 289, y: 272, letter: 'B' },
      { x: 103, y: 261, letter: 'C' },
      { x: 230, y: 223, letter: 'D' },
    ],
    fade: false,
    ui: { zoom: 418, credit: 447, sheet: 462 },
  },
};

/** zoom levels the chip cycles through */
export const STAGE_ORDER: LiveStage[] = ['overview', 'city', 'station'];
export const STAGE_ZOOM: Record<LiveStage, number> = { overview: 12, city: 14, station: 17 };
