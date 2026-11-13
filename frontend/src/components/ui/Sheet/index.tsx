import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { layout } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

import type { SheetProps } from './types';

/**
 * Bottom sheet surface. Kept dependency-free so it runs in Expo Go; swap the
 * container for @gorhom/bottom-sheet here (and only here) when adding drag snaps.
 */
export function Sheet({ children, handle = true, docked, collapsed, onToggle, peek, gap = 3, maxHeight = layout.dockedSheet, withTabBar, modal, onDismiss, testID }: SheetProps) {
  const { c, radius, space, shadow, size } = useTheme();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const square = docked || modal;
  const sheet = (
    <View
      testID={testID}
      style={[
        {
          backgroundColor: c.surface,
          borderTopLeftRadius: radius.sheet,
          borderTopRightRadius: radius.sheet,
          borderBottomLeftRadius: square ? 0 : radius.sheet,
          borderBottomRightRadius: square ? 0 : radius.sheet,
          paddingHorizontal: space[5],
          paddingBottom: space[4] + (withTabBar ? size.tabBar : 0) + (modal ? insets.bottom : 0),
          maxHeight: docked ? height * maxHeight : modal ? height * 0.9 : undefined,
        },
        shadow.sheet,
      ]}
    >
      {handle ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={collapsed ? 'Expand' : 'Collapse'}
          onPress={onToggle ?? onDismiss}
          disabled={!onToggle && !onDismiss}
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
  if (!modal) return sheet;
  return (
    <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: c.scrim }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onDismiss} style={{ flex: 1 }} />
      {sheet}
    </View>
  );
}

export type { SheetProps } from './types';
