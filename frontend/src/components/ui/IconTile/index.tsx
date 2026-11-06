import { View } from 'react-native';

import { useTheme } from '@/theme/useTheme';

import { Icon } from '../Icon';
import { Text } from '../Text';

import type { IconTileProps } from './types';

export function IconTile({ icon, tone = 'brand', letter, testID }: IconTileProps) {
  const { c, radius, size } = useTheme();
  const bg = { brand: c.brandTint, live: c.liveTint, neutral: c.surfaceAlt, danger: c.dangerTint }[tone];
  const fg = ({ brand: 'brand', live: 'live', neutral: 'muted', danger: 'danger' } as const)[tone];
  return (
    <View
      testID={testID}
      style={{ width: size.iconTile, height: size.iconTile, borderRadius: radius.tile, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}
    >
      {letter ? (
        <Text variant="title" weight={700} tone={fg}>
          {letter}
        </Text>
      ) : (
        <Icon name={icon} size={20} tone={fg} />
      )}
    </View>
  );
}

export type { IconTileProps } from './types';
