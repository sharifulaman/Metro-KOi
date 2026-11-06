import { View } from 'react-native';

import { useT } from '@/i18n';
import { fmtTaka } from '@/lib/fmt';
import { useTheme } from '@/theme/useTheme';

import { Card } from '../../ui/Card';
import { Icon } from '../../ui/Icon';
import { Text } from '../../ui/Text';

import type { BalanceCardProps } from './types';

export function BalanceCard({ balanceBdt, lastTap, cardTail, source, labels, testID }: BalanceCardProps) {
  const { space } = useTheme();
  const { lang } = useT();
  return (
    <Card tone="brand" radius="hero" padding={5} gap={2} testID={testID}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="label" tone="onBrand" weight={600}>
          {labels.title}
        </Text>
        <Icon name={source === 'card' ? 'nfc' : 'history'} tone="onBrand" />
      </View>
      <Text variant="display" tone="onBrand" numeric>
        {balanceBdt == null ? labels.unavailable : fmtTaka(balanceBdt, lang)}
      </Text>
      <View style={{ gap: space[1] }}>
        {lastTap ? (
          <Text variant="label" tone="onBrand">
            {lastTap}
          </Text>
        ) : null}
        {cardTail ? (
          <Text variant="label" tone="onBrand" numeric>
            {cardTail}
          </Text>
        ) : null}
        <Text variant="micro" tone="onBrand">
          {labels.source}
        </Text>
      </View>
    </Card>
  );
}

export type { BalanceCardProps } from './types';
