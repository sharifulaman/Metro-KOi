import { Pressable, View } from 'react-native';

import { useTheme } from '@/theme/useTheme';

import { Icon } from '../../ui/Icon';
import { Text } from '../../ui/Text';

import type { JourneyPickerProps } from './types';

/** From → To card (design ১৬): ring / rail / square marker, two 56px fields and a round swap button. */
export function JourneyPicker({ fromCaption, toCaption, fromLabel, toLabel, onFrom, onTo, onSwap, swapLabel, testID }: JourneyPickerProps) {
  const { c, shadow } = useTheme();
  const field = (caption: string, label: string, onPress: () => void, id: string, top: number) => (
    <Pressable testID={id} onPress={onPress} accessibilityRole="button" accessibilityLabel={`${caption}: ${label}`} style={{ position: 'absolute', left: 50, right: 80, top, height: 56, justifyContent: 'center' }}>
      <Text size={12} lh={1.3} tone="muted">
        {caption}
      </Text>
      <Text size={19} lh={1.3} weight={700} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
  return (
    <View testID={testID} style={[{ height: 129, borderRadius: 26, backgroundColor: c.surface, borderWidth: 1, borderColor: c.outline }, shadow.card]}>
      <View style={{ position: 'absolute', left: 20, top: 29, width: 14, height: 14, borderRadius: 7, borderWidth: 3, borderColor: c.brand, backgroundColor: c.surface }} />
      <View style={{ position: 'absolute', left: 26, top: 45, width: 2, height: 40, backgroundColor: c.brand, opacity: 0.4 }} />
      <View style={{ position: 'absolute', left: 20, top: 86, width: 14, height: 14, borderRadius: 4, backgroundColor: c.brand }} />
      {field(fromCaption, fromLabel, onFrom, 'journey-from', 8)}
      <View style={{ position: 'absolute', left: 50, right: 14, top: 64, height: 1, backgroundColor: c.outline, opacity: 0.6 }} />
      {field(toCaption, toLabel, onTo, 'journey-to', 65)}
      <Pressable
        onPress={onSwap}
        accessibilityRole="button"
        accessibilityLabel={swapLabel}
        style={{ position: 'absolute', right: 14, top: 42, width: 46, height: 46, borderRadius: 23, backgroundColor: c.brandTint, alignItems: 'center', justifyContent: 'center' }}
      >
        <Icon name="swap" size={21} color={c.onBrandTint} strokeWidth={2.2} />
      </Pressable>
    </View>
  );
}

export type { JourneyPickerProps } from './types';
