import { Pressable, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { Icon } from '@/components/ui';
import { cardGradients, type CardColor } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

import type { CardColorPickerProps } from './types';

const COLORS: CardColor[] = ['green', 'dark', 'gold', 'blue'];
const SIZE = 40;

/** Row of the 4 card colours a rider can pick to tell saved cards apart. */
export function CardColorPicker({ value, onChange, labels, testID }: CardColorPickerProps) {
  const { c, space } = useTheme();
  return (
    <View testID={testID} accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: space[4] }}>
      {COLORS.map((color) => {
        const g = cardGradients[color];
        const selected = color === value;
        return (
          <Pressable
            key={color}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={labels[color]}
            onPress={() => onChange(color)}
            hitSlop={6}
            style={({ pressed }) => ({
              width: SIZE,
              height: SIZE,
              borderRadius: SIZE / 2,
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              borderWidth: selected ? 3 : 0,
              borderColor: c.brand,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Svg width={SIZE} height={SIZE} viewBox="0 0 40 40">
              <Defs>
                <LinearGradient id={`sw-${color}`} x1="0%" y1="0%" x2="85%" y2="100%">
                  <Stop offset="0%" stopColor={g.from} />
                  <Stop offset="55%" stopColor={g.via} />
                  <Stop offset="100%" stopColor={g.to} />
                </LinearGradient>
              </Defs>
              <Rect x={0} y={0} width={40} height={40} fill={`url(#sw-${color})`} />
            </Svg>
            {selected ? <View style={{ position: 'absolute' }}><Icon name="check" size={18} color="#FFFFFF" /></View> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

export type { CardColorPickerProps } from './types';
