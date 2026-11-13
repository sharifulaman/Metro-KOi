import { Pressable, View } from 'react-native';

import { useTheme } from '@/theme/useTheme';

import { Icon } from '../../ui/Icon';
import { StatusBadge } from '../../ui/StatusBadge';
import { Text } from '../../ui/Text';

import type { NearestBannerProps } from './types';

/** Banner above the stations list: your nearest station and its next train, or "service has ended" (design ১৩/১৪). */
export function NearestBanner({ mode, caption, title, subtitle, eta, onPress, testID }: NearestBannerProps) {
  const { c, space, radius } = useTheme();
  const nearest = mode === 'nearest';
  return (
    <Pressable
      testID={testID}
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={[caption, title, subtitle, eta?.label].filter(Boolean).join(', ')}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: space[3], padding: space[3], borderRadius: radius.card - 2, backgroundColor: nearest ? c.brandTint : c.surfaceAlt, opacity: pressed ? 0.85 : 1 })}
    >
      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: nearest ? c.brandDeep : c.surface, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={nearest ? 'locate' : 'clock'} size={20} color={nearest ? c.onBrand : c.ink} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        {nearest ? (
          <Text variant="micro" weight={700} tone="brand">
            {caption}
          </Text>
        ) : null}
        <Text variant={nearest ? 'title' : 'body'} weight={700} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="label" tone="muted" numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {eta ? (
        <View style={{ alignItems: 'flex-end', gap: 2 }}>
          <Text variant="title" weight={700} numeric>
            {eta.label}
          </Text>
          <StatusBadge kind={eta.live ? 'live' : 'estimated'} />
        </View>
      ) : null}
    </Pressable>
  );
}

export type { NearestBannerProps } from './types';
