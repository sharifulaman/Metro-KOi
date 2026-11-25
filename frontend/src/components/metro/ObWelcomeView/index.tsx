import { useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, G, LinearGradient, Path, Polyline, Rect, Stop } from 'react-native-svg';

import { useTheme } from '@/theme/useTheme';

import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { Text } from '../../ui/Text';

import type { ObWelcomeViewProps } from './types';

// the illustration is drawn on a 350×430 board (design "অনবোর্ডিং লাইভ") and fitted, centred, into the hero
const ART_W = 350;
const ART_H = 430;
const LINE = '130,34 120,110 176,180 206,262 218,330 240,388';
const STOPS: [number, number][] = [[130, 34], [120, 110], [176, 180], [206, 262], [218, 330], [240, 388]];
const TRAIN = { x: 148, y: 145 };
// the grid and the road run past the board so a wider or shorter hero stays filled
const GRID_Y = Array.from({ length: 15 }, (_, i) => -200 + i * 60);
const GRID_X = Array.from({ length: 15 }, (_, i) => -390 + i * 70);
const ROAD = 'M-400 320 L-20 300 C80 280 140 340 370 250 L800 90';

/** Onboarding page 1 (design: welcome): the line drawn live, a train on it, then Next. */
export function ObWelcomeView(p: ObWelcomeViewProps) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const [box, setBox] = useState({ w: ART_W, h: ART_H });
  // "meet": the whole board shows, centred; the grid fills the rest
  const k = Math.min(box.w / ART_W, box.h / ART_H);
  const ox = (box.w - ART_W * k) / 2;
  const oy = (box.h - ART_H * k) / 2;
  const at = (x: number, y: number) => ({ left: ox + x * k, top: oy + y * k });

  const pill = (label: string, pos: { left: number; top: number }) => (
    <View
      style={{
        position: 'absolute',
        ...pos,
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
        boxShadow: '0 6px 18px rgba(0,0,0,0.2)',
      }}
    >
      <Icon name="train" size={17} color={c.onBrandTint} />
      <Text size={13} weight={700}>
        {label}
      </Text>
    </View>
  );

  return (
    <View testID={p.testID} style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top + 26 }}>
      <TopBar progress={p.progress}>
        <Pressable onPress={p.onSkip} accessibilityRole="button" hitSlop={12} style={{ paddingVertical: 8, paddingHorizontal: 4 }} testID="welcome-skip">
          <Text size={14.5} weight={600} tone="muted">
            {p.skipLabel}
          </Text>
        </Pressable>
      </TopBar>

      <View
        onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
        style={{ flex: 1, maxHeight: ART_H, minHeight: 220, marginTop: 22, marginHorizontal: 20, borderRadius: 28, overflow: 'hidden', borderWidth: 1, borderColor: c.divider }}
      >
        <Svg width={box.w} height={box.h} viewBox={`${-ox / k} ${-oy / k} ${box.w / k} ${box.h / k}`} style={{ position: 'absolute', left: 0, top: 0 }} aria-hidden>
          <Defs>
            <LinearGradient id="obWelcome" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={c.brandTint} />
              <Stop offset="1" stopColor={c.surface} />
            </LinearGradient>
          </Defs>
          <Rect x={-ox / k} y={-oy / k} width={box.w / k} height={box.h / k} fill="url(#obWelcome)" />
          <G stroke={c.divider} strokeWidth={1}>
            {GRID_Y.map((y) => (
              <Path key={`h${y}`} d={`M-800 ${y} H1200`} />
            ))}
            {GRID_X.map((x) => (
              <Path key={`v${x}`} d={`M${x} -800 V1200`} />
            ))}
          </G>
          <Path d={ROAD} stroke={c.outline} strokeWidth={14} fill="none" opacity={0.6} />
          <Polyline points={LINE} fill="none" stroke={c.outline} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />
          <Polyline points={LINE} fill="none" stroke={c.brand} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
          {STOPS.map(([x, y]) => (
            <Circle key={`${x},${y}`} cx={x} cy={y} r={7} fill={c.surface} stroke={c.brand} strokeWidth={3.5} />
          ))}
          <Circle cx={TRAIN.x} cy={TRAIN.y} r={22} fill={c.brand} opacity={0.18} />
          <Circle cx={TRAIN.x} cy={TRAIN.y} r={11} fill={c.brand} />
        </Svg>
        {pill(p.fromLabel, at(150, 20))}
        {pill(p.toLabel, at(176, 374))}
        <View style={{ position: 'absolute', ...at(176, 124), paddingVertical: 5, paddingHorizontal: 10, borderRadius: 12, backgroundColor: c.brandSolid, boxShadow: '0 6px 16px rgba(0,0,0,0.25)' }}>
          <Text size={12.5} weight={700} color={c.onBrandSolid}>
            {p.etaLabel}
          </Text>
        </View>
        <View style={{ position: 'absolute', left: 14, top: 14, paddingVertical: 3, paddingHorizontal: 10, borderRadius: 999, backgroundColor: c.liveTint }}>
          <Text size={12.5} lh={1.4} weight={600} color={c.onLiveTint}>
            {p.liveLabel}
          </Text>
        </View>
      </View>

      <View style={{ marginTop: 24, marginHorizontal: 24 }}>
        <Text size={28} lh={1.3} weight={700} tracking={-0.3}>
          {p.title}
        </Text>
      </View>
      <View style={{ marginTop: 8, marginHorizontal: 24 }}>
        <Text size={15} lh={1.55} tone="muted">
          {p.body}
        </Text>
      </View>

      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: insets.bottom + 30 }}>
        <Button label={p.nextLabel} fullWidth height={56} onPress={p.onNext} testID="welcome-next" />
      </View>
    </View>
  );
}

/** page dots on the left, an optional action on the right */
export function TopBar({ progress, children }: { progress?: { index: number; count: number }; children?: ReactNode }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, minHeight: 34 }}>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {progress
          ? Array.from({ length: progress.count }, (_, i) => (
              <View key={i} style={{ width: i === progress.index ? 26 : 8, height: 8, borderRadius: 4, backgroundColor: i === progress.index ? c.brand : c.outline }} />
            ))
          : null}
      </View>
      {children}
    </View>
  );
}

export type { ObWelcomeViewProps } from './types';
