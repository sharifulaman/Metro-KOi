import { useRouter } from 'expo-router';

import { ScreenHeader } from '@/components/metro';
import { Button, Card, Chip, IconTile, InfoNote, ListRow, Screen, Stack } from '@/components/ui';
import { useNow } from '@/features/common/useNow';
import { useRunModel, useTimetable } from '@/features/timetable/useTimetable';
import { stationAltName, stationName, useStations } from '@/features/stations/useStations';
import { useT } from '@/i18n';
import { fmtEtaAt, fmtNum } from '@/lib/fmt';
import { stationDepartures } from '@/lib/schedule';
import { useSettings } from '@/store/settings';

export default function StationsScreen() {
  const { t, lang } = useT();
  const router = useRouter();
  const { list } = useStations();
  const tt = useTimetable();
  const model = useRunModel();
  const now = useNow(15000);
  const favourites = useSettings((s) => s.favourites);
  const ordered = [...list.filter((s) => favourites.includes(s.id)), ...list.filter((s) => !favourites.includes(s.id))];
  return (
    <Screen scroll gap={3}>
      <ScreenHeader title={t('stations.title')} right={<Button label={t('stations.timetable')} variant="ghost" size="md" icon="calendar" onPress={() => router.push('/timetable')} />} />
      <Card padding={3}>
        {ordered.map((s, i) => {
          const d = stationDepartures(tt, model, s.id, now, 1);
          const next = [d.SB[0], d.NB[0]].filter(Boolean).sort((a, b) => a.etaSec - b.etaSec)[0];
          return (
            <ListRow
              key={s.id}
              testID={`station-${s.id}`}
              height="rowLg"
              leading={<IconTile icon={favourites.includes(s.id) ? 'star' : 'train'} letter={favourites.includes(s.id) ? undefined : fmtNum(s.order, lang)} tone={favourites.includes(s.id) ? 'live' : 'brand'} />}
              title={stationName(s, lang)}
              subtitle={stationAltName(s, lang)}
              trailing={next ? <Chip label={`${t('stations.next')} ${fmtEtaAt(next.etaSec, next.atSec, next.source, lang)}`} tone="neutral" /> : undefined}
              chevron
              divider={i < ordered.length - 1}
              onPress={() => router.push(`/station/${s.id}`)}
            />
          );
        })}
      </Card>
      <Stack>
        <InfoNote text={t('app.unofficial')} />
      </Stack>
    </Screen>
  );
}
