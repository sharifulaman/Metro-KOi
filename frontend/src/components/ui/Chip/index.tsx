import { Pressable, View } from 'react-native';

import { useTheme } from '@/theme/useTheme';

import { Icon } from '../Icon';
import { Text, type TextTone } from '../Text';

import type { ChipProps, ChipTone } from './types';

export function Chip({ label, tone = 'neutral', selected, dot, icon, onPress, elevated, testID, accessibilityLabel }: ChipProps) {
  const { c, radius, size, space, shadow } = useTheme();
  const bgMap: Record<ChipTone, string> = { brand: c.brandTint, neutral: c.surfaceAlt, live: c.liveTint, ink: c.ink };
  const fgMap: Record<ChipTone, TextTone> = { brand: 'brand', neutral: 'ink', live: 'live', ink: 'inverse' };
  const bg = selected ? c.brandDeep : elevated ? c.surface : bgMap[tone];
  const fg: TextTone = selected ? 'onBrand' : elevated ? 'ink' : fgMap[tone];
  return (
    <Pressable
      testID={testID}
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={onPress ? { selected: !!selected } : undefined}
      style={({ pressed }) => [
        {
          minHeight: size.chipH,
          paddingHorizontal: space[4],
          borderRadius: radius.chip,
          backgroundColor: bg,
          flexDirection: 'row',
          alignItems: 'center',
          alignSelf: 'flex-start',
          gap: space[2],
          opacity: pressed ? 0.8 : 1,
        },
        elevated ? shadow.float : null,
      ]}
    >
      {dot ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: dot }} /> : null}
      {icon ? <Icon name={icon} size={16} tone={fg} /> : null}
      <Text variant="label" weight={600} tone={fg} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

export type { ChipProps, ChipTone } from './types';
