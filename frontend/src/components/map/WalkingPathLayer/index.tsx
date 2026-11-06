import { Path } from 'react-native-svg';

import { useTheme } from '@/theme/useTheme';

export interface WalkingPathLayerProps {
  d: string;
}

/** Dashed walking path from a gate (spec §18.2). */
export function WalkingPathLayer({ d }: WalkingPathLayerProps) {
  const { c } = useTheme();
  return <Path d={d} stroke={c.brandDeep} strokeWidth={3} strokeDasharray="6,5" fill="none" strokeLinecap="round" />;
}
