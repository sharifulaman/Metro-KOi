import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { space as spaceScale } from '@/theme/tokens';
import { MAX_CONTENT_W, useResponsive } from '@/theme/useResponsive';
import { useTheme } from '@/theme/useTheme';

import type { DividerProps, ScreenProps, SpacerProps } from './types';

export function Divider({ inset = 0 }: DividerProps) {
  const { c } = useTheme();
  return <View style={{ height: 1, backgroundColor: c.divider, marginLeft: spaceScale[inset] }} />;
}

export function Spacer({ size = 4, flex }: SpacerProps) {
  return <View style={flex ? { flex: 1 } : { height: spaceScale[size], width: spaceScale[size] }} />;
}

/** Safe area + app background (spec §9.4 `Screen`). */
export function Screen({ children, scroll, bleed, gap = 4, withTabBar, testID }: ScreenProps) {
  const { c, space, size } = useTheme();
  const insets = useSafeAreaInsets();
  const { gutter } = useResponsive();
  const bottom = (withTabBar ? size.tabBar : 0) + insets.bottom + space[4];
  if (bleed) {
    return (
      <View testID={testID} style={{ flex: 1, backgroundColor: c.bg }}>
        {children}
      </View>
    );
  }
  const pad = { paddingTop: insets.top + space[3], paddingHorizontal: gutter, paddingBottom: bottom, gap: space[gap], width: '100%' as const, maxWidth: MAX_CONTENT_W, alignSelf: 'center' as const };
  return (
    <View testID={testID} style={{ flex: 1, backgroundColor: c.bg }}>
      {scroll ? (
        <ScrollView contentContainerStyle={pad} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, pad]}>{children}</View>
      )}
    </View>
  );
}

export type { DividerProps, ScreenProps, SpacerProps } from './types';
