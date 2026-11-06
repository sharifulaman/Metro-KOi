import { View } from 'react-native';

import { useT } from '@/i18n';
import { fmtEta } from '@/lib/fmt';
import { useTheme } from '@/theme/useTheme';

import { Card } from '../../ui/Card';
import { StatusBadge } from '../../ui/StatusBadge';
import { Text } from '../../ui/Text';
import { CoachCrowdBar } from '../CoachCrowdBar';

import type { TrainCardProps } from './types';

/** Shared by the Station sheet, the Train sheet and the 3D panel (spec §9.5). */
export function TrainCard({ platform, title, eta, source, trainId, detail, crowd, emptiestCoach, labels, compact, onPress, testID }: TrainCardProps) {
  const { c, space } = useTheme();
  const { lang } = useT();
  const etaText = !eta ? '—' : 'sec' in eta ? fmtEta(eta.sec, source, lang) : eta.state === 'at_station' ? labels?.atStation ?? '' : labels?.departed ?? '';
  return (
    <Card elevated padding={compact ? 3 : 4} gap={compact ? 2 : 3} onPress={onPress} testID={testID} accessibilityLabel={`${title}, ${etaText}`}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[3] }}>
        <View style={{ width: 6, alignSelf: 'stretch', borderRadius: 3, backgroundColor: platform === 1 ? c.trainSB : c.trainNB }} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="label" tone="muted" weight={600}>
            {title}
          </Text>
          <Text variant={compact ? 'title' : 'countdown'} numeric tone={source === 'live' ? 'ink' : 'muted'}>
            {etaText}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: space[1] }}>
          <StatusBadge kind={source === 'live' ? 'live' : 'estimated'} />
          {trainId ? (
            <Text variant="micro" tone="muted" numeric>
              {trainId}
            </Text>
          ) : null}
        </View>
      </View>
      {detail ? (
        <Text variant="label" tone="muted">
          {detail}
        </Text>
      ) : null}
      {crowd ? (
        <View style={{ gap: space[1] }}>
          <CoachCrowdBar values={crowd} showLegend={!compact} legend={labels?.legend} />
          {emptiestCoach != null && labels?.emptiest ? (
            <Text variant="label" tone="brand" weight={600}>
              {labels.emptiest}
            </Text>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

export type { TrainCardProps } from './types';
