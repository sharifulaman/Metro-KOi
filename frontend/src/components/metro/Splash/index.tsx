import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, Text as RNText, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Ellipse, G, Line, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { useSettings } from '@/store/settings';
import { fontFamily } from '@/theme/fonts';
import { splashFixed as S } from '@/theme/tokens';
import { useReduceMotion } from '@/theme/useReduceMotion';

import type { SplashProps } from './types';

const FADE_MS = 450;
// the scene is drawn on the design's 390×844 board: the sky and logo hang from the top, the city and the
// viaduct stand on the bottom edge, so any phone height keeps the train on its track
const BOARD_W = 390;
const BOARD_H = 844;

// [x, y, twinkle group] — 26 stars in the top of the sky
const STARS: [number, number, number][] = [
  [175, 33, 1], [34, 23, 3], [58, 60, 2], [269, 41, 0], [232, 67, 0], [56, 84, 1], [299, 29, 3], [332, 94, 2], [41, 87, 2],
  [35, 42, 0], [78, 51, 1], [286, 29, 2], [296, 118, 2], [62, 88, 2], [106, 61, 0], [374, 22, 2], [326, 40, 1], [282, 68, 3],
  [248, 88, 3], [195, 52, 1], [102, 103, 3], [51, 87, 1], [263, 57, 2], [157, 91, 3], [70, 79, 1], [185, 33, 3],
];
// [x, y, w, h] buildings of one 390-px tile, and the lit windows [x, y]
const FAR: [number, number, number, number][] = [
  [0, 53, 25, 77], [31, 50, 33, 80], [70, 32, 18, 98], [94, 65, 33, 65], [130, 66, 34, 64], [166, 42, 23, 88], [193, 38, 18, 92],
  [216, 62, 36, 68], [254, 59, 22, 71], [281, 36, 38, 94], [325, 56, 29, 74], [358, 48, 37, 82],
];
const FAR_LIT: [number, number][] = [[14, 117], [77, 108], [76, 62], [80, 107], [104, 111], [203, 120], [202, 98], [230, 74], [261, 108], [297, 106], [310, 91], [346, 76], [338, 105], [328, 116], [383, 95]];
const NEAR: [number, number, number, number][] = [
  [0, 65, 32, 65], [37, 61, 38, 69], [79, 95, 22, 35], [107, 72, 30, 58], [143, 97, 20, 33], [166, 62, 25, 68], [196, 72, 28, 58],
  [228, 100, 33, 30], [266, 83, 38, 47], [310, 99, 27, 31], [343, 75, 21, 55], [368, 96, 30, 34],
];
const NEAR_LIT: [number, number][] = [[17, 103], [21, 83], [8, 103], [43, 95], [129, 78], [215, 92], [286, 94], [291, 105], [279, 103]];
// speed streaks behind the train: [x, y, width, start delay ms]
const STREAKS: [number, number, number, number][] = [[300, 606, 70, 0], [340, 619, 50, 350], [280, 630, 90, 700], [360, 597, 40, 150]];

/** The pin logo (design "অ্যাপ লোগো"): a map pin with a metro train face and a live signal. */
export function PinLogo({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      <Defs>
        <LinearGradient id="pinFill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={S.pinTop} />
          <Stop offset="1" stopColor={S.pinBottom} />
        </LinearGradient>
      </Defs>
      <Rect width={120} height={120} rx={34} fill={S.logoBg} />
      <Ellipse cx={58} cy={106} rx={16} ry={3.6} fill={S.pinShadow} opacity={0.16} />
      <Path d="M58 102C58 102 27 75 27 49a31 31 0 1 1 62 0C89 75 58 102 58 102Z" fill="url(#pinFill)" />
      <Rect x={40} y={29} width={36} height={35} rx={9} fill={S.white} />
      <Rect x={45} y={34} width={26} height={13} rx={3.5} fill={S.logoGlass} />
      <Rect x={57} y={34} width={2} height={13} fill={S.white} />
      <Rect x={40} y={51} width={36} height={2.4} fill={S.logoBand} />
      <Circle cx={48} cy={58} r={3} fill={S.logoLamp} />
      <Circle cx={68} cy={58} r={3} fill={S.logoLamp} />
      <Path d="M46 64l-3 8M70 64l3 8" stroke={S.white} strokeWidth={3} strokeLinecap="round" />
      <Path d="M88 22a14 14 0 0 1 10 10" fill="none" stroke={S.logoLamp} strokeWidth={3.4} strokeLinecap="round" />
      <Path d="M90 11a26 26 0 0 1 19 19" fill="none" stroke={S.logoLamp} strokeWidth={3.4} strokeLinecap="round" opacity={0.6} />
    </Svg>
  );
}

