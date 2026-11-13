import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';

import { NearestBanner, SearchPill, StationTimeline, type TimelineStation } from '@/components/metro';
import { Button, InfoNote, Screen, Segmented, Stack, Text } from '@/components/ui';
import { useNow } from '@/features/common/useNow';
import { trainSegment, useTrains } from '@/features/map/useTrains';
import { stationAltName, stationName, useStations } from '@/features/stations/useStations';
import { useRunModel, useTimetable } from '@/features/timetable/useTimetable';
import { useT } from '@/i18n';
import { config } from '@/lib/config';
import { fmtClock, fmtEtaAt, fmtNum } from '@/lib/fmt';
import { dhakaClock, etaToStation, nextServiceStart, stationDepartures } from '@/lib/schedule';
import type { Direction } from '@/models';
import { useSettings } from '@/store/settings';

/** Stations list (design ১৩/১৪): direction toggle, nearest station, the line as a numbered timeline with next-train pills. */
export default function StationsScreen() {
  const { t, lang } = useT();
  const router = useRouter();
  const { list, byId } = useStations();
  const tt = useTimetable();
  const model = useRunModel();
  const now = useNow(15000);
  const { trains } = useTrains(1000);
  const favourites = useSettings((s) => s.favourites);
  const [dir, setDir] = useState<Direction>('SB');

  const closedUntil = useMemo(() => nextServiceStart(tt, model, now), [tt, model, now]);

  /** next train at a station in `dir`: a live one approaching, else the timetable; when closed, tomorrow's first */
  const nextAt = (id: string): TimelineStation['eta'] => {
    if (closedUntil) {
      const first = stationDepartures(tt, model, id, closedUntil, 1)[dir][0];
      return first ? { label: fmtClock(first.atSec, lang), kind: 'closed' } : undefined;
    }
    const live = trains
      .filter((tr) => tr.dir === dir && tr.state !== 'ESTIMATED')
      .map((tr) => etaToStation(model, tr, id))
      .filter((x): x is number => x != null)
      .sort((a, b) => a - b)[0];
    if (live != null) return { label: fmtEtaAt(live, 0, 'live', lang), kind: 'live' };
    const d = stationDepartures(tt, model, id, now, 1)[dir][0];
    return d ? { label: fmtEtaAt(d.etaSec, d.atSec, d.source, lang), kind: 'schedule' } : undefined;
  };

  const rows: TimelineStation[] = list.map((s, i) => ({
    id: s.id,
    order: fmtNum(s.order, lang),
    name: stationName(s, lang),
    altName: stationAltName(s, lang),
    terminal: i === 0 ? 'start' : i === list.length - 1 ? 'end' : undefined,
    eta: nextAt(s.id),
    onPress: () => router.push(`/station/${s.id}`),
  }));

  // the first train running in this direction, drawn on the line between its two stations
  const marker = useMemo(() => {
    const tr = trains.filter((x) => x.dir === dir).sort((a, b) => (dir === 'SB' ? b.s - a.s : a.s - b.s))[0];
    if (!tr) return undefined;
    const seg = trainSegment(model, tr);
    const lo = Math.min(seg.fromIdx, seg.toIdx);
    const progress = seg.atStation ? 0 : dir === 'SB' ? seg.progress : 1 - seg.progress;
    return { afterIndex: seg.fromIdx === seg.toIdx ? seg.fromIdx : lo, progress, live: tr.state !== 'ESTIMATED' };
  }, [trains, dir, model]);

  const focusId = favourites[0] ?? config.defaultStationId;
  const focus = byId[focusId];
  const focusEta = focus && !closedUntil ? nextAt(focus.id) : undefined;
  const firstTrainLabel = closedUntil ? `${fmtClock(dhakaClock(closedUntil).sec, lang)}` : '';

  return (
    <Screen scroll gap={3} withTabBar>
      <Stack direction="row" justify="between" align="start" gap={3}>
        <Stack flex gap={1}>
          <Text variant="display">{t('stations.title')}</Text>
          <Text tone="muted">{t('stations.subtitle', { n: fmtNum(list.length, lang) })}</Text>
        </Stack>
        <Button label={t('stations.timetable')} variant="secondary" size="md" icon="calendar" onPress={() => router.push('/timetable')} />
      </Stack>
      <Segmented<Direction>
        selectedTone="brand"
        value={dir}
        onChange={setDir}
        options={[
          { value: 'SB', label: t('timetable.SB') },
          { value: 'NB', label: t('timetable.NB') },
        ]}
        testID="direction"
      />
      <SearchPill outlined placeholder={t('stations.search')} legend={{ live: t('common.live'), estimated: t('common.estimated') }} />
      {closedUntil ? (
        <NearestBanner mode="closed" caption="" title={t('stations.closedTitle')} subtitle={t('stations.closedBody', { time: firstTrainLabel })} />
      ) : focus ? (
        <NearestBanner
          mode="nearest"
          caption={t('stations.nearestTitle')}
          title={stationName(focus, lang)}
          subtitle={stationAltName(focus, lang)}
          eta={focusEta ? { label: focusEta.label, live: focusEta.kind === 'live' } : undefined}
          onPress={() => router.push(`/station/${focus.id}`)}
        />
      ) : null}
      <StationTimeline stations={rows} train={marker} labels={{ start: t('stations.start'), end: t('stations.end') }} testID="timeline" />
      <InfoNote text={t('app.unofficial')} />
    </Screen>
  );
}
