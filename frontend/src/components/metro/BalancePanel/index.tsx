import { View } from 'react-native';

import { useT } from '@/i18n';
import { fmtTaka } from '@/lib/fmt';
import { useTheme } from '@/theme/useTheme';

import { Card } from '../../ui/Card';
import { Chip } from '../../ui/Chip';
import { IconTile } from '../../ui/IconTile';
import { Text } from '../../ui/Text';

import type { BalancePanelProps } from './types';

/** The "current balance" card on the wallet home and the Found/save screen — reads from the card, or says it couldn't. */
export function BalancePanel({ label, badgeLabel, badgeTone, balanceBdt, caption, noInfoLabel, testID }: BalancePanelProps) {
  const { space } = useTheme();
  const { lang } = useT();
  const known = balanceBdt != null;
  return (
    <Card radius="hero" padding={4} gap={1} testID={testID}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="label" tone="muted" weight={700}>
          {label}
        </Text>
        <Chip label={badgeLabel} tone={badgeTone === 'brand' ? 'brand' : 'neutral'} icon={badgeTone === 'brand' ? 'nfc' : undefined} />
      </View>
      {known ? (
        <Text variant="countdown" numeric>
          {fmtTaka(balanceBdt, lang)}
        </Text>
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[3], marginTop: space[1] }}>
          <IconTile icon="info" tone="neutral" />
          <Text variant="title">{noInfoLabel}</Text>
        </View>
      )}
      <Text variant="label" tone="muted">
        {caption}
      </Text>
    </Card>
  );
}

export type { BalancePanelProps } from './types';
