import { Path } from 'react-native-svg';

import { useTheme } from '@/theme/useTheme';

export interface LineLayerProps {
  d: string;
  /** viewBox units per screen pixel, so the stroke stays the same on screen at any zoom */
  k?: number;
}

/** Metro line: brand stroke with a white casing (spec §9.1 map style). */
export function LineLayer({ d, k = 1 }: LineLayerProps) {
  const { c } = useTheme();
  return (
    <>
      <Path d={d} stroke={c.surface} strokeWidth={13 * k} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Path d={d} stroke={c.brand} strokeWidth={7 * k} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  );
}
