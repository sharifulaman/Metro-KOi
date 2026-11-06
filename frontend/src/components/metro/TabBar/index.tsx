import { Pressable, View } from 'react-native';

import { useTheme } from '@/theme/useTheme';

import { Icon, type IconName } from '../../ui/Icon';
import { Text } from '../../ui/Text';

import { TAB_KEYS, type TabBarProps, type TabKey } from './types';

const ICONS: Record<TabKey, IconName> = { live: 'map', stations: 'list', journey: 'route', card: 'card', more: 'more' };

/** The single tab bar — rendered once, by the tab navigator. */
export function TabBar({ active, onSelect, labels, bottomInset = 0, testID }: TabBarProps) {
  const { c, size, space, radius } = useTheme();
  return (
    <View
      testID={testID}
      accessibilityRole="tablist"
      style={{
        flexDirection: 'row',
        minHeight: size.tabBar + bottomInset,
        paddingBottom: bottomInset,
        paddingHorizontal: space[2],
        backgroundColor: c.surface,
        borderTopWidth: 1,
        borderTopColor: c.divider,
      }}
    >
      {TAB_KEYS.map((k) => {
        const sel = k === active;
        return (
          <Pressable
            key={k}
            testID={`tab-${k}`}
            accessibilityRole="tab"
            accessibilityState={{ selected: sel }}
            accessibilityLabel={labels[k]}
            onPress={() => onSelect(k)}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: space[1] }}
          >
            <View style={{ paddingHorizontal: space[4], paddingVertical: space[1], borderRadius: radius.chip, backgroundColor: sel ? c.brandTint : 'transparent' }}>
              <Icon name={ICONS[k]} tone={sel ? 'brand' : 'muted'} size={22} />
            </View>
            <Text variant="micro" weight={sel ? 700 : 500} tone={sel ? 'brand' : 'muted'} numberOfLines={1}>
              {labels[k]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export { TAB_KEYS } from './types';
export type { TabBarProps, TabKey } from './types';
