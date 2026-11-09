import { useRouter } from 'expo-router';
import { useState } from 'react';

import { ScreenHeader } from '@/components/metro';
import { Button, Card, InfoNote, ListRow, Screen, Segmented, Stack, Text } from '@/components/ui';
import { useNow } from '@/features/common/useNow';
import { stationName, useStations } from '@/features/stations/useStations';
import { useTimetable } from '@/features/timetable/useTimetable';
import { useT } from '@/i18n';
import { fmtClockRange, fmtNum } from '@/lib/fmt';
import { bandsFor, currentBandIndex, dayTypeFor, dhakaClock, hhmmToSec, nextDateOfType, resolveDayType } from '@/lib/schedule';
import type { Direction, ServiceDayType } from '@/models';
import { useClock } from '@/store/clock';

/** Timetable (spec §10.7, board 7). Tapping a band plays it on the live map. */
export default function TimetableScreen() {
  const { t, lang } = useT();
  const router = useRouter();
  const tt = useTimetable();
  const { first, last } = useStations();
  const now = useNow(30000);
  const today = resolveDayType(dayTypeFor(now), tt);
  const [day, setDay] = useState<ServiceDayType>(today);
  const [dir, setDir] = useState<Direction>('SB');
  const bands = bandsFor(tt, day, dir);
  const current = day === today ? currentBandIndex(bands, dhakaClock(now).sec) : -1;
  const [from, to] = dir === 'SB' ? [first, last] : [last, first];

  const watch = (fromHHMM: string) => {
    useClock.getState().start(nextDateOfType(tt, Date.now(), day, hhmmToSec(fromHHMM)), 10);
    router.navigate('/');
  };

  return (
    <Screen scroll gap={4}>
      <ScreenHeader title={t('timetable.title')} onBack={() => router.back()} backLabel={t('common.back')} />
      <Segmented<ServiceDayType> value={day} onChange={setDay} options={(['sun_thu', 'fri', 'sat'] as const).map((d) => ({ value: d, label: t(`timetable.${d}`) }))} testID="day" />
      <Card padding={3}>
        <Stack direction="row" align="center" justify="between" gap={3}>
          <Text weight={700}>{t('timetable.route', { from: stationName(from, lang), to: stationName(to, lang) })}</Text>
          <Button label={t('timetable.flip')} icon="swap" variant="secondary" size="md" onPress={() => setDir(dir === 'SB' ? 'NB' : 'SB')} testID="dir" />
        </Stack>
      </Card>
      <Card padding={3}>
        {bands.map((b, i) => (
          <ListRow
            key={b.from}
            title={fmtClockRange(hhmmToSec(b.from), hhmmToSec(b.to), lang)}
            subtitle={i === current ? t('timetable.running') : undefined}
            highlighted={i === current}
            trailing={
              <Text variant="label" weight={i === current ? 700 : 600} tone={i === current ? 'brand' : 'ink'}>
                {t('timetable.every', { n: fmtNum(b.headwayMin, lang) })}
              </Text>
            }
            onPress={() => watch(b.from)}
            divider={i < bands.length - 1 && i !== current && i + 1 !== current}
          />
        ))}
      </Card>
      <InfoNote icon="play" text={t('timetable.tapToWatch')} />
      <InfoNote text={t('timetable.holiday')} />
      <Text variant="micro" tone="muted">
        {t('timetable.note')} {t('timetable.source', { source: tt.source, date: fmtNum(tt.verifiedAt, lang) })}
      </Text>
    </Screen>
  );
}