/** one coach of the crossing train; `cab` = the leading car with the rounded nose */
function Car({ x, cab }: { x: number; cab?: boolean }) {
  const windows = cab ? [8, 28, 48] : [8, 28, 48, 68];
  return (
    <G>
      {cab ? <Path d={`M${x} 0H${x + 62}C${x + 86} 0 ${x + 96} 14 ${x + 96} 30V40H${x}Z`} fill={S.carBody} /> : <Rect x={x} y={0} width={96} height={40} rx={6} fill={S.carBody} />}
      {windows.map((w) => (
        <Rect key={w} x={x + w} y={6} width={14} height={11} rx={3} fill={S.window} />
      ))}
      {cab ? (
        <>
          <Path d={`M${x + 62} 6H${x + 76}C${x + 84} 6 ${x + 90} 14 ${x + 90} 20H${x + 62}Z`} fill={S.cab} />
          <Circle cx={x + 91} cy={31} r={3.2} fill={S.beam} />
        </>
      ) : null}
      <Rect x={x} y={24} width={96} height={4} fill={S.carStripe} />
      <Rect x={x} y={28} width={96} height={2.2} fill={S.carBand} />
      <Rect x={x + 8} y={40} width={16} height={5} rx={2} fill={S.carWheel} />
      <Rect x={x + 70} y={40} width={16} height={5} rx={2} fill={S.carWheel} />
    </G>
  );
}

function City({ blocks, lit, fill, tiles }: { blocks: [number, number, number, number][]; lit: [number, number][]; fill: string; tiles: number }) {
  return (
    <Svg width={BOARD_W * tiles} height={130} viewBox={`0 0 ${BOARD_W * tiles} 130`}>
      {Array.from({ length: tiles }, (_, t) => (
        <G key={t} transform={`translate(${t * BOARD_W} 0)`}>
          {blocks.map(([x, y, w, h]) => (
            <Rect key={`b${x}`} x={x} y={y} width={w} height={h} fill={fill} />
          ))}
          {lit.map(([x, y]) => (
            <Rect key={`w${x},${y}`} x={x} y={y} width={3} height={4} fill={S.window} opacity={0.75} />
          ))}
        </G>
      ))}
    </Svg>
  );
}

