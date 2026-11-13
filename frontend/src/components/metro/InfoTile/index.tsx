import { Pressable } from 'react-native';

import { useTheme } from '@/theme/useTheme';

import { Icon } from '../../ui/Icon';
import { Text } from '../../ui/Text';

import type { InfoTileProps } from './types';

/** Small fact tile (icon, value, label) — three sit in a row on the station detail page. */
export function InfoTile({ icon, value, label, onPress, testID }: InfoTileProps) {
  const { c, space, radius } = useTheme();
  return (
    <Pressable
      testID={testID}
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${value}, ${label}`}
      style={({ pressed }) => ({ flex: 1, gap: 2, paddingVertical: space[2] + 2, paddingHorizontal: space[3], borderRadius: radius.note - 2, backgroundColor: c.surfaceAlt, opacity: pressed ? 0.85 : 1 })}
    >
      <Icon name={icon} size={18} tone="brand" />
      <Text weight={700} numberOfLines={1}>
        {value}
      </Text>
      <Text variant="micro" tone="muted" numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

export type { InfoTileProps } from './types';
