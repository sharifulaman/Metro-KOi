// Design tokens — the only place raw colours and sizes live (spec §9.1, §9.2).
// Components read these through useTheme(); screens never import hex values.

export interface Palette {
  bg: string;
  surface: string;
  surfaceAlt: string;
  ink: string;
  inkMuted: string;
  inverse: string;
  onBrand: string;
  outline: string;
  divider: string;
  brand: string;
  brandDeep: string;
  brandTint: string;
  /** text/icon colour on a `brandTint` background */
  onBrandTint: string;
  /** solid primary-button fill and the text on it (dark mode flips to the bright accent) */
  brandSolid: string;
  onBrandSolid: string;
  live: string;
  liveTint: string;
  onLiveTint: string;
  estimated: string;
  danger: string;
  dangerTint: string;
  /** text colour for destructive links (a darker red that passes contrast) */
  dangerInk: string;
  trainSB: string;
  trainNB: string;
  crowdLow: string;
  crowdMid: string;
  crowdHigh: string;
  scrim: string;
  mapGround: string;
  mapRoad: string;
  /** brick-red concourse facade (station section + 3D scene) */
  facade: string;
  /** floating "glass" pills and the tab bar: translucent surface + hairline */
  glass: string;
  glassBorder: string;
  /** near-opaque glass for controls floating on the Live map */
  glassMap: string;
  /** border of the active tab pill */
  brandLine: string;
}

export const light: Palette = {
  bg: '#F6F8F7',
  surface: '#FFFFFF',
  surfaceAlt: '#EDF2F0',
  ink: '#0E1A16',
  inkMuted: '#5B6B65',
  inverse: '#FFFFFF',
  onBrand: '#FFFFFF',
  outline: '#CBD7D2',
  divider: '#DCE5E1',
  brand: '#0E9F6E',
  brandDeep: '#066B4A',
  brandTint: '#DDF3E8',
  onBrandTint: '#066B4A',
  brandSolid: '#066B4A',
  onBrandSolid: '#FFFFFF',
  live: '#F59E0B',
  liveTint: '#FEF3C7',
  onLiveTint: '#92400E',
  estimated: '#6B7C75',
  danger: '#E5484D',
  dangerTint: '#FDE7E8',
  dangerInk: '#C2373B',
  trainSB: '#0E9F6E',
  trainNB: '#3B82F6',
  crowdLow: '#1F9D63',
  crowdMid: '#B7791F',
  crowdHigh: '#D14343',
  scrim: 'rgba(14,26,22,0.35)',
  mapGround: '#EEF1EF',
  mapRoad: '#FFFFFF',
  facade: '#B5523B',
  glass: 'rgba(255,255,255,0.84)',
  glassBorder: 'rgba(255,255,255,0.75)',
  glassMap: 'rgba(255,255,255,0.94)',
  brandLine: 'rgba(14,159,110,0.3)',
};

export const dark: Palette = {
  bg: '#0B1210',
  surface: '#131D1A',
  surfaceAlt: '#1A2723',
  ink: '#EAF2EF',
  inkMuted: '#93A59E',
  inverse: '#0B1210',
  onBrand: '#FFFFFF',
  outline: '#2F403A',
  divider: '#26352F',
  brand: '#2BD39A',
  brandDeep: '#0E9F6E',
  brandTint: '#173A2E',
  onBrandTint: '#2BD39A',
  brandSolid: '#2BD39A',
  onBrandSolid: '#04140E',
  live: '#FBBF24',
  liveTint: '#3A2A08',
  onLiveTint: '#FCD34D',
  estimated: '#8EA19A',
  danger: '#FF6369',
  dangerTint: '#3A1517',
  dangerInk: '#FF6369',
  trainSB: '#2BD39A',
  trainNB: '#60A5FA',
  crowdLow: '#3FCB8A',
  crowdMid: '#E0A643',
  crowdHigh: '#F07070',
  scrim: 'rgba(0,0,0,0.55)',
  mapGround: '#101917',
  mapRoad: '#1C2925',
  facade: '#5A2E26',
  glass: 'rgba(19,29,26,0.86)',
  glassBorder: 'rgba(255,255,255,0.12)',
  glassMap: 'rgba(19,29,26,0.94)',
  brandLine: 'rgba(43,211,154,0.35)',
};

