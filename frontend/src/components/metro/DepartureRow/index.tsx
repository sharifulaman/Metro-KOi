import { Pressable, View } from 'react-native';

import { useT } from '@/i18n';
import { fmtEtaAt } from '@/lib/fmt';
import { useTheme } from '@/theme/useTheme';

import { StatusBadge } from '../../ui/StatusBadge';
import { Text } from '../../ui/Text';

import type { DepartureRowProps } from './types';

/**
 * One upcoming train (board 2): ETA · note · LIVE / Estimated badge.
 * The note defaults to the train id (live) or "By the timetable" (schedule).
 */
export function DepartureRow({ etaSec, atSec, source, trainId, note, trailing, onPress, divider, testID }: DepartureRowProps) {
  const { c, space, size } = useTheme();
  const { lang, t } = useT();
  const eta = fmtEtaAt(etaSec, atSec, source, lang);
  const line = [source === 'live' ? trainId : null, note ?? (source === 'schedule' ? t('train.byTimetable') : null)].filter(Boolean).join(' · ');
  return (
    <Pressable
      testID={testID}
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={[eta, t(source === 'live' ? 'common.live' : 'common.estimated'), line].filter(Boolean).join(', ')}
      style={{
        minHeight: size.row,
        flexDirection: 'row',
        alignItems: 'center',
        gap: space[3],
        borderBottomWidth: divider ? 1 : 0,
        borderBottomColor: c.surfaceAlt,
      }}
    >
      <View style={{ minWidth: 96 }}>
        <Text variant="title" weight={700} numeric>
          {eta}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="label" tone="muted" numeric numberOfLines={2}>
          {line}
        </Text>
      </View>
      {trailing ? (
        <Text variant="label" weight={600} numeric>
          {trailing}
        </Text>
      ) : null}
      {/* the badge pins itself to flex-start; centre it in the row */}
      <View style={{ justifyContent: 'center' }}>
        <StatusBadge kind={source === 'live' ? 'live' : 'estimated'} />
      </View>
    </Pressable>
  );
}

export type { DepartureRowProps } from './types';
