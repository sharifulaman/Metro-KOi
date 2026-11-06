import { useLocalSearchParams, useRouter } from 'expo-router';

import { EmptyState, LineDiagram, ScreenHeader, TrainCard, TrainIllustration } from '@/components/metro';
import { Card, Screen, StatusBadge, Text } from '@/components/ui';
import { stationPos, useTrains } from '@/features/map/useTrains';
import { platformTitle } from '@/features/stations/mappers';
import { stationName, useStations } from '@/features/stations/useStations';
import { useT } from '@/i18n';
import { fmtNum } from '@/lib/fmt';

/** Train detail (spec §10.3, board 3). */
export default function TrainScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, lang } = useT();
  const router = useRouter();
  const { list, byId, first, last } = useStations();
  const { trains, model } = useTrains(1000);
  const train = trains.find((x) => x.id === id);
  if (!train) {
    return (
      <Screen>
        <ScreenHeader title={t('train.title', { id })} onBack={() => router.back()} />
        <EmptyState icon="train" title={t('train.departed')} />
      </Screen>
    );
  }
  const live = train.state !== 'ESTIMATED';
  const next = train.nextStation ? byId[train.nextStation] : undefined;
  return (
    <Screen scroll gap={4}>
      <ScreenHeader title={t('train.title', { id: train.id })} onBack={() => router.back()} backLabel={t('common.back')} right={<StatusBadge kind={live ? 'live' : 'estimated'} />} />
      <TrainIllustration direction={train.dir} width={320} />
      <TrainCard
        platform={train.dir === 'SB' ? 1 : 2}
        title={platformTitle(train.dir, first, last, lang, t)}
        eta={train.etaSec != null ? { sec: train.etaSec } : undefined}
        source={live ? 'live' : 'schedule'}
        trainId={train.id}
        detail={[next ? t('train.next', { name: stationName(next, lang) }) : null, live ? t('train.riders', { count: fmtNum(train.riders, lang) }) : t('train.noRiders')].filter(Boolean).join(' · ')}
        labels={{ atStation: t('train.atStation'), departed: t('train.departed') }}
      />
      <Card padding={4}>
        <LineDiagram
          stations={list.map((s) => ({ id: s.id, label: stationName(s, lang) }))}
          trains={[{ id: train.id, dir: train.dir, state: train.state, pos: stationPos(model, train.s) }]}
          highlightStation={train.nextStation ?? undefined}
        />
      </Card>
      <Text variant="micro" tone="muted">
        {t('app.unofficial')}
      </Text>
    </Screen>
  );
}
