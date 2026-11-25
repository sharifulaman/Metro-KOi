import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { useTheme } from '@/theme/useTheme';

import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { Text } from '../../ui/Text';

import type { ShareOnboardViewProps } from './types';

// the illustration is drawn on a 350×200 board (design "যাত্রা শেয়ার অনবোর্ডিং") and scaled to cover the hero
const ART_W = 350;
const ART_H = 200;
const TRACK = 'M-10 150 C70 150 90 70 170 70 S280 40 360 40';
const TRAIN = { x: 172, y: 70 };

/** Ride-sharing explainer (design: share onboarding, light + dark): what is shared, then one button to turn it on. */
export function ShareOnboardView(p: ShareOnboardViewProps) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const [heroW, setHeroW] = useState(ART_W);
  // "slice": cover the hero, keep the art's proportions, centred
  const k = Math.max(heroW / ART_W, 1);
  const ox = (heroW - ART_W * k) / 2;
  const oy = (ART_H - ART_H * k) / 2;
  const trainX = ox + TRAIN.x * k;
  const trainY = oy + TRAIN.y * k;

  return (
    <View testID={p.testID} style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 26, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24 }}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {p.progress
              ? Array.from({ length: p.progress.count }, (_, i) => (
                  <View key={i} style={{ width: i === p.progress!.index ? 26 : 8, height: 8, borderRadius: 4, backgroundColor: i === p.progress!.index ? c.brand : c.outline }} />
                ))
              : null}
          </View>
          <Pressable onPress={p.onSkip} accessibilityRole="button" hitSlop={12} style={{ paddingVertical: 8, paddingHorizontal: 4 }} testID="share-skip">
            <Text size={14.5} weight={600} tone="muted">
              {p.skipLabel}
            </Text>
          </Pressable>
        </View>

        <View
          onLayout={(e) => setHeroW(e.nativeEvent.layout.width)}
          style={{ marginTop: 22, marginHorizontal: 20, height: ART_H, borderRadius: 28, overflow: 'hidden', borderWidth: 1, borderColor: c.divider }}
        >
          <Svg width="100%" height={ART_H} viewBox={`0 0 ${ART_W} ${ART_H}`} preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', left: 0, top: 0 }} aria-hidden>
            <Defs>
              {/* 160° CSS gradient: top-left → bottom-right */}
              <LinearGradient id="shareHero" x1="0.33" y1="0" x2="0.67" y2="1">
                <Stop offset="0" stopColor={c.brandTint} />
                <Stop offset="1" stopColor={c.surface} />
              </LinearGradient>
            </Defs>
            <Rect x={-ART_W} y={-ART_H} width={ART_W * 3} height={ART_H * 3} fill="url(#shareHero)" />
            <Path d={TRACK} fill="none" stroke={c.outline} strokeWidth={10} strokeLinecap="round" />
            <Path d={TRACK} fill="none" stroke={c.brand} strokeWidth={3} strokeDasharray="2 9" strokeLinecap="round" />
            <Circle cx={52} cy={144} r={7} fill={c.surface} stroke={c.brand} strokeWidth={3} />
            <Circle cx={300} cy={45} r={7} fill={c.surface} stroke={c.brand} strokeWidth={3} />
            <Circle cx={TRAIN.x} cy={TRAIN.y} r={26} fill={c.brand} opacity={0.16} />
            <Circle cx={TRAIN.x} cy={TRAIN.y} r={15} fill={c.brand} opacity={0.28} />
            <Circle cx={TRAIN.x} cy={TRAIN.y} r={7} fill={c.brand} />
          </Svg>
          <View
            style={{
              position: 'absolute',
              left: trainX - 22,
              top: trainY + 42,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingVertical: 6,
              paddingLeft: 8,
              paddingRight: 12,
              borderRadius: 999,
              backgroundColor: c.surface,
              borderWidth: 1,
              borderColor: c.divider,
              boxShadow: '0 6px 18px rgba(0,0,0,0.18)',
            }}
          >
            <Icon name="train" size={18} color={c.onBrandTint} />
            <Text size={13} weight={700}>
              {p.trainLabel}
            </Text>
          </View>
          <View style={{ position: 'absolute', right: 14, bottom: 14, paddingVertical: 3, paddingHorizontal: 10, borderRadius: 999, backgroundColor: c.liveTint }}>
            <Text size={12.5} lh={1.4} weight={600} color={c.onLiveTint}>
              {p.liveLabel}
            </Text>
          </View>
        </View>

        <View style={{ marginTop: 26, marginHorizontal: 24 }}>
          <Text size={28} lh={1.3} weight={700} tracking={-0.3}>
            {p.title}
          </Text>
        </View>
        <View style={{ marginTop: 8, marginHorizontal: 24 }}>
          <Text size={15} lh={1.55} tone="muted">
            {p.body}
          </Text>
        </View>

        <View style={{ marginTop: 20, marginHorizontal: 20, borderRadius: 24, backgroundColor: c.surface, borderWidth: 1, borderColor: c.divider }}>
          {p.rows.map((r, i) => (
            <View key={r.title}>
              {i > 0 ? <View style={{ height: 1, backgroundColor: c.divider, marginHorizontal: 16 }} /> : null}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 13, paddingHorizontal: 16 }}>
                <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: c.brandTint, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={r.icon} size={21} color={c.onBrandTint} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text size={15.5} lh={1.35} weight={700}>
                    {r.title}
                  </Text>
                  <Text size={12.5} lh={1.4} tone="muted">
                    {r.body}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: insets.bottom + 30 }}>
        <Button label={p.ctaLabel} fullWidth height={56} onPress={p.onEnable} testID="share-enable" />
        <View style={{ marginTop: 10 }}>
          <Text size={13} tone="muted" align="center">
            {p.note}
          </Text>
        </View>
      </View>
    </View>
  );
}

export type { ShareOnboardViewProps, ShareOnboardRow } from './types';
