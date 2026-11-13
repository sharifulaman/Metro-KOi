import { Pressable, View } from 'react-native';

import { useTheme } from '@/theme/useTheme';

import { Icon } from '../../ui/Icon';
import { Text } from '../../ui/Text';

import type { JourneyPickerProps } from './types';

/** From → To card with the ring/rail/square marker and a swap button (board 6). */
export function JourneyPicker({ fromCaption, toCaption, fromLabel, toLabel, onFrom, onTo, onSwap, swapLabel, testID }: JourneyPickerProps) {
  const { c, space, radius, size, shadow } = useTheme();
  const field = (caption: string, label: string, onPress: () => void, id: string) => (
    <Pressable testID={id} onPress={onPress} accessibilityRole="button" accessibilityLabel={`${caption}: ${label}`} style={{ paddingVertical: space[2], minHeight: size.touch, justifyContent: 'center' }}>
      <Text variant="micro" tone="muted">
        {caption}
      </Text>
      <Text weight={600} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
  return (
    <View
      testID={testID}
      style={[{ flexDirection: 'row', alignItems: 'center', gap: space[3], backgroundColor: c.surface, borderRadius: radius.hero, paddingVertical: space[3], paddingLeft: space[4], paddingRight: space[3] }, shadow.card]}
    >
      <View style={{ alignItems: 'center', gap: space[1] }}>
        <View style={{ width: 12, height: 12, borderRadius: 6, borderWidth: 3, borderColor: c.brandDeep }} />
        <View style={{ width: 2, height: 28, backgroundColor: c.outline }} />
        <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: c.brandDeep }} />
      </View>
      <View style={{ flex: 1 }}>
        {field(fromCaption, fromLabel, onFrom, 'journey-from')}
        <View style={{ height: 1, backgroundColor: c.surfaceAlt }} />
        {field(toCaption, toLabel, onTo, 'journey-to')}
      </View>
      <Pressable
        onPress={onSwap}
        accessibilityRole="button"
        accessibilityLabel={swapLabel}
        style={{ width: size.iconBtn, height: size.iconBtn, borderRadius: size.iconBtn / 2, backgroundColor: c.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}
      >
        <Icon name="swap" />
      </Pressable>
    </View>
  );
}

export type { JourneyPickerProps } from './types';
