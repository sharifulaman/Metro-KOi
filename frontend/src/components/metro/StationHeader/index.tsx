import { View } from 'react-native';

import { useTheme } from '@/theme/useTheme';

import { Chip } from '../../ui/Chip';
import { IconButton } from '../../ui/IconButton';
import { Text } from '../../ui/Text';

import type { StationHeaderProps } from './types';

export function StationHeader({ name, altName, orderLabel, distance, lineChip, favourite, onFavourite, favouriteLabel = 'Favourite', onBack, compact, testID }: StationHeaderProps) {
  const { c, space } = useTheme();
  return (
    <View testID={testID} style={{ gap: space[3] }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space[3] }}>
        {onBack ? <IconButton icon="back" onPress={onBack} accessibilityLabel="Back" elevated /> : null}
        <View style={{ flex: 1 }}>
          <Text variant={compact ? 'title' : 'display'} accessibilityLabel={`${name}, ${altName}`}>
            {name}
          </Text>
          <Text variant="label" tone="muted">
            {[altName, orderLabel].filter(Boolean).join(' · ')}
          </Text>
        </View>
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
