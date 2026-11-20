import { useEffect, useRef } from 'react';
import { Animated, Easing, ScrollView, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/useTheme';

import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { Text } from '../../ui/Text';
import { CardArt } from '../CardArt';
import { NavHeader } from '../NavHeader';

import type { ScanViewProps } from './types';

/** A 0 → 1 → 0 loop (eased), optionally started after `delay` ms. */
function useLoop(duration: number, delay = 0): Animated.Value {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(v, { toValue: 1, duration, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [v, duration, delay]);
  return v;
}

/** Hold-the-card screen (design ২): rings, a phone with its NFC mark, the card tilting in, two platform hints. */
export function ScanView(p: ScanViewProps) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const win = useWindowDimensions();
  const ring1 = useLoop(1100, 0);
  const ring2 = useLoop(1100, 250);
  const ring3 = useLoop(1100, 500);
  const card = useLoop(1300);
  const nfc = useLoop(900);
  // the illustration is drawn on a 390 x 460 stage: shrink it on narrow or short screens instead of letting the rest collide with it
  const k = Math.max(0.55, Math.min(1, win.width / 390, (win.height - 330) / 460));
  return (
    <View testID={p.testID} style={{ flex: 1, backgroundColor: c.bg }}>
      <NavHeader left={{ icon: 'close', label: p.closeLabel, onPress: p.onClose }} title={p.title} />

      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 28 + insets.bottom }} showsVerticalScrollIndicator={false}>
      <View pointerEvents="none" style={{ alignItems: 'center' }}>
        <View style={{ width: 390 * k, height: 460 * k }}>
        <View style={{ width: 390, height: 460, position: 'absolute', left: (-390 * (1 - k)) / 2, top: (-460 * (1 - k)) / 2, transform: [{ scale: k }] }}>
          {([
            { r: 169, v: ring3, lo: 0.1, hi: 0.3 },
            { r: 133, v: ring2, lo: 0.18, hi: 0.4 },
            { r: 99, v: ring1, lo: 0.3, hi: 0.6 },
          ] as const).map((g) => (
            <Animated.View
              key={g.r}
              style={{
                position: 'absolute',
                left: 195 - g.r,
                top: 270 - g.r,
                width: g.r * 2,
                height: g.r * 2,
                borderRadius: g.r,
                borderWidth: 2,
                borderColor: c.brand,
                opacity: g.v.interpolate({ inputRange: [0, 1], outputRange: [g.lo, g.hi] }),
                transform: [{ scale: g.v.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.05] }) }],
              }}
            />
          ))}
          <View style={{ position: 'absolute', left: 113, top: 128, width: 164, height: 290, borderRadius: 30, boxShadow: '0 14px 30px rgba(14,26,22,0.3)', overflow: 'hidden' }}>
            <Svg width={164} height={290}>
              <Defs>
                <LinearGradient id="phone" x1="30%" y1="0%" x2="70%" y2="100%">
                  <Stop offset="0%" stopColor="#2B3A35" />
                  <Stop offset="100%" stopColor="#0E1A16" />
                </LinearGradient>
              </Defs>
              <Rect x={0} y={0} width={164} height={290} fill="url(#phone)" />
            </Svg>
            <View style={{ position: 'absolute', left: 14, top: 14, width: 46, height: 46, borderRadius: 14, backgroundColor: '#0B1210', borderWidth: 2, borderColor: '#3A4A44' }}>
              <View style={{ position: 'absolute', left: 10, top: 10, width: 22, height: 22, borderRadius: 11, backgroundColor: '#1A2723', borderWidth: 2, borderColor: '#4A5E57' }} />
            </View>
            <Animated.View style={{ position: 'absolute', left: 50, top: 112, width: 64, height: 64, borderRadius: 32, backgroundColor: c.brand, alignItems: 'center', justifyContent: 'center', transform: [{ scale: nfc.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) }] }}>
              <Icon name="nfc" size={34} color="#04140E" strokeWidth={2.2} />
            </Animated.View>
          </View>
          <Animated.View style={{ position: 'absolute', left: 201, top: 318, transform: [{ translateX: card.interpolate({ inputRange: [0, 1], outputRange: [14, -22] }) }, { translateY: card.interpolate({ inputRange: [0, 1], outputRange: [10, -34] }) }, { rotate: card.interpolate({ inputRange: [0, 1], outputRange: ['-14deg', '-6deg'] }) }] }}>
            <CardArt name={p.card.name} tail={p.card.tail} typeLabel={p.card.typeLabel} color="green" rapidPass={p.card.rapidPass} width={163} />
          </Animated.View>
        </View>
        </View>
      </View>

      <View style={{ alignItems: 'center', paddingHorizontal: 32 }}>
        <Text size={24} lh={1.3} weight={700} align="center">
          {p.heading}
        </Text>
        <View style={{ marginTop: 6 }}>
          <Text size={15} lh={1.5} weight={400} tone="muted" align="center">
            {p.hint}
          </Text>
        </View>
      </View>

      <View style={{ marginHorizontal: 24, marginTop: 16, gap: 8 }}>
        {[
          { icon: 'phone' as const, text: p.androidHint },
          { icon: 'shieldPlain' as const, text: p.iosHint },
        ].map((h) => (
          <View key={h.icon} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, backgroundColor: c.surfaceAlt }}>
            <Icon name={h.icon} size={20} color={c.onBrandTint} />
            <View style={{ flex: 1 }}>
              <Text size={13.5} lh={1.4} weight={400}>
                {h.text}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={{ flex: 1, minHeight: 16 }} />
      <View style={{ marginHorizontal: 24, gap: 8 }}>
        {p.error ? <Button label={p.retryLabel} icon="nfc" fullWidth onPress={p.onRetry} /> : null}
      </View>
      </ScrollView>
    </View>
  );
}

export type { ScanViewProps } from './types';
