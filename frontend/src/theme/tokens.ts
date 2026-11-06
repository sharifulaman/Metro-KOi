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
  live: string;
  liveTint: string;
  onLiveTint: string;
  estimated: string;
  danger: string;
  dangerTint: string;
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
  live: '#F59E0B',
  liveTint: '#FEF3C7',
  onLiveTint: '#92400E',
  estimated: '#6B7C75',
  danger: '#E5484D',
  dangerTint: '#FDE7E8',
  trainSB: '#0E9F6E',
  trainNB: '#3B82F6',
  crowdLow: '#1F9D63',
  crowdMid: '#B7791F',
  crowdHigh: '#D14343',
  scrim: 'rgba(14,26,22,0.35)',
  mapGround: '#EEF1EF',
  mapRoad: '#FFFFFF',
  facade: '#B5523B',
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
  live: '#FBBF24',
  liveTint: '#3A2A08',
  onLiveTint: '#FCD34D',
  estimated: '#8EA19A',
  danger: '#FF6369',
  dangerTint: '#3A1517',
  trainSB: '#2BD39A',
  trainNB: '#60A5FA',
  crowdLow: '#3FCB8A',
  crowdMid: '#E0A643',
  crowdHigh: '#F07070',
  scrim: 'rgba(0,0,0,0.55)',
  mapGround: '#101917',
  mapRoad: '#1C2925',
  facade: '#5A2E26',
};

/** Train livery — fixed in both themes (TrainIllustration + 3D scene). */
export const livery = {
  body: '#E9EDEB',
  stripe: '#1F9D63',
  band: '#D42A1F',
  cab: '#1F7A4D',
  glass: '#26414A',
  underframe: '#2A2F2D',
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
  tabBar: 76,
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

export const BANGLA_LINE_FACTOR = 1.35;
