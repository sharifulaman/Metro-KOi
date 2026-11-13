import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';

import { useT } from '@/i18n';
import { motion } from '@/theme/tokens';
import { useReduceMotion } from '@/theme/useReduceMotion';
import { useTheme } from '@/theme/useTheme';

import { Text } from '../Text';

import type { StatusBadgeProps } from './types';

export function LiveDot({ size = 8 }: { size?: number }) {
  const { c } = useTheme();
  const reduce = useReduceMotion();
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) return;
    const loop = Animated.loop(Animated.timing(pulse, { toValue: 1, duration: motion.livePulseMs, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [pulse, reduce]);
  return (
    <View style={{ width: size * 2, height: size * 2, alignItems: 'center', justifyContent: 'center' }}>
      {!reduce && (
        <Animated.View
          style={{
            position: 'absolute',
            width: size * 2,
            height: size * 2,
            borderRadius: size,
            backgroundColor: c.live,
            opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
            transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.4] }) }],
          }}
        />
      )}
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: c.live }} />
    </View>
  );
}

export function StatusBadge({ kind, label, testID }: StatusBadgeProps) {
  const { c, radius, space } = useTheme();
  const { t } = useT();
  const bg = kind === 'live' ? c.liveTint : kind === 'delayed' ? c.dangerTint : kind === 'stop' ? c.brandTint : c.surfaceAlt;
  const text = label ?? t(kind === 'live' ? 'common.live' : kind === 'delayed' ? 'common.delayed' : kind === 'stop' ? 'live.atStation' : 'common.estimated');
  return (
    <View
      testID={testID}
      accessibilityLabel={text}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: space[1],
        paddingHorizontal: space[2],
        paddingVertical: 2,
        borderRadius: radius.chip,
        backgroundColor: bg,
        borderWidth: kind === 'estimated' ? 1 : 0,
        borderStyle: 'dashed',
        borderColor: c.estimated,
      }}
    >
      {kind === 'live' && <LiveDot size={6} />}
      <Text variant="micro" weight={700} tone={kind === 'live' ? 'live' : kind === 'delayed' ? 'danger' : kind === 'stop' ? 'brand' : 'estimated'}>
        {text}
      </Text>
    </View>
  );
}

export type { StatusBadgeProps, StatusKind } from './types';
