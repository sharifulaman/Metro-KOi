import { useState, type ReactNode } from 'react';
import { Image, Platform, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { STAGES, STAGE_ORDER, STAGE_ZOOM, type LiveStage } from '@/data/demoLive';
import { useResponsive } from '@/theme/useResponsive';
import { useTheme } from '@/theme/useTheme';

import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { Text } from '../../ui/Text';

import type { LiveViewProps } from './types';

const ART = {
  overview: require('../../../../assets/maps/live-overview.webp'),
  city: require('../../../../assets/maps/live-city.webp'),
  station: require('../../../../assets/maps/live-station.webp'),
} as const;

const GROUND = '#EFEBE1';
const STAGE_W = 390;
const STAGE_H = 844;

/** web-only frosted glass (ignored on native, where the near-opaque fill carries it) */
const blur = (px: number) => (Platform.OS === 'web' ? ({ backdropFilter: 'blur(' + px + 'px)' } as object) : {});

function Glass({ children, style }: { children: ReactNode; style: object }) {
  const { c } = useTheme();
  return <View style={[{ backgroundColor: c.glassMap, boxShadow: '0 4px 14px rgba(14,26,22,0.16)' }, blur(12), style]}>{children}</View>;
}

function RoundBtn({ top, right = 16, left, size = 44, label, onPress, children }: { top: number; right?: number; left?: number; size?: number; label: string; onPress?(): void; children: ReactNode }) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[
        { position: 'absolute', top, width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: c.glassMap, boxShadow: '0 4px 14px rgba(14,26,22,0.16)' },
        left != null ? { left } : { right },
        blur(12),
      ]}
    >
      {children}
    </Pressable>
  );
}

function MetroTile({ size, radius, bg, color, icon }: { size: number; radius: number; bg: string; color: string; icon: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: radius, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name="train" size={icon} color={color} strokeWidth={2.4} />
    </View>
  );
}

/** A station label pill, bottom-centred on (x, y) of the map stage. */
function StationPin({ x, y, label, selected, big, onPress }: { x: number; y: number; label: string; selected?: boolean; big?: boolean; onPress(): void }) {
  const { c } = useTheme();
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: x - 120, width: 240, bottom: STAGE_H - y, alignItems: 'center' }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingLeft: big ? 6 : 5,
          paddingRight: big ? 12 : 9,
          paddingVertical: big ? 5 : 3,
          borderRadius: 999,
          backgroundColor: selected ? '#066B4A' : 'rgba(255,255,255,0.96)',
          boxShadow: '0 3px 10px rgba(14,26,22,0.22)',
        }}
      >
        <MetroTile size={big ? 20 : 17} radius={6} bg={selected ? '#2BD39A' : c.brand} color={selected ? '#04140E' : '#FFFFFF'} icon={big ? 12 : 11} />
        <Text size={big ? 14 : 12.5} lh={1.3} weight={700} color={selected ? '#FFFFFF' : '#0E1A16'} numberOfLines={1}>
          {label}
        </Text>
      </Pressable>
    </View>
  );
}

function Ring({ x, y, size, live, onPress }: { x: number; y: number; size: number; live: boolean; onPress(): void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{ position: 'absolute', left: x, top: y, width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderStyle: live ? 'solid' : 'dashed', borderColor: live ? '#F59E0B' : '#6B7C75', backgroundColor: live ? 'rgba(245,158,11,0.16)' : 'rgba(255,255,255,0.4)' }}
    />
  );
}

function TrainTag({ x, y, text, live }: { x: number; y: number; text: string; live: boolean }) {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: x - 120, width: 240, bottom: STAGE_H - y, alignItems: 'center' }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 10,
          paddingVertical: 3,
          borderRadius: 999,
          backgroundColor: live ? '#0B0F0E' : 'rgba(255,255,255,0.95)',
          borderWidth: 1.5,
          borderStyle: live ? 'solid' : 'dashed',
          borderColor: live ? '#F2C230' : '#6B7C75',
        }}
      >
        {live ? <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#F59E0B' }} /> : null}
        <Text size={11.5} lh={1.3} weight={700} color={live ? '#FFFFFF' : '#3E4C46'}>
          {text}
        </Text>
      </View>
    </View>
  );
}

