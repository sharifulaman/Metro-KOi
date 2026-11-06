import { Pressable } from 'react-native';

import { useTheme } from '@/theme/useTheme';

import type { CardProps } from './types';

export function Card({ children, radius = 'card', tone = 'surface', padding = 4, gap = 0, elevated, onPress, testID, accessibilityLabel }: CardProps) {
  const t = useTheme();
  const bg = tone === 'brand' ? t.c.brandDeep : tone === 'alt' ? t.c.surfaceAlt : t.c.surface;
  return (
    <Pressable
      testID={testID}
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        {
          backgroundColor: bg,
          borderRadius: t.radius[radius],
          padding: t.space[padding],
          gap: t.space[gap],
          opacity: pressed ? 0.9 : 1,
        },
        elevated ? t.shadow.card : null,
      ]}
    >
      {children}
    </Pressable>
  );
}

export type { CardProps } from './types';
