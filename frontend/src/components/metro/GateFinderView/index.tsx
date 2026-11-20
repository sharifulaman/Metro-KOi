import { Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MAX_CONTENT_W, useResponsive } from '@/theme/useResponsive';
import { useTheme } from '@/theme/useTheme';

import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { IconButton } from '../../ui/IconButton';
import { IconTile } from '../../ui/IconTile';
import { Text } from '../../ui/Text';

import type { GateFinderViewProps } from './types';

const MAP_H = 240;
const blur = Platform.OS === 'web' ? ({ backdropFilter: 'blur(12px)' } as object) : {};

/** Step 1 of the exit-gate flow: choose the station and the gate on the real map (3D on request), then start the tracker. */
export function GateFinderView(p: GateFinderViewProps) {
  const { c } = useTheme();
  const { gutter } = useResponsive();
  const insets = useSafeAreaInsets();
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
            <View style={{ width: 18, height: 4, borderRadius: 2, backgroundColor: c.outline }} />
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${p.stationCaption}: ${p.stationName}. ${p.changeLabel}`}
          onPress={p.onChangeStation}
          style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 20, backgroundColor: c.surface, borderWidth: 1, borderColor: c.outline, opacity: pressed ? 0.85 : 1 })}
        >
          <IconTile icon="train" tone="brand" />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text variant="label" tone="muted" numberOfLines={1}>
              {p.stationCaption}
            </Text>
            <Text size={19} lh={1.3} weight={700} numberOfLines={2}>
              {p.stationName}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            <Text variant="label" weight={700} tone="brand">
              {p.changeLabel}
            </Text>
            <Icon name="chevron" size={18} tone="brand" />
          </View>
        </Pressable>

        {p.nearestNote ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 }}>
            <Icon name="pin" size={16} tone="muted" />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text variant="label" tone="muted">
                {p.nearestNote}
              </Text>
            </View>
          </View>
        ) : null}

        <View style={{ height: MAP_H, borderRadius: 20, overflow: 'hidden', backgroundColor: c.mapGround, borderWidth: 1, borderColor: c.outline }}>
          <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>{p.map}</View>
          <Pressable
            testID="gate-3d-toggle"
            accessibilityRole="button"
            accessibilityLabel={p.view3d.label}
            accessibilityState={{ selected: p.view3d.active }}
            onPress={p.view3d.onPress}
            style={[
              { position: 'absolute', top: 10, right: 10, minWidth: 46, height: 46, paddingHorizontal: 8, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: p.view3d.active ? c.brandSolid : c.glassMap, boxShadow: '0 4px 14px rgba(14,26,22,0.16)' },
              blur,
            ]}
          >
            <Text size={14} lh={1.2} weight={700} color={p.view3d.active ? c.onBrandSolid : c.ink}>
              {p.view3d.active ? '2D' : '3D'}
            </Text>
          </Pressable>
          {p.mapNote ? (
            <View style={{ position: 'absolute', left: 8, bottom: 8, paddingVertical: 2, paddingHorizontal: 8, borderRadius: 999, backgroundColor: c.glassMap, maxWidth: '70%' }}>
              <Text size={11} lh={1.3} weight={600} tone="muted" numberOfLines={2}>
                {p.mapNote}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={{ gap: 8 }}>
          {p.gates.map((g) => (
            <Pressable
              key={g.gate}
              testID={'gate-row-' + g.gate}
              accessibilityRole="button"
              accessibilityState={{ selected: g.selected }}
              onPress={g.onPress}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                padding: 12,
                minHeight: 64,
                borderRadius: 20,
                backgroundColor: g.selected ? c.surface : c.surfaceAlt,
                borderWidth: 1.5,
                borderColor: g.selected ? c.brand : 'transparent',
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: g.selected ? c.brandTint : c.surface, alignItems: 'center', justifyContent: 'center' }}>
                <Text size={18} lh={1.2} weight={700} color={g.selected ? c.onBrandTint : c.ink}>
                  {g.gate}
                </Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                {g.selected && g.tag ? (
                  <Text size={11} lh={1.3} weight={700} color={c.onBrandTint} numberOfLines={1}>
                    {g.tag}
                  </Text>
                ) : null}
                <Text weight={700} numberOfLines={2}>
                  {g.name}
                </Text>
                {g.area ? (
                  <Text variant="label" tone="muted" numberOfLines={2}>
                    {g.area}
                  </Text>
                ) : null}
              </View>
              {g.selected ? <Icon name="check" size={20} tone="brand" /> : null}
            </Pressable>
          ))}
        </View>

        <Button label={p.actionLabel} icon="walk" fullWidth onPress={p.onAction} testID="gate-finder-go" />

        {p.footnote ? (
          <Text size={12} lh={1.4} tone="muted" align="center">
            {p.footnote}
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

export type { GateFinderGate, GateFinderViewProps } from './types';
