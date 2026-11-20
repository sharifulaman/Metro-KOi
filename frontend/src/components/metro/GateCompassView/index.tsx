import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { MAX_CONTENT_W, useResponsive } from '@/theme/useResponsive';
import { useTheme } from '@/theme/useTheme';

import { IconButton } from '../../ui/IconButton';
import { Text } from '../../ui/Text';

import type { GateCompassViewProps } from './types';

const DIAL = 210;

/** Step 2 of the exit-gate flow: a plain round dial whose arrow points at the chosen gate, the distance, and the other gates. */
export function GateCompassView(p: GateCompassViewProps) {
  const { c } = useTheme();
  const { gutter, narrow } = useResponsive();
  const insets = useSafeAreaInsets();
  const on = p.arrived || p.ahead;
  const dial = narrow ? 180 : DIAL;
  return (
    <View testID={p.testID} style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 28, paddingHorizontal: gutter, gap: 14, width: '100%', maxWidth: MAX_CONTENT_W, alignSelf: 'center' }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <IconButton icon="back" onPress={p.onBack} accessibilityLabel={p.backLabel} elevated />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text size={22} lh={1.25} weight={700} numberOfLines={2}>
              {p.title}
            </Text>
            <Text variant="label" tone="muted" numberOfLines={2}>
              {p.subtitle}
            </Text>
          </View>
          <View accessibilityElementsHidden style={{ flexDirection: 'row', gap: 4 }}>
            <View style={{ width: 18, height: 4, borderRadius: 2, backgroundColor: c.brand }} />
            <View style={{ width: 18, height: 4, borderRadius: 2, backgroundColor: c.brand }} />
          </View>
        </View>

        <View style={{ alignItems: 'center', gap: 6, padding: 16, borderRadius: 24, backgroundColor: c.surface, borderWidth: 1, borderColor: c.outline }}>
          <Text variant="label" tone="muted" align="center">
            {p.caption}
          </Text>
          <View style={{ width: dial, height: dial, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={dial} height={dial} viewBox="0 0 200 200" style={{ position: 'absolute' }}>
              <Circle cx={100} cy={100} r={94} fill={on ? c.brandTint : c.surfaceAlt} stroke={on ? c.brand : c.outline} strokeWidth={3} />
            </Svg>
            {p.arrived ? (
              <Text size={52} lh={1.1} weight={700} color={c.brandDeep}>
                {p.gate}
              </Text>
            ) : (
              <View style={{ transform: [{ rotate: `${p.rotation ?? 0}deg` }], opacity: p.rotation == null ? 0.25 : 1 }}>
                <Svg width={dial * 0.54} height={dial * 0.64} viewBox="0 0 110 130">
                  <Path d="M55 6 100 118 55 94 10 118Z" fill={p.ahead ? c.brand : c.brandDeep} />
                </Svg>
              </View>
            )}
          </View>
          <Text size={34} lh={1.2} weight={700} numeric align="center">
            {p.distance}
          </Text>
          <View style={{ paddingVertical: 4, paddingHorizontal: 12, borderRadius: 999, backgroundColor: on ? c.brandTint : c.surfaceAlt, maxWidth: '100%' }}>
            <Text variant="label" weight={700} color={on ? c.onBrandTint : c.inkMuted} align="center">
              {p.status}
            </Text>
          </View>
          <Text weight={600} align="center">
            {p.landmark}
          </Text>
        </View>

        <View style={{ gap: 8 }}>
          {p.rows.map((r) => (
            <Pressable
              key={r.gate}
              testID={'gate-compass-' + r.gate}
              accessibilityRole="button"
              accessibilityState={{ selected: r.selected }}
              onPress={r.onPress}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                padding: 10,
                minHeight: 52,
                borderRadius: 16,
                backgroundColor: r.selected ? c.brandTint : c.surface,
                borderWidth: 1.5,
                borderColor: r.selected ? c.brand : c.outline,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: r.selected ? c.brandDeep : c.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
                <Text size={15} lh={1.2} weight={700} color={r.selected ? c.onBrand : c.ink}>
                  {r.gate}
                </Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text weight={600} numberOfLines={2}>
                  {r.name}
                </Text>
              </View>
              {r.distance ? (
                <Text variant="label" weight={700} tone="muted" numeric>
                  {r.distance}
                </Text>
              ) : null}
            </Pressable>
          ))}
        </View>

        {p.footnote ? (
          <Text size={12} lh={1.4} tone="muted" align="center">
            {p.footnote}
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

export type { GateCompassRow, GateCompassViewProps } from './types';
