import { Pressable, View } from 'react-native';

import { useTheme } from '@/theme/useTheme';

import { Icon } from '../../ui/Icon';
import { Text } from '../../ui/Text';

import type { RideBannerProps } from './types';

/** Persistent "Sharing location" indicator with one-tap stop (spec §8). Green while the position is really being shared, ash-grey while it is not (checking, offline). */
export function RideBanner({ title, subtitle, onStop, stopLabel, onPress, live = true, testID }: RideBannerProps) {
  const { c, space, radius, shadow } = useTheme();
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={[{ flexDirection: 'row', alignItems: 'center', gap: space[3], padding: space[3], borderRadius: radius.card, backgroundColor: live ? c.brandDeep : c.estimated }, shadow.float]}
    >
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c.onBrand, opacity: live ? 1 : 0.55 }} />
      <View style={{ flex: 1 }}>
        <Text variant="label" tone="inverse" weight={700} numberOfLines={1}>
          {title}
        </Text>
        <Text variant="micro" tone="inverse" numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={stopLabel}
        onPress={onStop}
        hitSlop={8}
        style={{ flexDirection: 'row', alignItems: 'center', gap: space[1], paddingHorizontal: space[3], minHeight: 40, borderRadius: radius.chip, backgroundColor: c.danger }}
      >
        <Icon name="stop" size={16} tone="onBrand" />
        <Text variant="label" weight={700} tone="onBrand">
          {stopLabel}
        </Text>
      </Pressable>
    </Pressable>
  );
}

export type { RideBannerProps } from './types';
