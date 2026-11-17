import { Pressable, View } from 'react-native';

import { useTheme } from '@/theme/useTheme';

import { Text } from '../../ui/Text';
import { BrandMark } from '../BrandMark';

import type { BrandBarProps } from './types';

/** Top row of the Live map: the logo pill on the left, the language toggle on the right. */
export function BrandBar({ title, accent, subtitle, langLabel, onLangPress, langAccessibilityLabel, testID }: BrandBarProps) {
  const { c, space, shadow } = useTheme();
  return (
    <View testID={testID} pointerEvents="box-none" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <View style={[{ flexDirection: 'row', alignItems: 'center', gap: space[2], height: 48, borderRadius: 24, paddingLeft: space[1], paddingRight: space[4], backgroundColor: c.surface }, shadow.float]}>
        <BrandMark size={40} />
        <View>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            <Text variant="body" weight={700}>
              {title}
            </Text>
            <Text variant="body" weight={700} tone="brand">
              {accent}
            </Text>
          </View>
          {subtitle ? (
            <Text variant="micro" tone="muted">
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      {langLabel ? (
        <Pressable
          onPress={onLangPress}
          accessibilityRole="button"
          accessibilityLabel={langAccessibilityLabel ?? langLabel}
          style={({ pressed }) => [{ height: 48, borderRadius: 24, paddingHorizontal: space[4], justifyContent: 'center', backgroundColor: c.surface, opacity: pressed ? 0.85 : 1 }, shadow.float]}
        >
          <Text variant="label" weight={700}>
            {langLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export type { BrandBarProps } from './types';
