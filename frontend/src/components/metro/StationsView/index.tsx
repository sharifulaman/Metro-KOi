import { Pressable, ScrollView, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/useTheme';

import { Icon } from '../../ui/Icon';
import { Text } from '../../ui/Text';
import { NearestBanner } from '../NearestBanner';
import { StationTimeline } from '../StationTimeline';

import type { StationsViewProps } from './types';

/** Stations tab (design ১৩ · ১৪): header, direction switch, search + legend, nearest-station banner, the line as a numbered sheet. */
export function StationsView(p: StationsViewProps) {
  const { c, size } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View testID={p.testID} style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 28, paddingBottom: size.tabBar + insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingLeft: 24, paddingRight: 20 }}>
          <View style={{ flex: 1 }}>
            <Text size={30} lh={1.25} weight={700}>
              {p.title}
            </Text>
            <Text size={14} lh={1.4} weight={400} tone="muted">
              {p.subtitle}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={p.onTimetable}
            style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 7, height: 42, paddingHorizontal: 16, marginTop: 4, borderRadius: 21, borderWidth: 1.5, borderColor: c.outline, backgroundColor: c.surface, opacity: pressed ? 0.85 : 1 })}
          >
            <Icon name="clock" size={18} color={c.onBrandTint} strokeWidth={2.2} />
            <Text size={14.5} lh={1.3} weight={700} color={c.onBrandTint}>
              {p.timetableLabel}
            </Text>
          </Pressable>
        </View>

        <View testID="direction" accessibilityRole="tablist" style={{ flexDirection: 'row', gap: 4, marginTop: 16, marginHorizontal: 20, padding: 4, borderRadius: 24, backgroundColor: c.surfaceAlt }}>
          {p.dirs.map((d, i) => {
            const sel = d.key === p.dir;
            return (
              <Pressable
                key={d.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: sel }}
                onPress={() => p.onDir(d.key)}
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 40, borderRadius: 20, backgroundColor: sel ? c.brandSolid : 'transparent' }}
              >
                <View style={{ transform: [{ rotate: i === 0 ? '90deg' : '0deg' }] }}>
                  <Icon name="arrowUpRight" size={16} color={sel ? c.onBrandSolid : c.inkMuted} strokeWidth={2.4} />
                </View>
                <Text size={14} lh={1.3} weight={700} color={sel ? c.onBrandSolid : c.inkMuted}>
                  {d.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, height: 46, marginTop: 10, marginHorizontal: 20, paddingHorizontal: 16, borderRadius: 23, backgroundColor: c.surface, borderWidth: 1.5, borderColor: c.outline }}>
          <Icon name="search" size={19} color={c.inkMuted} strokeWidth={2.2} />
          <View style={{ flex: 1 }}>
            <Text size={15} lh={1.3} weight={400} tone="muted" numberOfLines={1}>
              {p.searchPlaceholder}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.live }} />
            <Text size={12} lh={1.3} weight={400} tone="muted">
              {p.legendLive}
            </Text>
            <View style={{ width: 8, height: 8, borderRadius: 4, borderWidth: 1.6, borderStyle: 'dashed', borderColor: c.inkMuted, marginLeft: 4 }} />
            <Text size={12} lh={1.3} weight={400} tone="muted">
              {p.legendEstimated}
            </Text>
          </View>
        </View>

        {p.banner ? (
          <View style={{ marginTop: 10, marginHorizontal: 20 }}>
            <NearestBanner {...p.banner} />
          </View>
        ) : null}

        <View style={{ marginTop: 25, marginHorizontal: 16 }}>
          <StationTimeline stations={p.timeline.stations} train={p.timeline.train} labels={p.timeline.labels} testID="timeline" />
          {p.footnote ? (
            <View style={{ marginTop: 12, marginHorizontal: 8 }}>
              <Text size={12} lh={1.4} weight={400} tone="muted" align="center">
                {p.footnote}
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 150 }}>
        <Svg width="100%" height="100%">
          <Defs>
            <LinearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={c.bg} stopOpacity={0} />
              <Stop offset="0.78" stopColor={c.bg} stopOpacity={1} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#fade)" />
        </Svg>
      </View>
    </View>
  );
}

export type { StationsViewProps } from './types';
