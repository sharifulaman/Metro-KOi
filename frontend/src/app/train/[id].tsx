import { useLocalSearchParams } from 'expo-router';

import { EmptyState, ScreenHeader, SegmentProgress, TrainTimeline, type TimelineStop } from '@/components/metro';
import { Card, Chip, Screen, Stack, StatusBadge, Text } from '@/components/ui';
import { useTrainRun } from '@/features/map/useTrainRun';
import { stationName, useStations } from '@/features/stations/useStations';
import { useT } from '@/i18n';
import { fmtClock, fmtEta, fmtEtaAt, fmtNum, fmtSpeed } from '@/lib/fmt';
import { useSettings } from '@/store/settings';
import { goBack } from '@/lib/nav';

/** Train detail (spec §10.3, board 3): where the train is and every stop on its run. */
export default function TrainScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, lang } = useT();
  const { byId, first, last } = useStations();
  // "your station" is only a station the rider saved; with none saved, no stop is tagged (never the app's default station)
  const mine = useSettings((s) => s.favourites[0]);
  const run = useTrainRun(id);
  const name = (sid: string) => (byId[sid] ? stationName(byId[sid], lang) : sid);

  if (run.phase === 'unknown' || !run.dir) {
    return (
      <Screen>
        <ScreenHeader title={t('train.title', { id })} onBack={() => goBack()} backLabel={t('common.back')} />
        <EmptyState icon="train" title={t('train.unknown')} />
      </Screen>
    );
  }

  const { train, segment, stops, dir } = run;
  const live = train != null && train.state !== 'ESTIMATED';
  const source = live ? 'live' : 'schedule';
  const from = dir === 'SB' ? first : last;
  const to = dir === 'SB' ? last : first;
  // while standing at a station, "next" is the stop after it
  const next = stops.find((s) => !s.passed && !s.here);
  const here = stops.find((s) => s.here);
  const firstStop = stops[0];
  const lastStop = stops[stops.length - 1];
  const prev = here ?? stops[Math.max(0, run.markerAfter ?? 0)];

  const timeline: TimelineStop[] = stops.map((s) => ({
    key: s.stationId,
    label: name(s.stationId),
    state: s.passed ? 'passed' : 'upcoming',
    tag: s.stationId === mine ? t('train.yourStation') : undefined,
    right: s.passed
      ? s.departSec != null
        ? fmtClock(s.departSec, lang)
        : t('train.passed')
      : s.here
        ? t('train.now')
        : s.etaSec != null
          ? run.phase === 'before'
            ? fmtClock(s.arriveSec ?? 0, lang)
            : fmtEtaAt(s.etaSec, s.arriveSec ?? undefined, source, lang)
          : undefined,
    rightSub:
      s.passed && s.departSec != null
        ? t('train.passed')
        : !s.passed && run.phase === 'running' && s.arriveSec != null && s.etaSec != null && s.etaSec < 3600
          ? fmtClock(s.arriveSec, lang)
          : undefined,
  }));

  return (
    <Screen scroll gap={4}>
      <ScreenHeader
        title={t('train.title', { id })}
        subtitle={t('train.route', { from: stationName(from, lang), to: stationName(to, lang) })}
        onBack={() => goBack()}
        backLabel={t('common.back')}
        right={<StatusBadge kind={live ? 'live' : 'estimated'} />}
      />

      <Card tone="brand" radius="hero" padding={5} gap={3}>
        {run.phase === 'running' && next ? (
          <>
            <Text variant="label" tone="onBrand">
              {segment?.atStation && here ? t('train.standing', { name: name(here.stationId) }) : t('train.nextStation')}
            </Text>
            <Stack direction="row" justify="between" align="center" gap={3}>
              <Text variant="display" tone="onBrand" numberOfLines={1}>
                {name(next.stationId)}
              </Text>
              <Text variant="display" tone="onBrand" numeric>
                {next.etaSec != null ? fmtEta(next.etaSec, source, lang) : '—'}
              </Text>
            </Stack>
            <Stack direction="row" gap={2} wrap>
              {train && Math.abs(train.v) > 0.5 ? <Chip label={t('train.speed', { v: fmtSpeed(train.v, lang) })} /> : null}
              <Chip label={live ? t('train.riders', { count: fmtNum(train?.riders ?? 0, lang) }) : t('train.byTimetable')} />
            </Stack>
          </>
        ) : run.phase === 'before' ? (
          <>
            <Text variant="label" tone="onBrand">
              {t('train.notStarted', { station: name(firstStop.stationId), time: fmtClock(firstStop.departSec ?? 0, lang) })}
            </Text>
            <Text variant="display" tone="onBrand" numeric>
              {t('train.notStartedIn', { eta: fmtEtaAt(run.startsInSec ?? 0, firstStop.departSec ?? undefined, 'schedule', lang) })}
            </Text>
          </>
        ) : (
          <Text variant="title" tone="onBrand">
            {t('train.finished', { station: name(lastStop.stationId), time: lastStop.arriveSec != null ? fmtClock(lastStop.arriveSec, lang) : '' })}
          </Text>
        )}
      </Card>

      {run.phase === 'running' && segment && next ? (
        <Card padding={4}>
          <SegmentProgress
            fromLabel={name(prev.stationId)}
            toLabel={name(next.stationId)}
            progress={segment.progress}
            direction={dir}
            caption={next.etaSec != null ? t('train.arrivesIn', { name: name(next.stationId), eta: fmtEta(next.etaSec, source, lang) }) : undefined}
          />
        </Card>
      ) : null}

      <Card padding={4}>
        <TrainTimeline
          direction={dir}
          stops={timeline}
          marker={
            run.markerAfter != null
              ? {
                  afterIndex: run.markerAfter,
                  label: t('train.hereNow', { id }),
                  right: live && train ? t('train.updated', { n: fmtNum(Math.max(0, Math.round((run.now - train.ts) / 1000)), lang) }) : t('train.byTimetable'),
                }
              : undefined
          }
        />
      </Card>
      <Text variant="micro" tone="muted">
        {t('app.unofficial')}
      </Text>
    </Screen>
  );
}
