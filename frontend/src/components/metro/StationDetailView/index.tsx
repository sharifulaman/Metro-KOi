import { Image, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { useTheme } from '@/theme/useTheme';

import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { Text } from '../../ui/Text';

import type { StationDetailViewProps } from './types';

const ART = require('../../../../assets/maps/live-station.webp');
const blur = Platform.OS === 'web' ? ({ backdropFilter: 'blur(12px)' } as object) : {};

/** Station detail (design ১৫): 3D map header, both directions' next trains, facts, journey / 3D buttons. */
export function StationDetailView(p: StationDetailViewProps) {
  const { c, size } = useTheme();
  const insets = useSafeAreaInsets();
  const glass = { position: 'absolute' as const, top: 22 + insets.top, width: 46, height: 46, borderRadius: 23, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: c.glassMap, boxShadow: '0 4px 14px rgba(14,26,22,0.16)' };
  return (
    <View testID={p.testID} style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: size.tabBar + insets.bottom + 40 }}>
        <View style={{ height: 262, overflow: 'hidden' }}>
          {p.map ? <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>{p.map}</View> : <Image source={ART} resizeMode="stretch" style={{ position: 'absolute', left: 0, top: -70, width: '100%', height: 844 }} />}
          <Svg width="100%" height={70} pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }} preserveAspectRatio="none">
            <Defs>
              <LinearGradient id="sdfade" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={c.bg} stopOpacity={0} />
                <Stop offset="1" stopColor={c.bg} stopOpacity={1} />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="70" fill="url(#sdfade)" />
          </Svg>
          {p.trainTag && !p.map ? (
            <View style={{ position: 'absolute', left: 0, right: 0, top: 168 - 24, alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 3, paddingHorizontal: 10, borderRadius: 999, backgroundColor: '#0B0F0E', borderWidth: 1.5, borderColor: '#F2C230' }}>
                <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#F59E0B' }} />
                <Text size={11.5} lh={1.3} weight={700} color="#FFFFFF">
                  {p.trainTag}
                </Text>
              </View>
            </View>
          ) : null}
          <Pressable accessibilityRole="button" accessibilityLabel={p.backLabel} onPress={p.onBack} style={[glass, { left: 16 }, blur]}>
            <Icon name="back" size={22} color="#0E1A16" />
          </Pressable>
          {p.tilt ? (
            <Pressable accessibilityRole="button" accessibilityLabel={p.tilt.label} accessibilityState={{ selected: p.tilt.active }} onPress={p.tilt.onPress} style={[glass, { right: 72, backgroundColor: p.tilt.active ? c.brandSolid : c.glassMap }, blur]}>
              <Text size={14} lh={1.2} weight={700} color={p.tilt.active ? c.onBrandSolid : '#0E1A16'}>
                {p.tilt.active ? '2D' : '3D'}
              </Text>
            </Pressable>
          ) : null}
          <Pressable accessibilityRole="button" accessibilityLabel={p.favouriteLabel} onPress={p.onFavourite} style={[glass, { right: 16 }, blur]}>
            <Icon name="star" size={22} color={p.favourite ? '#F2A900' : '#0E1A16'} />
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: -2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 28, height: 28, borderRadius: 9, backgroundColor: c.brandSolid, alignItems: 'center', justifyContent: 'center' }}>
              <Text size={14} lh={1.2} weight={700} color={c.onBrandSolid} numeric>
                {p.order}
              </Text>
            </View>
            <Text size={13} lh={1.4} weight={600} tone="muted">
              {p.lineLine}
            </Text>
          </View>
          <Text size={32} lh={1.25} weight={700}>
            {p.name}
          </Text>

          {p.dirs.map((d, di) => (
            <View key={d.key} testID={'platform-' + d.key} style={{ marginTop: di === 0 ? 24 : 12, padding: 12, borderRadius: 22, backgroundColor: c.surface, borderWidth: 1, borderColor: c.outline }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingHorizontal: 2 }}>
                <Text size={15} lh={1.4} weight={700}>
                  {d.title}
                </Text>
                <View style={{ paddingVertical: 3, paddingHorizontal: 10, borderRadius: 999, backgroundColor: c.surfaceAlt }}>
                  <Text size={12.5} lh={1.4} weight={600} tone="muted">
                    {d.platform}
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {d.tiles.slice(0, 3).map((tile, i) => (
                  <View key={i} style={{ flex: i === 0 ? 1.35 : 1, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 16, backgroundColor: tile.live ? c.liveTint : c.surfaceAlt }}>
                    <Text size={i === 0 ? 22 : 17} lh={1.25} weight={700} tone={tile.live ? 'live' : 'muted'} numeric numberOfLines={1}>
                      {tile.value}
                    </Text>
                    <Text size={11.5} lh={1.3} weight={600} tone={tile.live ? 'live' : 'muted'}>
                      {tile.caption}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ))}

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
            {p.facts.map((f) => (
              <Pressable key={f.label} disabled={!f.onPress} onPress={f.onPress} accessibilityRole={f.onPress ? 'button' : undefined} style={{ flex: 1, gap: 2, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 16, backgroundColor: c.surfaceAlt }}>
                <Icon name={f.icon} size={19} color={c.brandSolid} strokeWidth={2.1} />
                <Text size={15} lh={1.3} weight={700} numberOfLines={1}>
                  {f.value}
                </Text>
                <Text size={11.5} lh={1.3} tone="muted" numberOfLines={1}>
                  {f.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
            <View style={{ flex: 1.4 }}>
              <Button label={p.journeyLabel} icon="route" fullWidth height={52} onPress={p.onJourney} />
            </View>
            <View style={{ flex: 1 }}>
              <Button label={p.view3dLabel} icon="layers" variant="secondary" fullWidth height={52} onPress={p.onView3d} />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

export type { StationDetailViewProps } from './types';
