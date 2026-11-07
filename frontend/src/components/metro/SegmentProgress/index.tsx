import { View } from 'react-native';

import { useTheme } from '@/theme/useTheme';

import { Icon } from '../../ui/Icon';
import { Text } from '../../ui/Text';

import type { SegmentProgressProps } from './types';

/** Train between two stations: "Farmgate ──●──── Karwan Bazar". */
export function SegmentProgress({ fromLabel, toLabel, progress, direction, caption, testID }: SegmentProgressProps) {
  const { c, space } = useTheme();
  const color = direction === 'SB' ? c.trainSB : c.trainNB;
  const p = Math.max(0, Math.min(1, progress));
  return (
    <View testID={testID} accessibilityLabel={[fromLabel, toLabel, caption].filter(Boolean).join(' → ')} style={{ gap: space[2] }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: space[3] }}>
        <Text variant="label" tone="muted" numberOfLines={1}>
          {fromLabel}
        </Text>
        <Text variant="label" weight={700} numberOfLines={1}>
          {toLabel}
        </Text>
      </View>
      <View style={{ height: 22, justifyContent: 'center' }}>
        <View style={{ height: 6, borderRadius: 3, backgroundColor: c.surfaceAlt }} />
        <View style={{ position: 'absolute', left: 0, width: `${p * 100}%`, height: 6, borderRadius: 3, backgroundColor: color }} />
        <View style={{ position: 'absolute', left: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: c.surface, borderWidth: 3, borderColor: color }} />
        <View style={{ position: 'absolute', right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: c.surface, borderWidth: 3, borderColor: p >= 1 ? color : c.outline }} />
        <View
          style={{
            position: 'absolute',
            left: `${p * 100}%`,
            marginLeft: -11,
            width: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: color,
            borderWidth: 2,
            borderColor: c.surface,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="train" size={12} color={c.onBrand} />
        </View>
      </View>
      {caption ? (
        <Text variant="label" tone="muted" numeric>
          {caption}
        </Text>
      ) : null}
    </View>
  );
}

export type { SegmentProgressProps } from './types';
