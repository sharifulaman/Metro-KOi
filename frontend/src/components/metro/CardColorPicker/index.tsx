import { Image, Pressable, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { cardGradients, type CardColor } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

import { Icon } from '../../ui/Icon';

import type { CardColorPickerProps } from './types';

const COLORS: CardColor[] = ['green', 'dark', 'gold', 'blue'];
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ORIGINAL_ART = require('../../../../assets/rapid-pass-card.png');

/** Row of the 4 card colours, plus (Rapid Pass cards) the original card picture; the chosen one gets a 3px gap + 2px brand ring (design). */
export function CardColorPicker({ value, onChange, labels, size = 40, ringOn = 'surface', original = false, testID }: CardColorPickerProps) {
  const { c } = useTheme();
  const gap = ringOn === 'surface' ? c.surface : c.bg;
  return (
    <View testID={testID} accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: 14, paddingLeft: 4, paddingVertical: 5 }}>
      {(original ? [...COLORS, 'original' as CardColor] : COLORS).map((color) => {
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
            style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', boxShadow: selected ? '0 0 0 3px ' + gap + ', 0 0 0 5px ' + c.brand : undefined }}
          >
            <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }}>
              {color === 'original' ? (
                <Image source={ORIGINAL_ART} resizeMode="cover" style={{ width: size, height: size }} />
              ) : (
              <Svg width={size} height={size} viewBox="0 0 40 40">
                <Defs>
                  <LinearGradient id={'sw-' + color} x1="0%" y1="0%" x2="85%" y2="100%">
                    <Stop offset="0%" stopColor={g.from} />
                    <Stop offset="55%" stopColor={g.via} />
                    <Stop offset="100%" stopColor={g.to} />
                  </LinearGradient>
                </Defs>
                <Rect x={0} y={0} width={40} height={40} fill={'url(#sw-' + color + ')'} />
              </Svg>
              )}
            </View>
            {selected ? (
              <View style={{ position: 'absolute', width: size * 0.56, height: size * 0.56, borderRadius: size * 0.28, alignItems: 'center', justifyContent: 'center', backgroundColor: color === 'original' ? 'rgba(14,26,22,0.55)' : 'transparent' }}>
                <Icon name="check" size={size / 2} color="#FFFFFF" strokeWidth={2.8} />
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

export type { CardColorPickerProps } from './types';
