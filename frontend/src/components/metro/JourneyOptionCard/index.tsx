import { Pressable, View } from 'react-native';

import { useTheme } from '@/theme/useTheme';

import { StatusBadge } from '../../ui/StatusBadge';
import { Text } from '../../ui/Text';

import type { JourneyOptionCardProps } from './types';

/**
 * One train for a From → To trip (board 6). `best`: outlined card with
 * depart ──── arrive and a platform/fare footer; otherwise a compact row.
 */
export function JourneyOptionCard({ depart, arrive, waitText, arriveText, source, best, bestLabel, footerLeft, footerRight, onPress, testID }: JourneyOptionCardProps) {
  const { c, space, radius } = useTheme();
  const a11y = [depart, waitText, arrive, arriveText].join(', ');
  if (!best) {
    return (
      <Pressable
        testID={testID}
        disabled={!onPress}
        onPress={onPress}
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={a11y}
        style={{ flexDirection: 'row', alignItems: 'center', gap: space[3], backgroundColor: c.surface, borderRadius: radius.card, paddingVertical: space[3], paddingHorizontal: space[4] }}
      >
        <View style={{ minWidth: 64 }}>
          <Text variant="title" weight={700} numeric>
            {depart}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="label" tone="muted" numeric>
            {arriveText}
          </Text>
          <Text variant="label" tone="muted" numeric>
            {waitText}
          </Text>
        </View>
        <StatusBadge kind={source === 'live' ? 'live' : 'estimated'} />
      </Pressable>
    );
  }
  return (
    <Pressable
      testID={testID}
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={a11y}
      style={{ backgroundColor: c.surface, borderRadius: radius.card, paddingVertical: space[4], paddingHorizontal: space[4], borderWidth: 2, borderColor: c.brand, gap: space[3] }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        {bestLabel ? (
          <View style={{ backgroundColor: c.brandTint, borderRadius: radius.chip, paddingHorizontal: space[3], paddingVertical: 3 }}>
            <Text variant="micro" weight={700} tone="brand">
              {bestLabel}
            </Text>
          </View>
        ) : (
          <View />
        )}
        <StatusBadge kind={source === 'live' ? 'live' : 'estimated'} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[3] }}>
        <View>
          <Text variant="heading" weight={700} numeric>
            {depart}
          </Text>
          <Text variant="micro" tone="muted" numeric>
            {waitText}
          </Text>
        </View>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: space[1] }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.brandDeep }} />
          <View style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: c.brand }} />
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.brandDeep }} />
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text variant="heading" weight={700} numeric>
            {arrive}
          </Text>
          <Text variant="micro" tone="muted">
            {arriveText}
          </Text>
        </View>
      </View>
      {footerLeft || footerRight ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: space[3], paddingTop: space[3], borderTopWidth: 1, borderTopColor: c.surfaceAlt }}>
          <Text variant="label" tone="muted" numeric>
            {footerLeft ?? ''}
          </Text>
          {footerRight ? (
            <Text variant="label" weight={600} numeric>
              {footerRight}
            </Text>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
}

export type { JourneyOptionCardProps } from './types';
