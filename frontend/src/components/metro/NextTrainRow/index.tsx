import { Pressable, View } from 'react-native';

import { useTheme } from '@/theme/useTheme';

import { StatusBadge } from '../../ui/StatusBadge';
import { Text } from '../../ui/Text';

import type { NextTrainRowProps } from './types';

/** One direction on the live sheet: colour bar, destination, platform, next ETA (board 1). */
export function NextTrainRow({ direction, title, subtitle, eta, source = 'schedule', emptyText, onPress, divider, testID }: NextTrainRowProps) {
  const { c, space, size } = useTheme();
  return (
    <Pressable
      testID={testID}
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={[title, subtitle, eta ?? emptyText].filter(Boolean).join(', ')}
      style={{ minHeight: size.rowLg, flexDirection: 'row', alignItems: 'center', gap: space[3], borderBottomWidth: divider ? 1 : 0, borderBottomColor: c.surfaceAlt }}
    >
      <View style={{ width: 10, height: 36, borderRadius: 5, backgroundColor: direction === 'SB' ? c.trainSB : c.trainNB }} />
      <View style={{ flex: 1 }}>
        <Text weight={600} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="label" tone="muted">
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={{ alignItems: 'flex-end', gap: 2 }}>
        {eta ? (
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
