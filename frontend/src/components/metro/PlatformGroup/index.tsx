import { View } from 'react-native';

import { useTheme } from '@/theme/useTheme';

import { SectionLabel } from '../../ui/SectionLabel';
import { Text } from '../../ui/Text';
import { DepartureRow } from '../DepartureRow';

import type { PlatformGroupProps } from './types';

export function PlatformGroup({ direction, title, rows, emptyText, testID }: PlatformGroupProps) {
  const { c } = useTheme();
  return (
    <View testID={testID}>
      <SectionLabel text={title} colorDot={direction === 'SB' ? c.trainSB : c.trainNB} />
      {rows.length === 0 && emptyText ? (
        <Text variant="label" tone="muted">
          {emptyText}
        </Text>
      ) : (
        rows.map(({ key, ...r }, i) => <DepartureRow key={key} {...r} divider={i < rows.length - 1} />)
      )}
    </View>
  );
}

export type { PlatformGroupProps } from './types';