function GatePin({ x, y, letter }: { x: number; y: number; letter: string }) {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: x - 15, bottom: STAGE_H - y, width: 30, height: 30 }}>
      <View style={{ width: 30, height: 30, borderTopLeftRadius: 15, borderTopRightRadius: 15, borderBottomRightRadius: 15, borderBottomLeftRadius: 4, transform: [{ rotate: '-45deg' }], backgroundColor: '#066B4A', borderWidth: 2, borderColor: '#FFFFFF', boxShadow: '0 3px 8px rgba(14,26,22,0.35)', alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ transform: [{ rotate: '45deg' }] }}>
          <Text size={13} lh={1} weight={700} color="#FFFFFF">
            {letter}
          </Text>
        </View>
      </View>
    </View>
  );
}

/** Live map (design ১০ · ১১ · ১২): the 3D city at three zoom levels with its pins, trains, controls and next-trains sheet. */
export function LiveView(p: LiveViewProps) {
  const { c, size } = useTheme();
  const { gutter } = useResponsive();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const layout = STAGES[p.stage];
  const stageLeft = (width - STAGE_W) / 2;
  const next = () => p.onStage(STAGE_ORDER[(STAGE_ORDER.indexOf(p.stage) + 1) % STAGE_ORDER.length]);
  const [fav, setFav] = useState(false);
  const station = p.stage === 'station';
  const t = p.text;

  return (
    <View testID={p.testID} style={{ flex: 1, backgroundColor: GROUND, overflow: 'hidden' }}>
      {/* ---- the map art and everything pinned to it ---- */}
      <View style={{ position: 'absolute', top: 0, left: stageLeft, width: STAGE_W, height: STAGE_H }}>
        <Image source={ART[p.stage]} style={{ position: 'absolute', left: 0, top: 0, width: STAGE_W, height: STAGE_H }} resizeMode="stretch" />
        {layout.fade ? (
          <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 230 }}>
            <Svg width="100%" height="100%">
              <Defs>
                <LinearGradient id="topfade" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={GROUND} stopOpacity={1} />
                  <Stop offset="0.45" stopColor={GROUND} stopOpacity={0.85} />
                  <Stop offset="1" stopColor={GROUND} stopOpacity={0} />
                </LinearGradient>
              </Defs>
              <Rect x="0" y="0" width="100%" height="100%" fill="url(#topfade)" />
            </Svg>
          </View>
        ) : null}
        {layout.dots?.map(([x, y]) => (
          <View key={x + '-' + y} pointerEvents="none" style={{ position: 'absolute', left: x, top: y, width: 12, height: 12, borderRadius: 6, backgroundColor: '#FFFFFF', borderWidth: 2.5, borderColor: c.brand, boxShadow: '0 1px 4px rgba(14,26,22,0.3)' }} />
        ))}
        {layout.rings.map((r) => (
          <Ring key={r.x + '-' + r.y} {...r} onPress={() => p.onStage('city')} />
        ))}
        {layout.pills.map((s) => (
          <StationPin key={s.id} x={s.x} y={s.y} label={t.names[s.id] ?? s.id} selected={s.selected} big={s.big} onPress={() => (s.selected ? next() : p.onStage('city'))} />
        ))}
        {layout.tags.map((g) => (
          <TrainTag key={g.id} x={g.x} y={g.y} text={t.tags[g.kind](g.id)} live={g.kind !== 'estimated'} />
        ))}
        {layout.gates?.map((g) => (
          <GatePin key={g.letter} {...g} />
        ))}
        {station ? (
          <View style={{ position: 'absolute', left: 16, top: 396, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.96)', boxShadow: '0 3px 10px rgba(14,26,22,0.2)' }}>
            <Text size={12} lh={1.35} weight={700} color="#0E1A16">
              {t.platformStrong}
              <Text size={12} lh={1.35} weight={500} color="#5B6B65">
                {t.platformRest}
              </Text>
            </Text>
          </View>
        ) : null}
      </View>

      {/* ---- floating controls (screen-relative) ---- */}
      <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
        {station ? (
          <>
            <RoundBtn top={22} left={16} size={46} label={t.back} onPress={() => p.onStage('overview')}>
              <Icon name="back" size={22} color="#0E1A16" />
            </RoundBtn>
            <Glass style={{ position: 'absolute', left: 72, right: 16, top: 22, height: 46, borderRadius: 23, paddingLeft: 16, paddingRight: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View>
                <Text size={16} lh={1.25} weight={700} color="#0E1A16">
                  {t.stationName}
                </Text>
                <Text size={11.5} lh={1.3} weight={400} color="#5B6B65">
                  {t.stationSub}
                </Text>
              </View>
              <Pressable accessibilityRole="button" onPress={() => { setFav((v) => !v); p.onFavourite?.(); }} style={{ width: 34, height: 34, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="star" size={22} color="#0E1A16" />
              </Pressable>
            </Glass>
            <Glass style={{ position: 'absolute', left: 16, top: 84, height: 30, paddingHorizontal: 12, borderRadius: 15, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#F59E0B' }} />
              <Text size={12.5} lh={1.3} weight={700} color="#0E1A16">
                {t.trainAtStation}
              </Text>
            </Glass>
            <RoundBtn top={82} label="3D" onPress={p.onOpen3d}>
              <Text size={13} lh={1.2} weight={700} color="#0E1A16">
                3D
              </Text>
            </RoundBtn>
            <RoundBtn top={136} label="compass">
              <Icon name="compass" size={22} color="#0E1A16" />
            </RoundBtn>
            <RoundBtn top={190} label="locate" onPress={() => p.onStage('overview')}>
              <Icon name="locate" size={22} color="#0E1A16" />
            </RoundBtn>
          </>
        ) : (
          <>
            <Glass style={{ position: 'absolute', left: 16, top: insets.top + 22, height: 48, paddingLeft: 7, paddingRight: 16, borderRadius: 24, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MetroTile size={34} radius={11} bg="#066B4A" color="#FFFFFF" icon={20} />
              <View>
                <Text size={15} lh={1.2} weight={700} tracking={-0.2} color="#0E1A16">
                  {'Metro '}
                  <Text size={15} lh={1.2} weight={700} tracking={-0.2} color={c.brand}>
                    KOI
                  </Text>
                </Text>
                <Text size={11.5} lh={1.3} weight={400} color="#5B6B65">
                  {t.brandSub}
                </Text>
              </View>
            </Glass>
            <Pressable accessibilityRole="button" onPress={p.onLang} style={[{ position: 'absolute', right: 16, top: insets.top + 26, height: 40, paddingHorizontal: 14, borderRadius: 20, justifyContent: 'center', backgroundColor: c.glassMap, boxShadow: '0 4px 14px rgba(14,26,22,0.16)' }, blur(12)]}>
              <Text size={13} lh={1.3} weight={700} color="#0E1A16">
                {t.langLabel}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="search"
              testID="search"
              onPress={p.onSearch}
              style={[{ position: 'absolute', left: 16, right: 16, top: insets.top + 82, height: 52, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, borderRadius: 26, backgroundColor: c.glassMap, boxShadow: '0 4px 14px rgba(14,26,22,0.16)' }, blur(12)]}
            >
              <Icon name="search" size={20} color="#5B6B65" strokeWidth={2.2} />
              <Text size={15.5} lh={1.3} weight={400} color="#5B6B65">
                {t.search}
              </Text>
            </Pressable>
            <Glass style={{ position: 'absolute', left: 16, top: insets.top + 144, height: 32, paddingHorizontal: 12, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#F59E0B' }} />
              <Text size={12.5} lh={1.3} weight={700} color="#0E1A16">
                {t.counts}
              </Text>
            </Glass>
            <RoundBtn top={insets.top + 150} label="3D" onPress={p.onOpen3d}>
              <Text size={13} lh={1.2} weight={700} color="#0E1A16">
                3D
              </Text>
            </RoundBtn>
            <RoundBtn top={insets.top + 204} label="compass">
              <Icon name="compass" size={22} color="#0E1A16" />
            </RoundBtn>
            <RoundBtn top={insets.top + 258} label="locate" onPress={() => p.onStage('overview')}>
              <Icon name="locate" size={22} color="#0E1A16" />
            </RoundBtn>
          </>
        )}
        <Pressable
          accessibilityRole="button"
          testID="zoom"
          onPress={next}
          style={[{ position: 'absolute', right: 16, top: layout.ui.zoom, height: 28, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, borderRadius: 14, backgroundColor: c.glassMap, boxShadow: '0 4px 14px rgba(14,26,22,0.16)' }, blur(12)]}
        >
          <Icon name="layers" size={14} color="#0E1A16" strokeWidth={2.2} />
          <Text size={12} lh={1.3} weight={700} color="#0E1A16">
            {t.zoom[p.stage]}
          </Text>
        </Pressable>
        <View pointerEvents="none" style={{ position: 'absolute', right: 10, top: layout.ui.credit }}>
          <Text size={9.5} lh={1.3} weight={400} color="#44524C">
            {t.credit}
          </Text>
        </View>

        {/* ---- the sheet ---- */}
        <View style={{ position: 'absolute', left: 0, right: 0, top: layout.ui.sheet, bottom: 0, backgroundColor: c.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, boxShadow: '0 -8px 28px rgba(14,26,22,0.14)', paddingTop: 10 }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: c.outline, alignSelf: 'center', marginBottom: 12 }} />
          <ScrollView contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: size.tabBar + 24 }} showsVerticalScrollIndicator={false}>
            {p.stage === 'overview' ? (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text size={17} lh={1.35} weight={700}>
                    {t.runningTitle}
                  </Text>
                  <Badge label={t.trainsCount} tone="brand" icon="train" />
                </View>
                {t.rows.map((r, i) => (
                  <View key={r.id}>
                    <Pressable onPress={() => p.onStage('city')} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }}>
                      <MetroTile size={40} radius={12} bg={c.brandTint} color={c.onBrandTint} icon={20} />
                      <View style={{ flex: 1 }}>
                        <Text size={15} lh={1.35} weight={700}>
                          {r.title}
                        </Text>
                        <Text size={12.5} lh={1.4} weight={400} tone="muted">
                          {r.sub}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text size={17} lh={1.3} weight={700}>
                          {r.eta}
                        </Text>
                        <Badge label={r.badge} tone={r.live ? 'live' : 'neutral'} />
                      </View>
                    </Pressable>
                    {i < t.rows.length - 1 ? <View style={{ height: 1, backgroundColor: c.divider }} /> : null}
                  </View>
                ))}
              </>
            ) : null}

            {p.stage === 'city' ? (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Badge label={t.cityPlatform} tone="brand" />
                  <Text size={12.5} lh={1.3} weight={400} tone="muted">
                    {t.cityTrainId}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 4 }}>
                  <Text size={32} lh={1.2} weight={700}>
                    {t.cityEta}
                  </Text>
                  <Badge label={t.cityBadge} tone="live" />
                </View>
                <View style={{ height: 28, marginTop: 6 }}>
                  <View style={{ position: 'absolute', left: 6, right: 6, top: 12, height: 4, borderRadius: 2, backgroundColor: c.divider }} />
                  <View style={{ position: 'absolute', left: 6, width: '58%', top: 12, height: 4, borderRadius: 2, backgroundColor: c.brand }} />
                  {[3, 35, 58, 97].map((pc) => (
                    <View key={pc} style={{ position: 'absolute', left: (pc + '%') as `${number}%`, top: 7, width: 14, height: 14, marginLeft: -7, borderRadius: 7, backgroundColor: '#FFFFFF', borderWidth: 3, borderColor: pc === 97 ? c.outline : c.brand }} />
                  ))}
                  <View style={{ position: 'absolute', left: '58%', top: 0, width: 28, height: 28, marginLeft: -14, borderRadius: 14, backgroundColor: '#066B4A', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="train" size={16} color="#FFFFFF" strokeWidth={2.4} />
                  </View>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
                  <Text size={11.5} lh={1.3} weight={400} tone="muted">
                    {t.cityFrom}
                  </Text>
                  <Text size={11.5} lh={1.3} weight={400} tone="muted">
                    {t.cityNext}
                  </Text>
                </View>
                <View style={{ marginTop: 10 }}>
                  <Button label={t.trainDetail} variant="secondary" size="md" fullWidth onPress={p.onTrainDetail} />
                </View>
              </>
            ) : null}

            {station ? (
              <>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                  {t.chips.map((ch) => (
                    <Badge key={ch.label} label={ch.label} tone={ch.tone} />
                  ))}
                </View>
                {t.groups.map((g) => (
                  <View key={g.title}>
                    <View style={{ marginTop: 8 }}>
                      <Text size={13} lh={1.4} weight={700} tone="muted">
                        {g.title}
                      </Text>
                    </View>
                    {g.rows.map((r, i) => (
                      <View key={r.big}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 7 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                            <Text size={20} lh={1.3} weight={700}>
                              {r.big}
                            </Text>
                            <Text size={12.5} lh={1.3} weight={400} tone="muted">
                              {r.small}
                            </Text>
                          </View>
                          <Badge label={r.badge} tone={r.live ? 'live' : 'neutral'} />
                        </View>
                        {i < g.rows.length - 1 ? <View style={{ height: 1, backgroundColor: c.divider }} /> : null}
                      </View>
                    ))}
                  </View>
                ))}
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                  <View style={{ flex: 1.3 }}>
                    <Button label={t.open3d} icon="layers" height={48} fullWidth onPress={p.onOpen3d} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button label={t.gates} variant="secondary" height={48} fullWidth onPress={p.onGates} />
                  </View>
                </View>
              </>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

export { STAGE_ZOOM };
export type { LiveViewProps, LiveViewText } from './types';
