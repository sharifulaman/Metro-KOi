import { useLocalSearchParams } from 'expo-router';
import { Share } from 'react-native';

import { EmptyState, JourneyDetailView, type JourneyBadge, type JourneyDetailStop } from '@/components/metro';
import { Screen } from '@/components/ui';
import { stationName, useStations } from '@/features/stations/useStations';
import { useRunModel } from '@/features/timetable/useTimetable';
import { useT } from '@/i18n';
import { fmtClock, fmtDuration, fmtEta, fmtNum } from '@/lib/fmt';
import { offsetsFor } from '@/lib/schedule';
import { goBack } from '@/lib/nav';

/** Journey details (design ১৭): every stop between the two stations with its time, then "I'm boarding this train". */
export default function JourneyDetailScreen() {
  const p = useLocalSearchParams<{ from: string; to: string; depart: string; train: string; wait: string; badge: string; tomorrow: string }>();
  const { t, lang } = useT();
  const { byId } = useStations();
  const model = useRunModel();
  const a = model.stationIds.indexOf(p.from);
  const b = model.stationIds.indexOf(p.to);
  const depart = Number(p.depart);
  if (a < 0 || b < 0 || a === b || !Number.isFinite(depart)) {
    return (
      <Screen>
        <EmptyState icon="route" title={t('journey.none')} action={{ label: t('common.back'), onPress: () => goBack() }} />
      </Screen>
    );
  }

  const dir = b > a ? 'SB' : 'NB';
  const step = b > a ? 1 : -1;
  const badge: JourneyBadge = p.badge === 'live' || p.badge === 'schedule' ? p.badge : 'estimated';
  const name = (id: string) => (byId[id] ? stationName(byId[id], lang) : id);
  // a stop's time = leaving the first station + the run's offset between the two
  const base = offsetsFor(model, dir, a).depart;
  const clock = (sec: number) => (lang === 'bn' ? fmtClock(sec, lang).split(' ').slice(1).join(' ') : fmtClock(sec, lang));
  const stops: JourneyDetailStop[] = [];
  for (let i = a; i !== b + step; i += step) {
    const id = model.stationIds[i];
    const role = i === a ? 'start' : i === b ? 'end' : 'mid';
    const at = depart + (i === a ? 0 : offsetsFor(model, dir, i).arrive - base);
    stops.push({
      key: id,
      name: name(id),
      role,
      time: clock(at),
      note: role === 'start' ? `${t('journey.boardHere')} · ${t('common.platform', { n: fmtNum(dir === 'SB' ? 1 : 2, lang) })}` : role === 'end' ? t('journey.getOff') : undefined,
    });
  }
  const arrive = depart + offsetsFor(model, dir, b).arrive - base;
  const wait = Number(p.wait);
  const showWait = p.tomorrow !== '1' && Number.isFinite(wait) && wait > 0 && wait < 3600;
  const meta = [fmtDuration(arrive - depart, lang), t('journey.stationsCount', { n: fmtNum(Math.abs(b - a), lang) }), p.tomorrow === '1' ? t('journey.byTimetable') : p.train].join(' · ');
  const badgeLabel = badge === 'live' ? t('common.live') : badge === 'schedule' ? t('journey.scheduleBadge') : t('common.estimated');

  return (
    <JourneyDetailView
      testID="journey-detail"
      title={t('journey.details')}
      backLabel={t('common.back')}
      shareLabel={t('journey.share')}
      onBack={() => goBack()}
      onShare={() => void Share.share({ message: `${name(p.from)} → ${name(p.to)}: ${t('journey.leaves', { time: fmtClock(depart, lang) })}, ${t('journey.arrives', { time: fmtClock(arrive, lang), dur: fmtDuration(arrive - depart, lang) })}` })}
      route={`${name(p.from)} → ${name(p.to)}`}
      badge={badge}
      badgeLabel={badgeLabel}
      times={`${clock(depart)} → ${clock(arrive)}`}
      meta={meta}
      stops={stops}
      waitNote={showWait ? t('journey.trainArrives', { name: name(p.from), eta: fmtEta(wait, badge === 'live' ? 'live' : 'schedule', lang) }) : undefined}
    />
  );
}
