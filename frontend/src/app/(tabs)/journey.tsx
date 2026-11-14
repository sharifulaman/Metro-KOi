import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Share } from 'react-native';

import { JourneyView, type JourneyBadge, type JourneyOptionCardProps } from '@/components/metro';
import { ListRow, Sheet, Text } from '@/components/ui';
import { DEMO_JOURNEY } from '@/data/demoJourney';
import { useJourney } from '@/features/journey/useJourney';
import { stationName, useStations } from '@/features/stations/useStations';
import { useT } from '@/i18n';
import { fmtClock, fmtDuration, fmtEta, fmtNum } from '@/lib/fmt';
import type { JourneyOption } from '@/models';
import { useSettings } from '@/store/settings';

type Field = 'from' | 'to';
const LATER = [15, 30, 60] as const;

/**
 * Journey planner (design ১৬ · ১৮): From → To card, leave now / later, the fastest train as a card and the
 * next ones as rows. With "Sample data" on (More tab, default) it shows the design's example trip; off, the
 * timetable. After the last train it shows tomorrow morning's first trains from the timetable.
 */
export default function JourneyScreen() {
  const { t, lang } = useT();
  const router = useRouter();
  const { list, byId } = useStations();
  const demo = useSettings((s) => s.demo !== false);
  const [from, setFrom] = useState<string | null>('farmgate');
  const [to, setTo] = useState<string | null>('motijheel');
  const [picking, setPicking] = useState<Field | null>(null);
  const [laterMin, setLaterMin] = useState(0);
  const [showLater, setShowLater] = useState(false);
  const real = useJourney(from, to, 3, laterMin);
  const name = (id: string | null) => (id && byId[id] ? stationName(byId[id], lang) : t('journey.pick'));
  const differ = !!from && !!to && from !== to;
  const stops = differ && byId[from] && byId[to] ? Math.abs(byId[to].order - byId[from].order) : 0;

  // sample mode: the design's trip (5:48 live, then +10 and +20 min), for any two different stations
  const options: JourneyOption[] = (() => {
    if (!demo || !differ) return real.options;
    const dur = real.options[0]?.durationSec ?? Math.max(1, stops) * 144;
    const direction = (byId[to]?.order ?? 0) > (byId[from]?.order ?? 0) ? 'SB' : 'NB';
    const one = (gap: number, live: boolean): JourneyOption => ({
      trainId: DEMO_JOURNEY.trainId,
      direction,
      departSec: DEMO_JOURNEY.departSec + gap,
      arriveSec: DEMO_JOURNEY.departSec + gap + dur,
      durationSec: dur,
      waitSec: DEMO_JOURNEY.waitSec + gap,
      fareBdt: null,
      fareRapidPassBdt: null,
      source: live ? 'live' : 'schedule',
    });
    return [one(0, true), ...DEMO_JOURNEY.gaps.map((g) => one(g, false))];
  })();
  const closed = !demo && real.closed;
  const best = options[0];

  // waitSec is measured from the chosen leave time; show it from now
  const waitOf = (o: JourneyOption) => (demo ? o.waitSec : o.waitSec + laterMin * 60);
  // big times as in the design: "৫:৪৮" (Bangla drops the period word), "5:48 AM"
  const clock = (sec: number) => (lang === 'bn' ? fmtClock(sec, lang).split(' ').slice(1).join(' ') : fmtClock(sec, lang));
  const badgeOf = (o: JourneyOption): JourneyBadge => (closed ? 'schedule' : o.source === 'live' ? 'live' : 'estimated');
  const badgeLabel = (b: JourneyBadge) => (b === 'live' ? t('common.live') : b === 'schedule' ? t('journey.scheduleBadge') : t('common.estimated'));
  const whenText = (o: JourneyOption) => {
    if (closed) return t('journey.tomorrowMorning');
    const w = waitOf(o);
    return w >= 3600 ? t('journey.leavesAt', { time: fmtClock(o.departSec, lang) }) : t('journey.laterShort', { eta: fmtEta(w, o.source, lang) });
  };
  const dirText = (o: JourneyOption) => t(o.direction === 'SB' ? 'stations.dirSB' : 'stations.dirNB');

  const open = (o: JourneyOption) =>
    router.push({
      pathname: '/journey-detail',
      params: { from: from ?? '', to: to ?? '', depart: String(o.departSec), train: o.trainId, wait: String(waitOf(o)), badge: badgeOf(o), tomorrow: closed ? '1' : '' },
    });

  const shareEta = () => {
    if (!best) return;
    void Share.share({ message: `${name(from)} → ${name(to)}: ${t('journey.leaves', { time: fmtClock(best.departSec, lang) })}, ${t('journey.arrives', { time: fmtClock(best.arriveSec, lang), dur: fmtDuration(best.durationSec, lang) })}` });
  };

  const row = (o: JourneyOption): JourneyOptionCardProps => {
    const b = badgeOf(o);
    return { depart: clock(o.departSec), arrive: clock(o.arriveSec), waitText: whenText(o), badge: b, badgeLabel: badgeLabel(b), onPress: () => open(o) };
  };

  const bestCard: JourneyOptionCardProps | undefined =
    differ && best
      ? {
          ...row(best),
          testID: 'journey-best',
          bestLabel: closed ? t('journey.firstTomorrow') : t('journey.fastest'),
          departCaption: t('journey.leavesCaption'),
          arriveCaption: t('journey.arriveWord'),
          arriveText: t('journey.stationsCount', { n: fmtNum(stops, lang) }),
          duration: fmtDuration(best.durationSec, lang),
          midStops: Math.max(0, stops - 1),
          platformText: t('journey.platformShort', { n: fmtNum(best.direction === 'SB' ? 1 : 2, lang), dir: dirText(best) }),
          platformMeta: closed ? t('journey.byTimetable') : best.trainId,
          action: closed ? { label: t('journey.details'), icon: 'list', onPress: () => open(best) } : { label: t('journey.track'), icon: 'pin', onPress: () => router.push(`/train/${best.trainId}`) },
          share: { label: t('journey.share'), onPress: shareEta },
        }
      : undefined;

  return (
    <JourneyView
      testID="journey"
      title={t('journey.title')}
      subtitle={t('journey.subtitle')}
      timetableLabel={t('stations.timetable')}
      onTimetable={() => router.push('/timetable')}
      picker={{
        fromCaption: t('journey.from'),
        toCaption: t('journey.to'),
        fromLabel: name(from),
        toLabel: name(to),
        onFrom: () => setPicking('from'),
        onTo: () => setPicking('to'),
        onSwap: () => {
          setFrom(to);
          setTo(from);
        },
        swapLabel: t('journey.swap'),
      }}
      closedNote={closed ? { title: t('journey.closedNoteTitle'), body: t('journey.closedNoteBody') } : undefined}
      modes={
        closed
          ? undefined
          : {
              nowLabel: t('journey.leaveNow'),
              laterLabel: t('journey.leaveLater'),
              later: showLater,
              onNow: () => {
                setLaterMin(0);
                setShowLater(false);
              },
              onLater: () => setShowLater(true),
              summary: differ && best ? t('journey.dirSummary', { dir: dirText(best), dur: fmtDuration(best.durationSec, lang) }) : undefined,
              laterOptions: LATER.map((m) => ({ key: String(m), label: t('journey.laterIn', { n: fmtDuration(m * 60, lang) }), selected: laterMin === m, onPress: () => setLaterMin(m) })),
            }
      }
      empty={!differ ? { icon: 'route', title: t('journey.same') } : !best ? { icon: 'clock', title: t('journey.none'), action: { label: t('stations.timetable'), onPress: () => router.push('/timetable') } } : undefined}
      best={bestCard}
      listTitle={closed ? t('journey.after') : t('journey.nextTrains')}
      rows={differ ? options.slice(1).map(row) : []}
      disclaimer={t('journey.disclaimer')}
    >
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
    </JourneyView>
  );
}
