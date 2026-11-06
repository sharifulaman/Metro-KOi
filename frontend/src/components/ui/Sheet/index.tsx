import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native';

import { layout } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

import type { SheetProps } from './types';

/**
 * Bottom sheet surface. Kept dependency-free so it runs in Expo Go; swap the
 * container for @gorhom/bottom-sheet here (and only here) when adding drag snaps.
 */
export function Sheet({ children, handle = true, docked, collapsed, onToggle, peek, gap = 3, maxHeight = layout.dockedSheet, testID }: SheetProps) {
  const { c, radius, space, shadow } = useTheme();
  const { height } = useWindowDimensions();
  return (
    <View
      testID={testID}
      style={[
        {
          backgroundColor: c.surface,
          borderTopLeftRadius: radius.sheet,
          borderTopRightRadius: radius.sheet,
          borderBottomLeftRadius: docked ? 0 : radius.sheet,
          borderBottomRightRadius: docked ? 0 : radius.sheet,
          paddingHorizontal: space[5],
          paddingBottom: space[4],
          maxHeight: docked ? height * maxHeight : undefined,
        },
        shadow.sheet,
      ]}
    >
      {handle ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={collapsed ? 'Expand' : 'Collapse'}
          onPress={onToggle}
          disabled={!onToggle}
          style={{ alignItems: 'center', paddingVertical: space[3] }}
        >
          <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: c.outline }} />
        </Pressable>
      ) : (
        <View style={{ height: space[5] }} />
      )}
      {collapsed ? (
        peek
      ) : (
        <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: space[gap] }}>
          {children}
        </ScrollView>
      )}
    </View>
  );
}

export type { SheetProps } from './types';
