import { View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import { useTheme } from '@/theme/useTheme';

import { Text } from '../../ui/Text';

import type { LegendKind, MapLegendProps } from './types';

function Swatch({ kind }: { kind: LegendKind }) {
  const { c } = useTheme();
  return (
    <Svg width={26} height={14} viewBox="0 0 26 14">
      {kind === 'estimated' ? (
        <Rect x={1.5} y={3} width={23} height={8} rx={3} fill="none" stroke={c.estimated} strokeWidth={1.2} strokeDasharray="3 2" />
      ) : (
        <Rect x={1} y={2} width={24} height={10} rx={5} fill="none" stroke={kind === 'dwell' ? c.brand : c.live} strokeWidth={kind === 'dwell' ? 2.4 : 2} />
      )}
    </Svg>
  );
}

/** Key to the train outlines on the map: live, standing at a station, estimated. */
export function MapLegend({ items, testID }: MapLegendProps) {
  const { c, space, shadow } = useTheme();
  return (
    <View testID={testID} accessibilityRole="summary" style={[{ gap: 6, borderRadius: 14, paddingHorizontal: 10, paddingVertical: space[2], backgroundColor: c.surface, alignSelf: 'flex-start' }, shadow.card]}>
      {items.map((it) => (
        <View key={it.kind} style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
          <Swatch kind={it.kind} />
          <Text variant="micro" tone="muted">
            {it.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

export type { LegendKind, MapLegendProps } from './types';