/** A saved card's colour, picked by the rider to tell cards apart — fixed in both themes, like `livery`. */
/** 'original' = the official Rapid Pass card picture instead of a coloured tile (Rapid Pass cards only). */
export type CardColor = 'green' | 'dark' | 'gold' | 'blue' | 'original';

export const cardGradients: Record<CardColor, { from: string; via: string; to: string }> = {
  green: { from: '#0A8A60', via: '#066B4A', to: '#04402C' },
  dark: { from: '#2B3A35', via: '#16211D', to: '#0B1210' },
  gold: { from: '#B7791F', via: '#8A4B0F', to: '#5C3008' },
  blue: { from: '#2F6FD1', via: '#1D4FA3', to: '#123572' },
  // never drawn as a tile: an 'original' card without the Rapid Pass picture falls back to green
  original: { from: '#0A8A60', via: '#066B4A', to: '#04402C' },
};

/** The EMV-style chip graphic drawn on every card, regardless of its colour. */
export const cardChip = { from: '#F3D98B', to: '#C9A34A' } as const;

/** Train livery — fixed in both themes (TrainIllustration + 3D scene). */
export const livery = {
  body: '#E9EDEB',
  stripe: '#1F9D63',
  band: '#D42A1F',
  cab: '#1F7A4D',
  glass: '#26414A',
  underframe: '#2A2F2D',
} as const;


/** Splash screen and logo art: fixed brand colours, the same in both themes. */
export const brandFixed = {
  top: '#0E9F6E',
  mid: '#066B4A',
  bottom: '#04402C',
  accent: '#FCD34D',
  white: '#FFFFFF',
  pinFrom: '#14B87F',
  pinTo: '#055E40',
  cab: '#0B5A3F',
  lamp: '#F59E0B',
  rail: '#D42A1F',
  stripe: '#1F9D63',
  body: '#E9EDEB',
} as const;

export const space = [0, 4, 8, 12, 16, 20, 24, 32] as const;
export type SpaceStep = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const radius = {
  chip: 999,
  control: 26,
  card: 22,
  hero: 24,
  note: 18,
  tile: 12,
  sheet: 28,
} as const;

export const size = {
  touch: 48,
  iconBtn: 46,
  button: 52,
  buttonMd: 44,
  chipH: 38,
  row: 56,
  rowLg: 66,
  /** floating capsule (64) + its gap from the bottom edge (22) */
  tabBar: 86,
  iconTile: 38,
} as const;

export const shadow = {
  float: { shadowColor: '#0E1A16', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 14, elevation: 6 },
  card: { shadowColor: '#0E1A16', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  sheet: { shadowColor: '#0E1A16', shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.12, shadowRadius: 28, elevation: 12 },
} as const;

/** Fraction of the window a docked sheet may take; the map fits above it. */
export const layout = { dockedSheet: 0.48 } as const;

export const motion = {
  sheetSpring: { damping: 18, stiffness: 180 },
  livePulseMs: 1600,
  markerGlideMs: 500,
} as const;

export type TextVariant = 'display' | 'title' | 'heading' | 'body' | 'label' | 'micro' | 'countdown';

/** [fontSize, lineHeight, weight] — Bangla line-height is multiplied by 1.35 in <Text>. */
export const typeScale: Record<TextVariant, { size: number; line: number; weight: 400 | 500 | 600 | 700 }> = {
  display: { size: 28, line: 34, weight: 700 },
  title: { size: 20, line: 26, weight: 600 },
  heading: { size: 22, line: 28, weight: 700 },
  body: { size: 16, line: 24, weight: 400 },
  label: { size: 13, line: 18, weight: 500 },
  micro: { size: 11, line: 14, weight: 500 },
  countdown: { size: 32, line: 36, weight: 700 },
};

/** Bangla needs room for the matra above and the vowel signs below the line. */
export const BANGLA_LINE_FACTOR = 1.4;
