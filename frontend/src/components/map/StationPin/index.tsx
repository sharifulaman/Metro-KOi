import { Circle, G, Text as SvgText } from 'react-native-svg';

import { useSettings } from '@/store/settings';
import { fontFamily } from '@/theme/fonts';
import { useTheme } from '@/theme/useTheme';

import { svgPress } from '../svgPress';

export interface StationPinProps {
  x: number;
  y: number;
  label: string;
  /** which side the label sits on */
  side?: 'left' | 'right';
  highlighted?: boolean;
  /** viewBox units per screen pixel (sizes below are in screen px) */
  k?: number;
  /** whole-line overview: smaller pins and labels */
  dense?: boolean;
  onPress?: () => void;
}

export function StationPin({ x, y, label, side = 'left', highlighted, k = 1, dense, onPress }: StationPinProps) {
  const { c } = useTheme();
  const lang = useSettings((s) => s.lang);
  const r = (highlighted ? 9 : dense ? 4.5 : 7.5) * k;
  const font = (highlighted ? 13 : dense ? 10.5 : 12) * k;
  const gap = (dense ? 9 : 16) * k;
  const strong = highlighted || !dense;
  return (
    <G {...svgPress(onPress)}>
      {/* enlarged invisible hit target (≥ 48 px) */}
      <Circle cx={x} cy={y} r={24 * k} fill="transparent" />
      <Circle cx={x} cy={y} r={r} fill={c.surface} stroke={strong ? c.brandDeep : c.brand} strokeWidth={(highlighted ? 4 : dense ? 2.5 : 3.5) * k} />
      {/* halo underneath, then the label */}
      {(['halo', 'text'] as const).map((layer) => (
        <SvgText
          key={layer}
          x={side === 'left' ? x - gap : x + gap}
          y={y + font * 0.35}
          fontSize={font}
          fontWeight={strong ? '700' : '500'}
          fontFamily={fontFamily(lang, strong ? 700 : 500)}
          fill={strong ? c.ink : c.inkMuted}
          textAnchor={side === 'left' ? 'end' : 'start'}
          stroke={layer === 'halo' ? c.mapGround : undefined}
          strokeWidth={layer === 'halo' ? 3.5 * k : 0}
        >
          {label}
        </SvgText>
      ))}
    </G>
  );
}
