import { Pressable } from 'react-native';

import { useTheme } from '@/theme/useTheme';

import { Icon } from '../Icon';
import { Text } from '../Text';

import type { IconButtonProps } from './types';

export function IconButton({ icon, label, onPress, elevated, active, size = 'md', testID, accessibilityLabel }: IconButtonProps) {
  const { c, size: sz, shadow } = useTheme();
  const d = size === 'sm' ? 44 : sz.iconBtn;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: !!active }}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [
        {
          width: d,
          height: d,
          borderRadius: d / 2,
          backgroundColor: active ? c.brandTint : c.surface,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.8 : 1,
        },
        elevated ? shadow.float : null,
      ]}
    >
      {label ? (
        <Text variant="label" weight={700} tone={active ? 'brand' : 'ink'}>
          {label}
        </Text>
      ) : (
        <Icon name={icon} tone={active ? 'brand' : 'ink'} />
      )}
    </Pressable>
  );
}

export type { IconButtonProps } from './types';
