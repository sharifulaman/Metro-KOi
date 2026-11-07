import { Pressable, View } from 'react-native';

import { useTheme } from '@/theme/useTheme';

import { Icon } from '../../ui/Icon';
import { Text } from '../../ui/Text';

import type { SearchPillProps } from './types';

/** Full-width map search bar with the language toggle inside (board 1). */
export function SearchPill({ placeholder, onPress, langLabel, onLangPress, langAccessibilityLabel, testID }: SearchPillProps) {
  const { c, space, radius, size, shadow } = useTheme();
  return (
    <View
      testID={testID}
      style={[
        { flexDirection: 'row', alignItems: 'center', height: 52, borderRadius: radius.control, backgroundColor: c.surface, paddingLeft: space[4], paddingRight: space[2], gap: space[2] },
        shadow.float,
      ]}
    >
      <Pressable onPress={onPress} accessibilityRole="search" accessibilityLabel={placeholder} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: space[2], minHeight: size.touch }}>
        <Icon name="search" tone="muted" />
        <Text tone="muted" numberOfLines={1}>
          {placeholder}
        </Text>
      </Pressable>
      {langLabel ? (
        <Pressable
          onPress={onLangPress}
          accessibilityRole="button"
          accessibilityLabel={langAccessibilityLabel ?? langLabel}
          hitSlop={6}
          style={{ height: 36, borderRadius: 18, backgroundColor: c.surfaceAlt, paddingHorizontal: space[3], justifyContent: 'center' }}
        >
          <Text variant="label" weight={700}>
            {langLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export type { SearchPillProps } from './types';
