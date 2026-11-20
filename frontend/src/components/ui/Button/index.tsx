import { ActivityIndicator, Pressable, View } from 'react-native';

import { useResponsive } from '@/theme/useResponsive';
import { useTheme } from '@/theme/useTheme';

import { Icon } from '../Icon';
import { Text, type TextTone } from '../Text';

import type { ButtonProps } from './types';

export function Button({ label, onPress, variant = 'primary', size = 'lg', height, icon, fullWidth, loading, disabled, floating, testID, accessibilityLabel }: ButtonProps) {
  const { c, radius, size: sz, shadow, space } = useTheme();
  const { compact } = useResponsive();
  const bg = variant === 'primary' ? c.brandSolid : variant === 'secondary' ? c.surface : 'transparent';
  const border = variant === 'secondary' ? c.outline : 'transparent';
  const fg = variant === 'primary' ? c.onBrandSolid : undefined;
  const tone: TextTone = variant === 'primary' ? 'onBrand' : variant === 'dangerText' ? 'danger' : variant === 'ghost' ? 'brand' : 'ink';
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        {
          minHeight: height ?? (size === 'lg' ? sz.button : sz.buttonMd),
          paddingHorizontal: compact ? space[3] : space[5],
          paddingVertical: space[2],
          borderRadius: (height ?? (size === 'lg' ? sz.button : sz.buttonMd)) / 2,
          backgroundColor: bg,
          borderWidth: variant === 'secondary' ? 1.5 : 0,
          borderColor: border,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          justifyContent: 'center',
          opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
        },
        floating ? shadow.float : null,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space[2], flexShrink: 1 }}>
        {loading ? (
          <ActivityIndicator color={variant === 'primary' ? c.onBrandSolid : c.brand} />
        ) : (
          icon && <Icon name={icon} size={20} tone={tone} color={fg} />
        )}
        <View style={{ flexShrink: 1, minWidth: 0 }}>
          <Text size={16} lh={1.35} weight={600} tone={tone} numberOfLines={2} color={fg} align="center">
            {label}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export type { ButtonProps, ButtonVariant } from './types';
