import { Path } from 'react-native-svg';

import { useTheme } from '@/theme/useTheme';

export interface LineLayerProps {
  d: string;
}

/** Metro line: 6 px brand stroke with 2 px white casing (spec §9.1 map style). */
export function LineLayer({ d }: LineLayerProps) {
  const { c } = useTheme();
  return (
    <>
      <Path d={d} stroke={c.surface} strokeWidth={10} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Path d={d} stroke={c.brand} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  );
}
