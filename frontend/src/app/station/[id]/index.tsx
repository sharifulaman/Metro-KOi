import { useLocalSearchParams, useRouter } from 'expo-router';

import { EmptyState, PlatformGroup, StationHeader } from '@/components/metro';
import { Button, Card, InfoNote, Screen, Stack, Text } from '@/components/ui';
import { platformTitle, toDepartureRows } from '@/features/stations/mappers';
import { useDepartures } from '@/features/stations/useDepartures';
import { stationAltName, stationName, useStations } from '@/features/stations/useStations';
import { useT } from '@/i18n';
import { fmtClock, fmtNum } from '@/lib/fmt';
import { useSettings } from '@/store/settings';

/** Station sheet (spec §10.4, board 2). */
export default function StationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, lang } = useT();
  const router = useRouter();
  const { byId, list, first, last } = useStations();
  const favourites = useSettings((s) => s.favourites);
  const toggleFavourite = useSettings((s) => s.toggleFavourite);
  const st = byId[id];
  const deps = useDepartures(id, 3);
  if (!st) {
    return (
      <Screen>
        <EmptyState icon="info" title={t('empty.notFound')} action={{ label: t('common.back'), onPress: () => router.back() }} />
      </Screen>
    );
  }
  const rows = (dir: 'SB' | 'NB') => toDepartureRows(deps.byDir[dir], (trainId) => router.push(`/train/${trainId}`));
  return (
    <Screen scroll gap={4}>
      <StationHeader
        name={stationName(st, lang)}
        altName={stationAltName(st, lang)}
        orderLabel={t('common.stationNo', { n: fmtNum(st.order, lang), total: fmtNum(list.length, lang) })}
        lineChip={t('common.lineChip')}
        favourite={favourites.includes(st.id)}
        onFavourite={() => toggleFavourite(st.id)}
        favouriteLabel={t('common.favourite')}
        onBack={() => router.back()}
      />
      <Card elevated gap={3}>
        {deps.isTerminusFor.SB ? (
          <InfoNote text={t('station.terminus')} />
        ) : (
          <PlatformGroup platform={1} direction="SB" title={platformTitle('SB', first, last, lang, t)} rows={rows('SB')} emptyText={t('station.noService')} testID="platform-1" />
        )}
        {deps.isTerminusFor.NB ? (
          <InfoNote text={t('station.terminus')} />
        ) : (
          <PlatformGroup platform={2} direction="NB" title={platformTitle('NB', first, last, lang, t)} rows={rows('NB')} emptyText={t('station.noService')} testID="platform-2" />
        )}
      </Card>
      <Stack direction="row" gap={3}>
        <Stack flex>
          <Button label={t('station.view3d')} icon="box" fullWidth onPress={() => router.push(`/station/${st.id}/3d`)} />
        </Stack>
        <Stack flex>
          <Button label={t('station.gates')} icon="gate" variant="secondary" fullWidth onPress={() => router.push(`/station/${st.id}/gates`)} />
        </Stack>
      </Stack>
      <Button label={t('station.insideRoute')} icon="walk" variant="ghost" onPress={() => router.push(`/station/${st.id}/route`)} />
      <Text variant="label" tone="muted" numeric>
        {t('station.todayWindow', { from: fmtClock(deps.window.firstSec, lang), to: fmtClock(deps.window.lastSec, lang) })}
      </Text>
    </Screen>
  );
}
