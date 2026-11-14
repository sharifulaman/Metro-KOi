import { View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { useTheme } from '@/theme/useTheme';

import { Text } from '../../ui/Text';

import type { SpeedometerProps } from './types';

const R = 80;
const CX = 100;
const CY = 100;

/** point on the half-circle gauge: p = 0 left end … 1 right end */
function at(p: number, r = R) {
  const a = Math.PI + Math.PI * p;
  return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) };
}
function arc(p0: number, p1: number) {
  const a = at(p0);
  const b = at(p1);
  return `M${a.x.toFixed(2)} ${a.y.toFixed(2)} A${R} ${R} 0 0 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
}

/** Half-circle speed gauge with a needle and the speed in the middle. */
export function Speedometer({ value, max = 100, unit, valueLabel, size = 170, testID }: SpeedometerProps) {
  const { c } = useTheme();
  const p = Math.max(0, Math.min(1, value / max));
  const tip = at(p, R - 14);
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  return (
    <View testID={testID} accessibilityRole="text" accessibilityLabel={`${valueLabel} ${unit}`} style={{ width: size, alignItems: 'center' }}>
      <Svg width={size} height={size * 0.58} viewBox="0 0 200 116">
        <Path d={arc(0, 1)} stroke={c.surfaceAlt} strokeWidth={14} strokeLinecap="round" fill="none" />
        {p > 0.005 ? <Path d={arc(0, p)} stroke={c.brand} strokeWidth={14} strokeLinecap="round" fill="none" /> : null}
        {ticks.map((t) => {
          const a = at(t, R - 22);
          const b = at(t, R - 30);
          return <Line key={t} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={c.inkMuted} strokeWidth={2} strokeLinecap="round" />;
        })}
        <Line x1={CX} y1={CY} x2={tip.x} y2={tip.y} stroke={c.ink} strokeWidth={4} strokeLinecap="round" />
        <Circle cx={CX} cy={CY} r={7} fill={c.ink} />
      </Svg>
      <View style={{ alignItems: 'center', marginTop: -size * 0.2 }}>
        <Text size={size * 0.2} lh={1.1} weight={700} numeric>
          {valueLabel}
        </Text>
        <Text variant="micro" tone="muted">
          {unit}
        </Text>
      </View>
    </View>
  );
}

export type { SpeedometerProps } from './types';
