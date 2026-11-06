import { Pressable, View } from 'react-native';

import { useT } from '@/i18n';
import { fmtEtaAt } from '@/lib/fmt';
import { useTheme } from '@/theme/useTheme';

import { StatusBadge } from '../../ui/StatusBadge';
import { Text } from '../../ui/Text';

import type { DepartureRowProps } from './types';

/** One upcoming train. Shows LIVE / Estimated automatically from `source`. */
export function DepartureRow({ etaSec, atSec, source, trainId, note, trailing, onPress, divider, testID }: DepartureRowProps) {
  const { c, space, size } = useTheme();
  const { lang, t } = useT();
  const eta = fmtEtaAt(etaSec, atSec, source, lang);
  return (
    <Pressable
      testID={testID}
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={[eta, t(source === 'live' ? 'common.live' : 'common.estimated'), trainId, note].filter(Boolean).join(', ')}
      style={{
        minHeight: size.row,
        flexDirection: 'row',
        alignItems: 'center',
        gap: space[3],
        borderBottomWidth: divider ? 1 : 0,
        borderBottomColor: c.divider,
      }}
    >
      <View style={{ minWidth: 86 }}>
        <Text variant="title" weight={700} numeric tone={source === 'live' ? 'ink' : 'muted'}>
          {eta}
        </Text>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[2] }}>
          <StatusBadge kind={source === 'live' ? 'live' : 'estimated'} />
          {trainId ? (
            <Text variant="label" tone="muted" numeric>
              {trainId}
            </Text>
          ) : null}
        </View>
        {note ? (
          <Text variant="label" tone="muted" numeric>
            {note}
          </Text>
        ) : null}
      </View>
      {trailing ? (
        <Text variant="label" weight={600} numeric>
          {trailing}
        </Text>
      ) : null}
    </Pressable>
  );
}

export type { DepartureRowProps } from './types';
