import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useResponsive } from '@/theme/useResponsive';
import { useTheme } from '@/theme/useTheme';

import { Icon } from '../../ui/Icon';
import { Text } from '../../ui/Text';

import type { NavHeaderProps } from './types';

function Round({ icon, label, onPress }: { icon: 'back' | 'close' | 'add'; label: string; onPress(): void }) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({ width: 46, height: 46, borderRadius: 23, borderWidth: 1.5, borderColor: c.outline, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.8 : 1 })}
    >
      <Icon name={icon} size={22} />
    </Pressable>
  );
}

/** Page header of the card flow: round back/close button, centred 18px title, optional round action (design: 22px top, 20px sides). */
export function NavHeader({ left, title, right, testID }: NavHeaderProps) {
  const insets = useSafeAreaInsets();
  const { gutter } = useResponsive();
  return (
    <View testID={testID} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: insets.top + 22, paddingHorizontal: gutter }}>
      {left ? <Round {...left} /> : <View style={{ width: 46 }} />}
      <View style={{ flex: 1, minWidth: 0, paddingHorizontal: 8 }}>
        <Text size={18} lh={1.35} weight={700} numberOfLines={2} align="center">
          {title}
        </Text>
      </View>
      {right ? <Round {...right} /> : <View style={{ width: 46 }} />}
    </View>
  );
}

export type { NavHeaderProps } from './types';
