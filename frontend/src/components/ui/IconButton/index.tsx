import { Pressable } from 'react-native';

import { useTheme } from '@/theme/useTheme';

import { Icon } from '../Icon';

import type { IconButtonProps } from './types';

export function IconButton({ icon, onPress, elevated, active, testID, accessibilityLabel }: IconButtonProps) {
  const { c, size, shadow } = useTheme();
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
          width: size.iconBtn,
          height: size.iconBtn,
          borderRadius: size.iconBtn / 2,
          backgroundColor: active ? c.brandTint : c.surface,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.8 : 1,
        },
        elevated ? shadow.float : null,
      ]}
    >
      <Icon name={icon} tone={active ? 'brand' : 'ink'} />
    </Pressable>
  );
}

export type { IconButtonProps } from './types';
