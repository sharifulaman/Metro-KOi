import { Pressable, View } from 'react-native';

import { useTheme } from '@/theme/useTheme';

import { Icon } from '../../ui/Icon';
import { Text } from '../../ui/Text';

import type { SearchPillProps } from './types';

/** Full-width search bar: floating over the map, or outlined on a list page, with an optional legend or language toggle inside. */
export function SearchPill({ placeholder, onPress, langLabel, onLangPress, langAccessibilityLabel, legend, outlined, testID }: SearchPillProps) {
  const { c, space, radius, size, shadow } = useTheme();
  return (
    <View
      testID={testID}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          height: outlined ? 46 : 52,
          borderRadius: radius.control,
          backgroundColor: outlined ? c.surface : c.glass,
          borderWidth: outlined ? 1.5 : 0,
          borderColor: c.outline,
          paddingLeft: space[4],
          paddingRight: space[outlined ? 4 : 2],
          gap: space[2],
        },
        outlined ? null : shadow.float,
      ]}
    >
      <Pressable onPress={onPress} accessibilityRole="search" accessibilityLabel={placeholder} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: space[2], minHeight: size.touch }}>
        <Icon name="search" tone="muted" />
        <Text tone="muted" numberOfLines={1}>
          {placeholder}
        </Text>
      </Pressable>
      {legend ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.live }} />
          <Text variant="micro" tone="muted">
            {legend.live}
          </Text>
          <View style={{ width: 8, height: 8, borderRadius: 4, borderWidth: 1.6, borderStyle: 'dashed', borderColor: c.inkMuted, marginLeft: 4 }} />
          <Text variant="micro" tone="muted">
            {legend.estimated}
          </Text>
        </View>
      ) : null}
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
