import { Pressable, View } from 'react-native';

import { useTheme } from '@/theme/useTheme';

import { Badge } from '../../ui/Badge';
import { Icon } from '../../ui/Icon';
import { Text } from '../../ui/Text';

import type { NearestBannerProps } from './types';

/** Banner above the stations list: your nearest station and its next train, or "service has ended" (design ১৩/১৪). */
export function NearestBanner({ mode, caption, title, subtitle, eta, onPress, testID }: NearestBannerProps) {
  const { c } = useTheme();
  const nearest = mode === 'nearest';
  return (
    <Pressable
      testID={testID}
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={[caption, title, subtitle, eta?.label].filter(Boolean).join(', ')}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: nearest ? 10 : 12, borderRadius: 20, backgroundColor: nearest ? c.brandTint : c.surfaceAlt, opacity: pressed ? 0.85 : 1 })}
    >
      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: nearest ? c.brandSolid : c.surface, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={nearest ? 'locate' : 'moon'} size={21} color={nearest ? c.onBrandSolid : c.ink} strokeWidth={nearest ? 2.2 : 2} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        {nearest ? (
          <Text size={12} lh={1.3} weight={600} color={c.onBrandTint}>
            {caption}
          </Text>
        ) : null}
        <Text size={nearest ? 17 : 15.5} lh={1.35} weight={700} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text size={12.5} lh={nearest ? 1.35 : 1.4} weight={400} tone="muted" numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {eta ? (
        <View style={{ alignItems: 'flex-end' }}>
          <Text size={19} lh={1.2} weight={700} numeric>
            {eta.label}
          </Text>
          <Badge label={eta.badge} tone={eta.live ? 'live' : 'neutral'} />
        </View>
      ) : null}
    </Pressable>
  );
}

export type { NearestBannerProps } from './types';
