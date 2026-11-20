import { Pressable, View } from 'react-native';

import { MAX_CONTENT_W, useResponsive } from '@/theme/useResponsive';
import { useTheme } from '@/theme/useTheme';

import { Text } from '../../ui/Text';

import { TabIcon } from './icons';
import { TAB_KEYS, type TabBarProps, type TabKey } from './types';

const BAR_H = 64;
const LIFT = 22;

/**
 * The single tab bar: a floating glass capsule over the page. Inactive tabs are
 * icon-only; the active one grows into a tinted pill with its label (design nav).
 * Positioned absolutely, so screens leave room with `Screen withTabBar`.
 */
export function TabBar({ active, onSelect, labels, bottomInset = 0, testID }: TabBarProps) {
  const { c, space, shadow } = useTheme();
  const { width, narrow, compact } = useResponsive();
  const edge = narrow ? 10 : 16;
  const side = Math.max(edge, (width - MAX_CONTENT_W) / 2);
  const slot = narrow ? 40 : 48;
  return (
    <View
      testID={testID}
      accessibilityRole="tablist"
      pointerEvents="box-none"
      style={[
        {
          position: 'absolute',
          left: side,
          right: side,
          bottom: LIFT + bottomInset,
          height: BAR_H,
          paddingHorizontal: narrow ? space[1] : space[2],
          borderRadius: BAR_H / 2,
          backgroundColor: c.glass,
          borderWidth: 1,
          borderColor: c.glassBorder,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        shadow.float,
      ]}
    >
      {TAB_KEYS.map((k: TabKey) => {
        const sel = k === active;
        return (
          <Pressable
            key={k}
            testID={`tab-${k}`}
            accessibilityRole="tab"
            accessibilityState={{ selected: sel }}
            accessibilityLabel={labels[k]}
            onPress={() => onSelect(k)}
            style={({ pressed }) => ({
              height: 48,
              // inactive tabs are fixed icon slots; the active pill takes what is left and never pushes the bar wider
              width: sel ? undefined : slot,
              minWidth: sel ? slot : undefined,
              flexShrink: sel ? 1 : 0,
              paddingHorizontal: sel ? (compact ? space[3] : space[4]) : 0,
              borderRadius: 24,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: compact ? 5 : 7,
              backgroundColor: sel ? c.brandTint : 'transparent',
              borderWidth: sel ? 1 : 0,
              borderColor: c.brandLine,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <TabIcon name={k} color={sel ? c.brandDeep : c.ink} size={sel ? 23 : 25} />
            {sel ? (
              <View style={{ flexShrink: 1, minWidth: 0 }}>
                <Text variant="label" weight={700} tone="brand" numberOfLines={1}>
                  {labels[k]}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

export { TAB_KEYS } from './types';
export type { TabBarProps, TabKey } from './types';
