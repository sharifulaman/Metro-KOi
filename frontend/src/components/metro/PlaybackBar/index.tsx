import { View } from 'react-native';

import { useTheme } from '@/theme/useTheme';

import { Chip } from '../../ui/Chip';
import { Icon } from '../../ui/Icon';
import { IconButton } from '../../ui/IconButton';
import { Text } from '../../ui/Text';

import type { PlaybackBarProps } from './types';

/** Floating bar while the map runs the timetable on a virtual clock. */
export function PlaybackBar({ title, timeLabel, rates, rate, onRate, onClose, closeLabel, testID }: PlaybackBarProps) {
  const { c, space, radius, shadow } = useTheme();
  return (
    <View
      testID={testID}
      accessibilityLiveRegion="polite"
      style={[{ backgroundColor: c.surface, borderRadius: radius.card, paddingVertical: space[2], paddingLeft: space[3], paddingRight: space[1], gap: space[2] }, shadow.float]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[2] }}>
        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: c.brandTint, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="play" size={16} tone="brand" />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="micro" tone="muted" numberOfLines={1}>
            {title}
          </Text>
          <Text weight={700} numeric numberOfLines={1}>
            {timeLabel}
          </Text>
        </View>
        <IconButton icon="close" accessibilityLabel={closeLabel} onPress={onClose} />
      </View>
      <View style={{ flexDirection: 'row', gap: space[2] }}>
        {rates.map((r) => (
          <Chip key={r.value} label={r.label} selected={r.value === rate} tone={r.value === rate ? 'brand' : 'neutral'} onPress={() => onRate(r.value)} />
        ))}
      </View>
    </View>
  );
}

export type { PlaybackBarProps } from './types';
