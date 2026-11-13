import { View } from 'react-native';

import { useTheme } from '@/theme/useTheme';

import { Card } from '../../ui/Card';
import { Chip } from '../../ui/Chip';
import { Text } from '../../ui/Text';

import type { DirectionEtaCardProps } from './types';

/** Station detail: one direction's platform and its next three trains as tiles (design ১৫). */
export function DirectionEtaCard({ title, platformLabel, tiles, emptyText, testID }: DirectionEtaCardProps) {
  const { c, space, radius } = useTheme();
  return (
    <Card radius="card" padding={3} gap={2} testID={testID}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 2 }}>
        <Text weight={700}>{title}</Text>
        <Chip label={platformLabel} tone="neutral" />
      </View>
      {tiles.length === 0 ? (
        <Text variant="label" tone="muted">
          {emptyText}
        </Text>
      ) : (
        <View style={{ flexDirection: 'row', gap: space[2] }}>
          {tiles.slice(0, 3).map((tile, i) => (
            <View key={i} style={{ flex: i === 0 ? 1.35 : 1, paddingVertical: space[2], paddingHorizontal: space[3], borderRadius: radius.note - 2, backgroundColor: tile.live ? c.liveTint : c.surfaceAlt }}>
              <Text variant={i === 0 ? 'heading' : 'body'} weight={700} tone={tile.live ? 'live' : 'muted'} numeric numberOfLines={1}>
                {tile.value}
              </Text>
              <Text variant="micro" weight={600} tone={tile.live ? 'live' : 'muted'}>
                {tile.caption}
              </Text>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}

export type { DirectionEtaCardProps, EtaTile } from './types';
