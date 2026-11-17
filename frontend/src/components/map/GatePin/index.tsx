import { Circle, G, Path, Text as SvgText } from 'react-native-svg';

import type { Gate } from '@/models';
import { fontFamily } from '@/theme/fonts';
import { useTheme } from '@/theme/useTheme';

import { svgPress } from '../svgPress';

export interface GatePinProps {
  x: number;
  y: number;
  gate: Gate;
  selected?: boolean;
  recommended?: boolean;
  /** Landmark name drawn under the pin. */
  label?: string;
  onPress?: () => void;
}

export function GatePin({ x, y, gate, selected, recommended, label, onPress }: GatePinProps) {
  const { c } = useTheme();
  const fill = selected ? c.brandDeep : c.surface;
  const fg = selected ? c.onBrand : c.ink;
  return (
    <G {...svgPress(onPress)} transform={`translate(${x},${y})`}>
      <Circle r={26} fill="transparent" />
      {recommended && !selected && <Circle cy={-14} r={18} fill={c.brand} opacity={0.2} />}
      <Path d="M0,10 C-14,-4 -14,-28 0,-28 C14,-28 14,-4 0,10 Z" fill={fill} stroke={selected ? c.brandDeep : c.brand} strokeWidth={2.5} />
      <SvgText y={-9} fontSize={14} fontWeight="700" fontFamily={fontFamily('en', 700)} fill={fg} textAnchor="middle">
        {gate}
      </SvgText>
      {label ? (
        <SvgText y={26} fontSize={10.5} fontWeight="600" fontFamily={fontFamily('en', 600)} fill={c.ink} stroke={c.mapGround} strokeWidth={3} textAnchor="middle">
          {label}
        </SvgText>
      ) : null}
    </G>
  );
}
