import { Pressable } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { useTheme } from '@/theme/useTheme';

/**
 * Round compass button over the map (like Google Maps): a red needle points north. North-up: tap to turn the
 * map with the phone (heading-up). Heading-up: the needle follows north as the map turns; tap to go back.
 */
export function CompassButton({ headingUp, heading, onPress, label, top = 12 }: { headingUp: boolean; heading: number | null; onPress(): void; label: string; top?: number }) {
  const { c } = useTheme();
  const north = headingUp && heading != null ? -heading : 0;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: headingUp }}
      hitSlop={6}
      style={{
        position: 'absolute',
        top,
        right: 12,
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: c.glassMap,
        borderWidth: headingUp ? 2 : 1,
        borderColor: headingUp ? c.brand : c.glassBorder,
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 14px rgba(14,26,22,0.18)',
      }}
      testID="map-compass"
    >
      <Svg width={30} height={30} viewBox="0 0 30 30" style={{ transform: [{ rotate: `${north}deg` }] }}>
        <Circle cx={15} cy={15} r={13} fill="none" stroke={c.outline} strokeWidth={1.5} />
        <Path d="M15 4 L19 15 L11 15 Z" fill={c.danger} />
        <Path d="M15 26 L11 15 L19 15 Z" fill={c.inkMuted} />
      </Svg>
    </Pressable>
  );
}