/** Opening page (design "স্প্ল্যাশ"): night city, the pin logo, a loading bar and a metro crossing the viaduct. */
export function Splash({ title, accent, subtitle, tagline, status, credit, logoLabel, durationMs = 2300, onFinish, testID }: SplashProps) {
  const lang = useSettings((s) => s.lang);
  const reduce = useReduceMotion();
  const insets = useSafeAreaInsets();
  const win = useWindowDimensions();
  const [size, setSize] = useState({ w: win.width, h: win.height });
  const W = size.w;
  const H = size.h;

  const fade = useRef(new Animated.Value(1)).current;
  const intro = useRef(new Animated.Value(reduce ? 1 : 0)).current;
  const introLate = useRef(new Animated.Value(reduce ? 1 : 0)).current;
  const bar = useRef(new Animated.Value(reduce ? 0.96 : 0.06)).current;
  const bob = useRef(new Animated.Value(0)).current;
  const rings = useRef([new Animated.Value(0), new Animated.Value(0)]).current;
  const twinkle = useRef([0, 1, 2, 3].map(() => new Animated.Value(0.5))).current;
  const train = useRef(new Animated.Value(0)).current;
  const far = useRef(new Animated.Value(0)).current;
  const near = useRef(new Animated.Value(0)).current;
  const rail = useRef(new Animated.Value(0)).current;
  const streaks = useRef(STREAKS.map(() => new Animated.Value(0))).current;
  const done = useRef(false);

  const finish = () => {
    if (done.current) return;
    done.current = true;
    Animated.timing(fade, { toValue: 0, duration: reduce ? 0 : FADE_MS, useNativeDriver: true }).start(() => onFinish());
  };

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const anims: Animated.CompositeAnimation[] = [];
    const run = (a: Animated.CompositeAnimation, delay = 0) => {
      anims.push(a);
      if (delay) timers.push(setTimeout(() => a.start(), delay));
      else a.start();
    };
    const linear = (v: Animated.Value, duration: number, native = true) =>
      Animated.loop(Animated.timing(v, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: native }));
    if (!reduce) {
      run(Animated.timing(intro, { toValue: 1, duration: 800, delay: 200, easing: Easing.out(Easing.quad), useNativeDriver: true }));
      run(Animated.timing(introLate, { toValue: 1, duration: 800, delay: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }));
      run(
        Animated.loop(
          Animated.sequence([
            Animated.timing(bar, { toValue: 0.78, duration: 2160, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
            Animated.timing(bar, { toValue: 0.96, duration: 1440, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
          ]),
        ),
      );
      run(
        Animated.loop(
          Animated.sequence([
            Animated.timing(bob, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            Animated.timing(bob, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          ]),
        ),
      );
      rings.forEach((r, i) => run(Animated.loop(Animated.timing(r, { toValue: 1, duration: 2600, easing: Easing.out(Easing.quad), useNativeDriver: true })), i * 1300));
      twinkle.forEach((v, i) =>
        run(
          Animated.loop(
            Animated.sequence([
              Animated.timing(v, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
              Animated.timing(v, { toValue: 0.25, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            ]),
          ),
          i * 600,
        ),
      );
      run(linear(train, 5200));
      run(linear(far, 26000));
      run(linear(near, 12000));
      run(linear(rail, 400));
      streaks.forEach((s, i) => run(linear(s, 1100), STREAKS[i][3]));
    }
    timers.push(setTimeout(finish, reduce ? 1200 : durationMs));
    return () => {
      timers.forEach(clearTimeout);
      anims.forEach((a) => a.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sx = W / BOARD_W;
  const dy = H - BOARD_H; // bottom-anchored parts shift with the phone's height
  const logoTop = Math.max(insets.top + 16, 128 + dy / 2);
  const logoLeft = (W - 128) / 2;
  const tiles = Math.ceil(W / BOARD_W) + 1;
  const deckY = 646 + dy;
  const piers = [40, 190, 340].map((x) => x * sx);
  const bold = fontFamily(lang, 700);
  const rise = (v: Animated.Value) => [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }];

  return (
    <Animated.View
      testID={testID}
      onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      accessibilityRole="progressbar"
      accessibilityLabel={`${title} ${accent}`}
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, opacity: fade, overflow: 'hidden', backgroundColor: S.skyBottom }}
    >
      <Pressable onPress={finish} style={{ flex: 1 }}>
        {/* sky */}
        <Svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0 }} pointerEvents="none">
          <Defs>
            <RadialGradient id="sky" cx="50%" cy="0%" rx="120%" ry="70%" fx="50%" fy="0%">
              <Stop offset="0" stopColor={S.skyTop} />
              <Stop offset="0.45" stopColor={S.skyMid} />
              <Stop offset="1" stopColor={S.skyBottom} />
            </RadialGradient>
            <RadialGradient id="moon" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={S.glow} stopOpacity={0.55} />
              <Stop offset="0.7" stopColor={S.glow} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect x={0} y={0} width={W} height={H} fill="url(#sky)" />
          <Circle cx={95 * sx} cy={75} r={35} fill="url(#moon)" />
        </Svg>
        {STARS.map(([x, y, g]) => (
          <Animated.View key={`${x},${y}`} pointerEvents="none" style={{ position: 'absolute', left: x * sx, top: y + insets.top / 2, width: 2, height: 2, borderRadius: 1, backgroundColor: S.white, opacity: reduce ? 0.6 : twinkle[g] }} />
        ))}

        {/* city, two layers drifting left at different speeds */}
        <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 470 + dy, transform: [{ translateX: far.interpolate({ inputRange: [0, 1], outputRange: [0, -BOARD_W] }) }] }}>
          <City blocks={FAR} lit={FAR_LIT} fill={S.cityFar} tiles={tiles} />
        </Animated.View>
        <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 520 + dy, transform: [{ translateX: near.interpolate({ inputRange: [0, 1], outputRange: [0, -BOARD_W] }) }] }}>
          <City blocks={NEAR} lit={NEAR_LIT} fill={S.cityNear} tiles={tiles} />
        </Animated.View>

        {/* logo with two expanding rings */}
        {rings.map((r, i) => (
          <Animated.View
            key={i}
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: logoLeft,
              top: logoTop,
              width: 128,
              height: 128,
              borderRadius: 64,
              borderWidth: 2,
              borderColor: S.ring,
              opacity: reduce ? 0 : r.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] }),
              transform: [{ scale: r.interpolate({ inputRange: [0, 1], outputRange: [0.7, 2.1] }) }],
            }}
          />
        ))}
        <Animated.View
          accessibilityLabel={logoLabel}
          accessibilityRole="image"
          style={{
            position: 'absolute',
            left: logoLeft,
            top: logoTop,
            boxShadow: '0 18px 24px rgba(0,0,0,0.35)',
            borderRadius: 36,
            transform: [{ translateY: bob.interpolate({ inputRange: [0, 1], outputRange: [0, -7] }) }],
          }}
        >
          <PinLogo size={128} />
        </Animated.View>

        {/* name, Bangla name, tagline */}
        <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 16, right: 16, top: logoTop + 150, alignItems: 'center', opacity: intro, transform: rise(intro) }}>
          <RNText accessibilityRole="header" style={{ color: S.white, fontSize: 42, lineHeight: 48, letterSpacing: -1, fontFamily: fontFamily('en', 700) }}>
            {title} <RNText style={{ color: S.accent }}>{accent}</RNText>
          </RNText>
          <RNText style={{ marginTop: 6, color: S.white, fontSize: 22, lineHeight: 30, fontFamily: fontFamily('bn', 700) }}>{subtitle}</RNText>
          <RNText style={{ marginTop: 4, color: S.white, opacity: 0.82, fontSize: 14, lineHeight: 21, fontFamily: fontFamily(lang, 500) }}>{tagline}</RNText>
        </Animated.View>

        {/* loading bar */}
        <Animated.View pointerEvents="none" style={{ position: 'absolute', left: (W - 180) / 2, width: 180, top: logoTop + 280, opacity: introLate, transform: rise(introLate) }}>
          <View style={{ height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)', overflow: 'hidden' }}>
            <Animated.View style={{ height: 5, borderRadius: 3, overflow: 'hidden', width: bar.interpolate({ inputRange: [0, 1], outputRange: [0, 180] }) }}>
              <Svg width={180} height={5}>
                <Defs>
                  <LinearGradient id="bar" x1="0" y1="0" x2="1" y2="0">
                    <Stop offset="0" stopColor={S.barFrom} />
                    <Stop offset="1" stopColor={S.barTo} />
                  </LinearGradient>
                </Defs>
                <Rect x={0} y={0} width={180} height={5} fill="url(#bar)" />
              </Svg>
            </Animated.View>
          </View>
          <RNText style={{ marginTop: 8, textAlign: 'center', color: S.white, opacity: 0.8, fontSize: 12.5, lineHeight: 18, fontFamily: fontFamily(lang, 500) }}>{status}</RNText>
        </Animated.View>

        {/* viaduct: piers, deck and a moving dashed rail */}
        <Svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0 }} pointerEvents="none">
          {piers.map((x) => (
            <G key={x}>
              <Rect x={x} y={deckY + 18} width={14} height={150} fill={S.deck} />
              <Rect x={x - 8} y={deckY + 10} width={30} height={10} rx={3} fill={S.pierCap} />
            </G>
          ))}
          <Rect x={0} y={deckY} width={W} height={18} fill={S.deck} />
          <Rect x={0} y={deckY - 3} width={W} height={4} fill={S.deckEdge} opacity={0.55} />
        </Svg>
        {/* the dashed rail slides one dash period (30 px) and repeats, so it looks endless */}
        <Animated.View
          pointerEvents="none"
          style={{ position: 'absolute', left: 0, top: deckY + 7, transform: [{ translateX: reduce ? 0 : rail.interpolate({ inputRange: [0, 1], outputRange: [0, -30] }) }] }}
        >
          <Svg width={W + 30} height={2}>
            <Line x1={0} y1={1} x2={W + 30} y2={1} stroke={S.rail} strokeWidth={2} strokeDasharray="14 16" opacity={0.8} />
          </Svg>
        </Animated.View>

        {/* the train, its headlight beam and speed streaks */}
        {reduce ? null : (
          <>
            <Animated.View
              pointerEvents="none"
              style={{ position: 'absolute', left: 0, top: 598 + dy, transform: [{ translateX: train.interpolate({ inputRange: [0, 1], outputRange: [-440, W + 40] }) }] }}
            >
              <Svg width={560} height={70} viewBox="0 0 560 70">
                <Defs>
                  <LinearGradient id="beam" x1="0" y1="0" x2="1" y2="0">
                    <Stop offset="0" stopColor={S.beam} stopOpacity={0.9} />
                    <Stop offset="1" stopColor={S.beam} stopOpacity={0} />
                  </LinearGradient>
                </Defs>
                <Path d="M396 34L560 4V64Z" fill="url(#beam)" opacity={0.5} />
                <Car x={0} />
                <Car x={99} />
                <Car x={198} />
                <Car x={297} cab />
              </Svg>
            </Animated.View>
            {STREAKS.map(([x, y, w], i) => (
              <Animated.View
                key={i}
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  left: x * sx,
                  top: y + dy,
                  width: w,
                  height: 2,
                  borderRadius: 2,
                  backgroundColor: S.white,
                  opacity: streaks[i].interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 0.7, 0] }),
                  transform: [{ translateX: streaks[i].interpolate({ inputRange: [0, 1], outputRange: [0, -260] }) }],
                }}
              />
            ))}
          </>
        )}

        <RNText style={{ position: 'absolute', left: 16, right: 16, bottom: insets.bottom + 34, textAlign: 'center', color: S.white, opacity: 0.7, fontSize: 11.5, lineHeight: 18, fontFamily: fontFamily(lang, 500) }}>
          {credit}
        </RNText>
      </Pressable>
    </Animated.View>
  );
}

export type { SplashProps } from './types';
