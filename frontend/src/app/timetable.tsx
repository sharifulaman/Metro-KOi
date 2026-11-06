import { useRouter } from 'expo-router';
import { useState } from 'react';

import { ScreenHeader } from '@/components/metro';
import { Card, InfoNote, ListRow, Screen, Segmented, Text } from '@/components/ui';
import { useNow } from '@/features/common/useNow';
import { useTimetable } from '@/features/timetable/useTimetable';
import { useT } from '@/i18n';
import { fmtHHMM, fmtNum } from '@/lib/fmt';
import { bandsFor, currentBandIndex, dayTypeFor, dhakaClock, resolveDayType } from '@/lib/schedule';
import type { Direction, ServiceDayType } from '@/models';

/** Timetable (spec §10.7, board 7). */
export default function TimetableScreen() {
  const { t, lang } = useT();
  const router = useRouter();
  const tt = useTimetable();
  const now = useNow(30000);
  const today = resolveDayType(dayTypeFor(now), tt);
  const [day, setDay] = useState<ServiceDayType>(today);
  const [dir, setDir] = useState<Direction>('SB');
  const bands = bandsFor(tt, day, dir);
  const current = day === today ? currentBandIndex(bands, dhakaClock(now).sec) : -1;
  return (
    <Screen scroll gap={4}>
      <ScreenHeader title={t('timetable.title')} onBack={() => router.back()} backLabel={t('common.back')} />
      <Segmented<ServiceDayType> value={day} onChange={setDay} options={(['sun_thu', 'fri', 'sat'] as const).map((d) => ({ value: d, label: t(`timetable.${d}`) }))} testID="day" />
      <Segmented<Direction> variant="tabs" value={dir} onChange={setDir} options={(['SB', 'NB'] as const).map((d) => ({ value: d, label: t(`timetable.${d}`) }))} testID="dir" />
      <Card padding={3}>
        {bands.map((b, i) => (
          <ListRow
            key={b.from}
            title={t('timetable.band', { from: fmtHHMM(b.from, lang), to: fmtHHMM(b.to, lang) })}
            subtitle={t('timetable.every', { n: fmtNum(b.headwayMin, lang) })}
            highlighted={i === current}
            trailing={i === current ? <Text variant="label" tone="brand" weight={700}>{t('timetable.current')}</Text> : undefined}
            divider={i < bands.length - 1 && i !== current && i + 1 !== current}
          />
        ))}
      </Card>
      <InfoNote text={t('timetable.holiday')} />
      <Text variant="micro" tone="muted">
        {t('timetable.source', { source: tt.source, date: fmtNum(tt.verifiedAt, lang) })}
      </Text>
    </Screen>
  );
}
