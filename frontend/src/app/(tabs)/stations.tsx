import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';

import { StationsView, type TimelineStation } from '@/components/metro';
import { DEMO_NEAREST, DEMO_STATION_ETAS, DEMO_TRAIN } from '@/data/demoStations';
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

/**
 * Stations list (design ১৩/১৪): direction switch, nearest station, the line as a numbered timeline with next-train
 * pills. With "Sample data" on (More tab, default) it shows the design's example times; off, live data / the timetable.
 */
export default function StationsScreen() {
  const { t, lang } = useT();
  const router = useRouter();
  const { list, byId } = useStations();
  const tt = useTimetable();
  const model = useRunModel();
  const now = useNow(15000);
  const { trains } = useTrains(1000);
  const favourites = useSettings((s) => s.favourites);
  const demo = useSettings((s) => s.demo !== false);
  const [dir, setDir] = useState<Direction>('SB');

  const closedUntil = useMemo(() => (demo ? null : nextServiceStart(tt, model, now)), [demo, tt, model, now]);

  /** next train at a station in `dir`: a live one approaching, else the timetable; when closed, tomorrow's first */
  const nextAt = (id: string, index: number): TimelineStation['eta'] => {
    if (demo) {
      const d = DEMO_STATION_ETAS[dir][index];
      return d ? { label: t('stations.minShort', { n: fmtNum(d.min, lang) }), kind: d.live ? 'live' : 'schedule' } : undefined;
    }
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
    eta: nextAt(s.id, i),
    onPress: () => router.push('/station/' + s.id),
  }));

  // the first train running in this direction, drawn on the line between its two stations
  const marker = useMemo(() => {
    if (demo) return DEMO_TRAIN[dir];
    const tr = trains.filter((x) => x.dir === dir).sort((a, b) => (dir === 'SB' ? b.s - a.s : a.s - b.s))[0];
    if (!tr) return undefined;
    const seg = trainSegment(model, tr);
    const lo = Math.min(seg.fromIdx, seg.toIdx);
    const progress = seg.atStation ? 0 : dir === 'SB' ? seg.progress : 1 - seg.progress;
    return { afterIndex: seg.fromIdx === seg.toIdx ? seg.fromIdx : lo, progress, live: tr.state !== 'ESTIMATED' };
  }, [demo, trains, dir, model]);

  const focus = demo ? byId[DEMO_NEAREST.stationId] : byId[favourites[0] ?? config.defaultStationId];
  const focusIndex = focus ? list.findIndex((s) => s.id === focus.id) : -1;
  const focusEta = focus && !closedUntil ? nextAt(focus.id, focusIndex) : undefined;
  const firstTrainLabel = closedUntil ? fmtClock(dhakaClock(closedUntil).sec, lang) : '';

  const banner = closedUntil
    ? { mode: 'closed' as const, caption: '', title: t('stations.closedTitle'), subtitle: t('stations.closedBody', { time: firstTrainLabel }) }
    : focus
      ? {
          mode: 'nearest' as const,
          caption: t('stations.nearestTitle'),
          title: stationName(focus, lang),
          subtitle: demo ? t('stations.walkInfo', { m: fmtNum(DEMO_NEAREST.walkMeters, lang), min: fmtNum(DEMO_NEAREST.walkMinutes, lang) }) : stationAltName(focus, lang),
          eta: focusEta ? { label: demo ? t('common.minutes', { n: fmtNum(DEMO_NEAREST.etaMin, lang) }) : focusEta.label, live: demo ? true : focusEta.kind === 'live', badge: demo || focusEta.kind === 'live' ? t('common.live') : t('common.estimated') } : undefined,
          onPress: () => router.push('/station/' + focus.id),
        }
      : undefined;

  return (
    <StationsView
      title={t('stations.title')}
      subtitle={t('stations.subtitle', { n: fmtNum(list.length, lang) })}
      timetableLabel={t('stations.timetable')}
      onTimetable={() => router.push('/timetable')}
      dirs={[
        { key: 'SB', label: t('stations.dirSB') },
        { key: 'NB', label: t('stations.dirNB') },
      ]}
      dir={dir}
      onDir={(k) => setDir(k as Direction)}
      searchPlaceholder={t('stations.search')}
      legendLive={t('common.live')}
      legendEstimated={t('common.estimated')}
      banner={banner}
      timeline={{ stations: rows, train: marker, labels: { start: t('stations.start'), end: t('stations.end') } }}
      footnote={t('app.unofficial')}
    />
  );
}
