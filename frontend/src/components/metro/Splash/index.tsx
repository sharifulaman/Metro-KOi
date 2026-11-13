import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, Text as RNText, View, useWindowDimensions } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { useSettings } from '@/store/settings';
import { fontFamily } from '@/theme/fonts';
import { brandFixed } from '@/theme/tokens';
import { useReduceMotion } from '@/theme/useReduceMotion';

import { BrandMark } from '../BrandMark';

import type { SplashProps } from './types';

const FADE_MS = 450;

/** Opening page: the logo, the name, a loading bar and a train crossing the rails. */
export function Splash({ title, accent, subtitle, tagline, status, credit, logoLabel, durationMs = 2300, onFinish, testID }: SplashProps) {
  const lang = useSettings((s) => s.lang);
  const reduce = useReduceMotion();
  const { width, height } = useWindowDimensions();
  const fade = useRef(new Animated.Value(1)).current;
  const intro = useRef(new Animated.Value(reduce ? 1 : 0)).current;
  const load = useRef(new Animated.Value(reduce ? 1 : 0)).current;
  const sweep = useRef(new Animated.Value(0)).current;
  const done = useRef(false);

  const finish = () => {
    if (done.current) return;
    done.current = true;
    Animated.timing(fade, { toValue: 0, duration: reduce ? 0 : FADE_MS, useNativeDriver: true }).start(() => onFinish());
  };

  useEffect(() => {
    if (!reduce) {
      Animated.timing(intro, { toValue: 1, duration: 700, easing: Easing.out(Easing.back(1.4)), useNativeDriver: true }).start();
      Animated.timing(load, { toValue: 1, duration: 1900, delay: 200, easing: Easing.out(Easing.quad), useNativeDriver: false }).start();
      Animated.timing(sweep, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }).start();
    }
    const timer = setTimeout(finish, reduce ? 1200 : durationMs);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rise = intro.interpolate({ inputRange: [0, 1], outputRange: [14, 0] });
  const pop = intro.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });
  const bold = fontFamily(lang, 700);
  const trainW = width * 0.6;
  return (
    <Animated.View
      testID={testID}
      accessibilityRole="progressbar"
      accessibilityLabel={`${title} ${accent}`}
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, opacity: fade, overflow: 'hidden' }}
    >
      <Pressable onPress={finish} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }} pointerEvents="none">
          <Defs>
            <LinearGradient id="splashBg" x1="0.3" y1="0" x2="0.7" y2="1">
              <Stop offset="0" stopColor={brandFixed.top} />
              <Stop offset="0.46" stopColor={brandFixed.mid} />
              <Stop offset="1" stopColor={brandFixed.bottom} />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width="100%" height="100%" fill="url(#splashBg)" />
          <Path d={`M${-width * 0.1} ${height * 0.97}L${width * 1.1} ${height * 0.6}`} stroke={brandFixed.white} strokeOpacity={0.18} strokeWidth={10} />
          <Path d={`M${-width * 0.1} ${height * 0.93}L${width * 1.1} ${height * 0.56}`} stroke={brandFixed.white} strokeOpacity={0.12} strokeWidth={2} />
        </Svg>

        {reduce ? null : (
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              zIndex: 1,
              left: 0,
              top: height * 0.8,
              width: trainW,
              height: 14,
              borderRadius: 7,
              backgroundColor: brandFixed.body,
              borderWidth: 3,
              borderColor: brandFixed.accent,
              transform: [
                { translateX: sweep.interpolate({ inputRange: [0, 1], outputRange: [-trainW, width] }) },
                { translateY: sweep.interpolate({ inputRange: [0, 1], outputRange: [0, -height * 0.34] }) },
                { rotate: '-26.5deg' },
              ],
            }}
          />
        )}

        <Animated.View
          style={{
            width: 136,
            height: 136,
            borderRadius: 34,
            backgroundColor: brandFixed.white,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 10,
            borderColor: 'rgba(255,255,255,0.12)',
            zIndex: 2,
            opacity: intro,
            transform: [{ scale: pop }],
          }}
        >
          <BrandMark variant="pin" size={112} label={logoLabel} />
        </Animated.View>

        <Animated.View style={{ alignItems: 'center', zIndex: 2, opacity: intro, transform: [{ translateY: rise }] }}>
          <RNText style={{ marginTop: 30, color: brandFixed.white, fontSize: 46, lineHeight: 52, fontFamily: bold }} accessibilityRole="header">
            {title} <RNText style={{ color: brandFixed.accent }}>{accent}</RNText>
          </RNText>
          <RNText style={{ marginTop: 10, color: brandFixed.white, fontSize: 26, lineHeight: 36, fontFamily: fontFamily('bn', 700) }}>{subtitle}</RNText>
          <RNText style={{ marginTop: 8, color: brandFixed.white, opacity: 0.82, fontSize: 14, lineHeight: 20, fontFamily: fontFamily(lang, 500) }}>{tagline}</RNText>
        </Animated.View>

        <View style={{ marginTop: 34, width: 132, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.22)', overflow: 'hidden' }}>
          <Animated.View style={{ height: 4, borderRadius: 2, backgroundColor: brandFixed.accent, width: load.interpolate({ inputRange: [0, 1], outputRange: [0, 132] }) }} />
        </View>
        <RNText style={{ marginTop: 12, color: brandFixed.white, opacity: 0.78, fontSize: 12, fontFamily: fontFamily(lang, 500) }}>{status}</RNText>
        <RNText style={{ position: 'absolute', left: 16, right: 16, bottom: 26, textAlign: 'center', color: brandFixed.white, opacity: 0.7, fontSize: 11, lineHeight: 16, fontFamily: fontFamily(lang, 500) }}>
          {credit}
        </RNText>
      </Pressable>
    </Animated.View>
  );
}

export type { SplashProps } from './types';
