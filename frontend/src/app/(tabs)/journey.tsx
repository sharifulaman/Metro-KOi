import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Share } from 'react-native';

import { DepartureRow, EmptyState, LineDiagram, ScreenHeader } from '@/components/metro';
import { Button, Card, Chip, IconButton, InfoNote, ListRow, Screen, SectionLabel, Sheet, Stack, Text } from '@/components/ui';
import { useJourney } from '@/features/journey/useJourney';
import { stationName, useStations } from '@/features/stations/useStations';
import { useT } from '@/i18n';
import { fmtClock, fmtDuration, fmtTaka } from '@/lib/fmt';

type Field = 'from' | 'to';

export default function JourneyScreen() {
  const { t, lang } = useT();
  const router = useRouter();
  const { list, byId } = useStations();
  const [from, setFrom] = useState<string | null>('mirpur-10');
  const [to, setTo] = useState<string | null>('farmgate');
  const [picking, setPicking] = useState<Field | null>(null);
  const { options, faresAvailable } = useJourney(from, to);
  const name = (id: string | null) => (id && byId[id] ? stationName(byId[id], lang) : t('journey.pick'));
  const range: [number, number] | undefined = from && to ? [byId[from].order - 1, byId[to].order - 1] : undefined;

  const shareEta = () => {
    const o = options[0];
    if (!o) return;
    void Share.share({ message: `${name(from)} → ${name(to)}: ${t('journey.leaves', { time: fmtClock(o.departSec, lang) })}, ${t('journey.arrives', { time: fmtClock(o.arriveSec, lang), dur: fmtDuration(o.durationSec, lang) })}` });
  };

  return (
    <Screen scroll gap={4}>
      <ScreenHeader title={t('journey.title')} right={<Button label={t('stations.timetable')} variant="ghost" size="md" icon="calendar" onPress={() => router.push('/timetable')} />} />
      <Card elevated gap={2}>
        <ListRow title={name(from)} subtitle={t('journey.from')} leading={<Chip label="A" tone="brand" />} onPress={() => setPicking('from')} chevron divider testID="journey-from" />
        <Stack direction="row" justify="between">
          <ListRow title={name(to)} subtitle={t('journey.to')} leading={<Chip label="B" tone="ink" />} onPress={() => setPicking('to')} chevron testID="journey-to" />
          <IconButton
            icon="swap"
            accessibilityLabel={t('journey.swap')}
            onPress={() => {
              setFrom(to);
              setTo(from);
            }}
          />
        </Stack>
      </Card>

      {picking ? (
        <Sheet onToggle={() => setPicking(null)}>
          <Text variant="title">{t(picking === 'from' ? 'journey.from' : 'journey.to')}</Text>
          {list.map((s, i) => (
            <ListRow
              key={s.id}
              title={stationName(s, lang)}
              highlighted={(picking === 'from' ? from : to) === s.id}
              divider={i < list.length - 1}
              onPress={() => {
                if (picking === 'from') setFrom(s.id);
                else setTo(s.id);
                setPicking(null);
              }}
            />
          ))}
        </Sheet>
      ) : null}

      {range ? <LineDiagram orientation="horizontal" stations={list.map((s) => ({ id: s.id, label: stationName(s, lang) }))} range={range} /> : null}

      <SectionLabel text={t('journey.nextTrains')} />
      {from === to ? (
        <EmptyState compact icon="route" title={t('journey.same')} />
      ) : options.length === 0 ? (
        <EmptyState compact icon="clock" title={t('journey.none')} action={{ label: t('stations.timetable'), onPress: () => router.push('/timetable') }} />
      ) : (
        <Card padding={3}>
          {options.map((o, i) => (
            <DepartureRow
              key={o.trainId}
              etaSec={o.waitSec}
              atSec={o.departSec}
              source={o.source}
              note={`${t('journey.leaves', { time: fmtClock(o.departSec, lang) })} · ${t('journey.arrives', { time: fmtClock(o.arriveSec, lang), dur: fmtDuration(o.durationSec, lang) })}`}
              trailing={o.fareBdt != null ? fmtTaka(o.fareBdt, lang) : undefined}
              divider={i < options.length - 1}
            />
          ))}
        </Card>
      )}
      {!faresAvailable ? <InfoNote icon="ticket" text={t('journey.fareUnavailable')} /> : null}
      {options.length > 0 ? <Button label={t('journey.shareEta')} icon="share" variant="secondary" fullWidth onPress={shareEta} /> : null}
    </Screen>
  );
}
