import { Pressable, View } from 'react-native';

import { useTheme } from '@/theme/useTheme';

import { Icon } from '../Icon';
import { Text } from '../Text';

import type { ListRowProps } from './types';

export function ListRow({ title, subtitle, leading, trailing, height = 'row', divider, chevron, highlighted, onPress, testID, accessibilityLabel }: ListRowProps) {
  const { c, size, space, radius } = useTheme();
  return (
    <Pressable
      testID={testID}
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel ?? [title, subtitle].filter(Boolean).join(', ')}
      style={({ pressed }) => ({
        minHeight: size[height],
        flexDirection: 'row',
        alignItems: 'center',
        gap: space[3],
        paddingVertical: space[2],
        paddingHorizontal: highlighted ? space[3] : 0,
        borderRadius: highlighted ? radius.tile : 0,
        backgroundColor: highlighted ? c.brandTint : 'transparent',
        borderBottomWidth: divider ? 1 : 0,
        borderBottomColor: c.divider,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      {leading}
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="body" weight={600} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="label" tone="muted" numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing}
      {chevron ? <Icon name="chevron" tone="muted" size={18} /> : null}
    </Pressable>
  );
}

export type { ListRowProps } from './types';
