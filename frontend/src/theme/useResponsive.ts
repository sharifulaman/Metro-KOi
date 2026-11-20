import { useWindowDimensions } from 'react-native';

/** Content never gets wider than this, so a tablet or a phone in landscape does not stretch the layout. */
export const MAX_CONTENT_W = 560;

export interface Responsive {
  width: number;
  height: number;
  /** system font-size setting (1 = default) */
  fontScale: number;
  /** under 360 dp: small / older phones */
  compact: boolean;
  /** under 340 dp: the smallest phones (320 dp class) */
  narrow: boolean;
  /** 600 dp and up: tablets, foldables, landscape */
  wide: boolean;
  /** side margin for screens: 16 on narrow phones, 20 elsewhere */
  gutter: number;
}

/** Window-size classes so layouts adapt to every phone instead of assuming a 390 dp design width. */
export function useResponsive(): Responsive {
  const { width, height, fontScale } = useWindowDimensions();
  return { width, height, fontScale, compact: width < 360, narrow: width < 340, wide: width >= 600, gutter: width < 340 ? 14 : width < 360 ? 16 : 20 };
}
