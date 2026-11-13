import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { brandFixed } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

import type { BrandMarkProps } from './types';

/** The Metro KOI logo: a map pin with a metro train in it. */
export function BrandMark({ variant = 'tile', size = 40, label }: BrandMarkProps) {
  const { c } = useTheme();
  if (variant === 'pin') {
    return (
      <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityLabel={label}>
        <Defs>
          <LinearGradient id="bmPin" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={brandFixed.pinFrom} />
            <Stop offset="1" stopColor={brandFixed.pinTo} />
          </LinearGradient>
        </Defs>
        <Ellipse cx={50} cy={91} rx={15} ry={3} fill={brandFixed.mid} opacity={0.35} />
        <Path d="M50 11C33 11 21 24 21 40C21 59 41 75 50 87C59 75 79 59 79 40C79 24 67 11 50 11Z" fill="url(#bmPin)" />
        <Rect x={35} y={25} width={30} height={28} rx={8} fill={brandFixed.white} />
        <Rect x={39} y={29} width={22} height={11} rx={3.2} fill={brandFixed.cab} />
        <Path d="M50 29V40" stroke={brandFixed.white} strokeWidth={1.2} opacity={0.5} />
        <Circle cx={41.5} cy={45} r={2.4} fill={brandFixed.lamp} />
        <Circle cx={58.5} cy={45} r={2.4} fill={brandFixed.lamp} />
        <Rect x={35} y={49.2} width={30} height={2.2} fill={brandFixed.stripe} />
        <Rect x={35} y={51.4} width={30} height={1.8} fill={brandFixed.rail} />
        <Path d="M40 56L36.5 63M60 56L63.5 63" stroke={brandFixed.white} strokeWidth={2.6} strokeLinecap="round" />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 36 36" accessibilityLabel={label}>
      <Rect width={36} height={36} rx={11} fill={c.brandDeep} />
      <Path d="M18 30.5C18 30.5 9.5 23.4 9.5 16.6a8.5 8.5 0 0 1 17 0C26.5 23.4 18 30.5 18 30.5Z" fill={c.onBrand} />
      <Rect x={13.2} y={11.4} width={9.6} height={8.4} rx={2.2} fill={c.brandDeep} />
      <Rect x={14.5} y={12.8} width={7} height={3.3} rx={0.9} fill={c.onBrand} />
      <Circle cx={15.6} cy={18.2} r={0.95} fill={c.live} />
      <Circle cx={20.4} cy={18.2} r={0.95} fill={c.live} />
    </Svg>
  );
}

export type { BrandMarkProps } from './types';
