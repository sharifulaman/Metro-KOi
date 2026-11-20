import { Pressable, View } from 'react-native';

import { useTheme } from '@/theme/useTheme';

import { IconTile } from '../../ui/IconTile';
import { StatusBadge } from '../../ui/StatusBadge';
import { Text } from '../../ui/Text';

import type { NextTrainRowProps } from './types';

/** One direction on the live sheet: train tile, destination, platform / origin, next ETA or departure countdown (design live sheet). */
export function NextTrainRow({ direction, title, subtitle, eta, source = 'schedule', dwell, emptyText, onPress, divider, testID }: NextTrainRowProps) {
  const { c, space, size } = useTheme();
  const spoken = dwell ? `${dwell.caption} ${dwell.countdown}` : eta ?? emptyText;
  return (
    <Pressable
      testID={testID}
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={[direction, title, subtitle, spoken].filter(Boolean).join(', ')}
      style={{ minHeight: size.rowLg, flexDirection: 'row', alignItems: 'center', gap: space[3], paddingVertical: space[2], borderBottomWidth: divider ? 1 : 0, borderBottomColor: c.divider }}
    >
      <IconTile icon="train" tone="brand" />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text weight={700} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="label" tone="muted" numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={{ alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
        {dwell ? (
          <>
            <Text variant="title" weight={700} tone="live" numeric>
              {dwell.countdown}
            </Text>
            <Text variant="micro" weight={700} tone="live">
              {dwell.caption}
            </Text>
            <StatusBadge kind="stop" />
          </>
        ) : eta ? (
          <>
            <Text variant="title" weight={700} numeric>
              {eta}
            </Text>
            <StatusBadge kind={source === 'live' ? 'live' : 'estimated'} />
          </>
        ) : (
          <Text variant="label" tone="muted">
            {emptyText ?? '—'}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

export type { NextTrainRowProps } from './types';
