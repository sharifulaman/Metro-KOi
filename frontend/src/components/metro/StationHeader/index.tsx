import { Pressable, View } from 'react-native';

import { useTheme } from '@/theme/useTheme';

import { Chip } from '../../ui/Chip';
import { Icon } from '../../ui/Icon';
import { IconButton } from '../../ui/IconButton';
import { Text } from '../../ui/Text';

import type { StationHeaderProps } from './types';

export function StationHeader({
  name,
  altName,
  orderLabel,
  distance,
  lineChip,
  favourite,
  onFavourite,
  favouriteLabel = 'Favourite',
  onBack,
  onPrev,
  onNext,
  prevLabel = 'Previous',
  nextLabel = 'Next',
  onPress,
  compact,
  testID,
}: StationHeaderProps) {
  const { c, space } = useTheme();
  const stepper = (label: string, icon: 'back' | 'chevron', press?: () => void) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={press}
      disabled={!press}
      hitSlop={4}
      style={({ pressed }) => ({
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: c.divider,
        backgroundColor: c.surface,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: !press ? 0.4 : pressed ? 0.8 : 1,
      })}
    >
      <Icon name={icon} size={20} />
    </Pressable>
  );
  return (
    <View testID={testID} style={{ gap: space[3] }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space[3] }}>
        {onBack ? <IconButton icon="back" onPress={onBack} accessibilityLabel="Back" elevated /> : null}
        <Pressable disabled={!onPress} onPress={onPress} accessibilityRole={onPress ? 'button' : undefined} accessibilityLabel={`${name}, ${altName}`} style={{ flex: 1 }}>
          <Text variant={compact ? 'title' : 'display'}>{name}</Text>
          <Text variant="label" tone="muted">
            {[altName, orderLabel].filter(Boolean).join(' · ')}
          </Text>
        </Pressable>
        {onPrev || onNext ? (
          <View style={{ flexDirection: 'row', gap: space[2] }}>
            {stepper(prevLabel, 'back', onPrev)}
            {stepper(nextLabel, 'chevron', onNext)}
          </View>
        ) : null}
        {onFavourite ? <IconButton icon="star" active={favourite} onPress={onFavourite} accessibilityLabel={favouriteLabel} /> : null}
      </View>
      {!compact && (lineChip || distance) ? (
        <View style={{ flexDirection: 'row', gap: space[2], flexWrap: 'wrap' }}>
          {lineChip ? <Chip label={lineChip} tone="brand" dot={c.brand} /> : null}
          {distance ? <Chip label={distance} icon="walk" /> : null}
        </View>
      ) : null}
    </View>
  );
}

export type { StationHeaderProps } from './types';
