import { Circle, G, Text as SvgText } from 'react-native-svg';

import { useSettings } from '@/store/settings';
import { fontFamily } from '@/theme/fonts';
import { useTheme } from '@/theme/useTheme';

export interface StationPinProps {
  x: number;
  y: number;
  label: string;
  /** which side the label sits on */
  side?: 'left' | 'right';
  highlighted?: boolean;
  onPress?: () => void;
}

export function StationPin({ x, y, label, side = 'left', highlighted, onPress }: StationPinProps) {
  const { c } = useTheme();
  const lang = useSettings((s) => s.lang);
  return (
    <G onPress={onPress}>
      {/* enlarged invisible hit target (≥ 48 px) */}
      <Circle cx={x} cy={y} r={20} fill="transparent" />
      <Circle cx={x} cy={y} r={highlighted ? 9 : 6.5} fill={c.surface} stroke={highlighted ? c.brandDeep : c.brand} strokeWidth={highlighted ? 4 : 3} />
      {/* halo underneath, then the label */}
      {(['halo', 'text'] as const).map((layer) => (
        <SvgText
          key={layer}
          x={side === 'left' ? x - 14 : x + 14}
          y={y + 4}
          fontSize={highlighted ? 13 : 11.5}
          fontWeight={highlighted ? '700' : '500'}
          fontFamily={fontFamily(lang, highlighted ? 700 : 500)}
          fill={highlighted ? c.ink : c.inkMuted}
          textAnchor={side === 'left' ? 'end' : 'start'}
          stroke={layer === 'halo' ? c.mapGround : undefined}
          strokeWidth={layer === 'halo' ? 3.5 : 0}
        >
          {label}
        </SvgText>
      ))}
    </G>
  );
}
