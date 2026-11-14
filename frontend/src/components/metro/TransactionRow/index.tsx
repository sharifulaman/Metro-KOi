import { View } from 'react-native';

import { useTheme } from '@/theme/useTheme';

import { Icon } from '../../ui/Icon';
import { Text } from '../../ui/Text';

import type { TransactionRowProps } from './types';

/** One trip or recharge in a history list (design: 38px tile, title 15/600, time 12.5, amount 15/700). */
export function TransactionRow({ kind, title, time, amount, divider, testID }: TransactionRowProps) {
  const { c } = useTheme();
  const trip = kind === 'trip';
  return (
    <View testID={testID}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 10 }}>
        <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: trip ? c.surfaceAlt : c.brandTint, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={trip ? 'train' : 'circlePlus'} size={20} color={trip ? c.ink : c.onBrandTint} />
        </View>
        <View style={{ flex: 1 }}>
          <Text size={15} lh={1.35} weight={600} numberOfLines={1}>
            {title}
          </Text>
          <Text size={12.5} lh={1.4} tone="muted" weight={400}>
            {time}
          </Text>
        </View>
        <Text size={15} weight={700} lh={1.35} color={trip ? c.ink : c.onBrandTint}>
          {amount}
        </Text>
      </View>
      {divider ? <View style={{ height: 1, backgroundColor: c.divider, marginHorizontal: 14 }} /> : null}
    </View>
  );
}

export type { TransactionRowProps } from './types';
