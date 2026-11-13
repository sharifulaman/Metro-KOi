import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Share } from 'react-native';

import { EmptyState, JourneyOptionCard, JourneyPicker, ScreenHeader } from '@/components/metro';
import { Button, Chip, InfoNote, ListRow, Screen, Sheet, Stack, Text } from '@/components/ui';
import { useJourney } from '@/features/journey/useJourney';
import { stationName, useStations } from '@/features/stations/useStations';
import { useT } from '@/i18n';
import { fmtClock, fmtDuration, fmtEta, fmtNum, fmtTaka } from '@/lib/fmt';
import type { JourneyOption } from '@/models';

type Field = 'from' | 'to';
const LATER = [15, 30, 60] as const;

/** Journey planner (spec §10.6, board 6). */
export default function JourneyScreen() {
  const { t, lang } = useT();
  const router = useRouter();
  const { list, byId } = useStations();
  const [from, setFrom] = useState<string | null>('farmgate');
  const [to, setTo] = useState<string | null>('motijheel');
  const [picking, setPicking] = useState<Field | null>(null);
  const [laterMin, setLaterMin] = useState(0);
  const [showLater, setShowLater] = useState(false);
  const { options, faresAvailable } = useJourney(from, to, 3, laterMin);
  const name = (id: string | null) => (id && byId[id] ? stationName(byId[id], lang) : t('journey.pick'));
  const stops = from && to && byId[from] && byId[to] ? Math.abs(byId[to].order - byId[from].order) : 0;

  // waitSec is measured from the chosen leave time; show it from now
  const waitOf = (o: JourneyOption) => o.waitSec + laterMin * 60;
  // big times as in board 6: "২:০৩" (Bangla drops the period word), "2:03 PM"
  const clock = (sec: number) => (lang === 'bn' ? fmtClock(sec, lang).split(' ').slice(1).join(' ') : fmtClock(sec, lang));
  const leaves = (o: JourneyOption) => {
    const w = waitOf(o);
    return w >= 3600 ? t('journey.leavesAt', { time: fmtClock(o.departSec, lang) }) : t('journey.leavesInShort', { eta: fmtEta(w, o.source, lang) });
  };
  const fare = (o: JourneyOption) => (o.fareBdt != null ? t('journey.fareShort', { amount: fmtTaka(o.fareBdt, lang) }) : t('journey.fareUnavailable'));

  const shareEta = () => {
    const o = options[0];
    if (!o) return;
    void Share.share({ message: `${name(from)} → ${name(to)}: ${t('journey.leaves', { time: fmtClock(o.departSec, lang) })}, ${t('journey.arrives', { time: fmtClock(o.arriveSec, lang), dur: fmtDuration(o.durationSec, lang) })}` });
  };

  return (
    <Screen scroll gap={4} withTabBar>
      <ScreenHeader title={t('journey.plan')} right={<Button label={t('stations.timetable')} variant="ghost" size="md" icon="calendar" onPress={() => router.push('/timetable')} />} />
      <JourneyPicker
        fromCaption={t('journey.from')}
        toCaption={t('journey.to')}
        fromLabel={name(from)}
        toLabel={name(to)}
        onFrom={() => setPicking('from')}
        onTo={() => setPicking('to')}
        onSwap={() => {
          setFrom(to);
          setTo(from);
        }}
        swapLabel={t('journey.swap')}
      />

      <Stack direction="row" gap={2} wrap>
        <Chip
          label={t('journey.leaveNow')}
          tone={laterMin === 0 && !showLater ? 'brand' : 'neutral'}
          selected={laterMin === 0 && !showLater}
          onPress={() => {
            setLaterMin(0);
            setShowLater(false);
          }}
        />
        <Chip label={t('journey.leaveLater')} tone={showLater ? 'brand' : 'neutral'} selected={showLater} onPress={() => setShowLater(true)} />
        {showLater
          ? LATER.map((m) => (
              <Chip key={m} label={t('journey.laterIn', { n: fmtDuration(m * 60, lang) })} tone={laterMin === m ? 'ink' : 'neutral'} selected={laterMin === m} onPress={() => setLaterMin(m)} />
            ))
          : null}
      </Stack>

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

      <Stack direction="row" justify="between" align="end">
        <Text weight={700}>{t('journey.nextTrains')}</Text>
        {options[0] ? (
          <Text variant="label" tone="muted" numeric>
            {t('journey.summary', { n: fmtNum(stops, lang), dur: fmtDuration(options[0].durationSec, lang) })}
          </Text>
        ) : null}
      </Stack>

      {from === to ? (
        <EmptyState compact icon="route" title={t('journey.same')} />
      ) : options.length === 0 ? (
        <EmptyState compact icon="clock" title={t('journey.none')} action={{ label: t('stations.timetable'), onPress: () => router.push('/timetable') }} />
      ) : (
        <Stack gap={3}>
          {options.map((o, i) =>
            i === 0 ? (
              <JourneyOptionCard
                key={o.trainId}
                best
                bestLabel={t('journey.fastest')}
                depart={clock(o.departSec)}
                arrive={clock(o.arriveSec)}
                waitText={waitOf(o) >= 3600 ? t('journey.leavesAt', { time: fmtClock(o.departSec, lang) }) : t('journey.leavesIn', { eta: fmtEta(waitOf(o), o.source, lang) })}
                arriveText={t('journey.arriveWord')}
                source={o.source}
                footerLeft={t('journey.platformTrain', { n: fmtNum(o.direction === 'SB' ? 1 : 2, lang), id: o.trainId })}
                footerRight={fare(o)}
                onPress={() => router.push(`/train/${o.trainId}`)}
                testID="journey-best"
              />
            ) : (
              <JourneyOptionCard
                key={o.trainId}
                depart={clock(o.departSec)}
                arrive={clock(o.arriveSec)}
                waitText={leaves(o)}
                arriveText={t('journey.arriveAt', { time: clock(o.arriveSec) })}
                source={o.source}
                onPress={() => router.push(`/train/${o.trainId}`)}
              />
            ),
          )}
        </Stack>
      )}
      {!faresAvailable ? <InfoNote icon="ticket" text={t('journey.fareUnavailable')} /> : null}
      {options.length > 0 ? <Button label={t('journey.shareEta')} icon="share" variant="secondary" fullWidth onPress={shareEta} /> : null}
      <Text variant="micro" tone="muted">
        {t('journey.disclaimer')}
      </Text>
    </Screen>
  );
}
