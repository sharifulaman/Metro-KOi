import { useT } from '@/i18n';
import { fmtTaka } from '@/lib/fmt';

import { IconTile } from '../../ui/IconTile';
import { ListRow } from '../../ui/ListRow';
import { Text } from '../../ui/Text';

import type { TransactionRowProps } from './types';

/** Preset of ListRow for trips and recharges. */
export function TransactionRow({ kind, title, time, amountBdt, sample, sampleLabel, divider, testID }: TransactionRowProps) {
  const { lang } = useT();
  const sign = kind === 'trip' ? '−' : '+';
  return (
    <ListRow
      testID={testID}
      leading={<IconTile icon={kind === 'trip' ? 'train' : 'wallet'} tone={kind === 'trip' ? 'brand' : 'live'} />}
      title={title}
      subtitle={[time, sample ? sampleLabel : null].filter(Boolean).join(' · ')}
      trailing={
        <Text weight={700} numeric tone={kind === 'trip' ? 'ink' : 'brand'}>
          {sign}
          {fmtTaka(amountBdt, lang)}
        </Text>
      }
      divider={divider}
    />
  );
}

export type { TransactionRowProps } from './types';
