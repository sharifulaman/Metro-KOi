import { View } from 'react-native';

import { useTheme } from '@/theme/useTheme';

import { Card } from '../../ui/Card';
import { Text } from '../../ui/Text';

import type { SummaryCardProps } from './types';

/** Preset of Card tone=brand with two stats. */
export function SummaryCard({ title, stats, testID }: SummaryCardProps) {
  const { space, c } = useTheme();
  return (
    <Card tone="brand" radius="hero" padding={5} gap={3} testID={testID}>
      {title ? (
        <Text variant="label" tone="onBrand" weight={600}>
          {title}
        </Text>
      ) : null}
      <View style={{ flexDirection: 'row', gap: space[4] }}>
        {stats.map((s, i) => (
          <View key={s.label} style={{ flex: 1, gap: 2, borderLeftWidth: i === 1 ? 1 : 0, borderLeftColor: c.onBrand, paddingLeft: i === 1 ? space[4] : 0, opacity: 1 }}>
            <Text variant="display" tone="onBrand" numeric>
              {s.value}
            </Text>
            <Text variant="label" tone="onBrand">
              {s.label}
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

export type { SummaryCardProps, SummaryStat } from './types';
