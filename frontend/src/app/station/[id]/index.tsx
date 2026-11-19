import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import { EmptyState, StationDetailView } from '@/components/metro';
import type { MapGate } from '@/components/map';
import { Screen } from '@/components/ui';
import { useStationGates } from '@/features/gates/useStationGates';
import { useScreenLocation } from '@/features/map/useUserLocation';
import { StationDemo } from '@/features/stations/StationDemo';
import { StationMap } from '@/features/stations/StationMap';
import { useDepartures } from '@/features/stations/useDepartures';
import { stationAltName, stationName, useStations } from '@/features/stations/useStations';
import { useT } from '@/i18n';
import { fmtClock, fmtNum } from '@/lib/fmt';
import { haversineM } from '@/lib/geo';
import type { Departure, Direction } from '@/models';
import { useSettings } from '@/store/settings';

/** Station detail (design স্টেশন ৩): 2D map or 3D map header, both directions' next trains, facts, journey. Real timetable data. */
function StationReal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, lang } = useT();
  const router = useRouter();
  const { byId } = useStations();
  const favourites = useSettings((s) => s.favourites);
  const toggleFavourite = useSettings((s) => s.toggleFavourite);
  const deps = useDepartures(id, 3);
  const { gates } = useStationGates(id);
  const { user, status, request } = useScreenLocation({ fast: true });
  // "from you": ask for location once, then the distance follows the rider every second
  useEffect(() => {
    if (status === 'unknown') void request();
  }, [status, request]);
  const [tilt, setTilt] = useState(false);
  const [gatesOn, setGatesOn] = useState(false);
  const [platformsOn, setPlatformsOn] = useState(false);
  const [gate, setGate] = useState<string | undefined>();
  const st = byId[id];
  if (!st) {
    return (
      <Screen>
        <EmptyState icon="info" title={t('empty.notFound')} action={{ label: t('common.back'), onPress: () => router.back() }} />
      </Screen>
    );
  }

  // "~৯ মি" within the hour; further out the clock time, with its period word as the caption ("সকাল" / "AM")
  const clock = (atSec: number) => {
    const [a, b] = fmtClock(atSec, lang).split(' ');
    return lang === 'bn' ? { time: b, period: a } : { time: a, period: b };
  };
  const tiles = (dir: Direction) => {
    if (deps.isTerminusFor[dir]) return [{ value: '—', caption: t('station.terminus'), live: false }];
    const list = deps.byDir[dir].map((d: Departure) => {
      const live = d.source === 'live';
      const state = live ? t('common.live') : t('common.estimated');
      if (d.etaSec < 30 || (live && d.etaSec < 60)) return { value: t('train.now'), caption: state, live };
      if (d.etaSec >= 3600 && d.atSec != null) {
        const c = clock(d.atSec);
        return { value: c.time, caption: `${c.period} · ${state}`, live };
      }
      const min = t('stations.minShort', { n: fmtNum(Math.round(d.etaSec / 60), lang) });
      return { value: (live ? '' : '~') + min, caption: state, live };
    });
    return list.length > 0 ? list : [{ value: '—', caption: t('station.noService'), live: false }];
  };

  // gates on the 3D scene: lettered pins on the station's gate kiosks, each with its landmark
  const mapGates: MapGate[] = gates.flatMap((g) =>
    g.lat != null && g.lng != null ? [{ id: `${g.stationId}:${g.gate}`, letter: g.gate, label: ((lang === 'bn' ? g.landmarkBn : g.landmarkEn) ?? '').split(' · ')[0], lat: g.lat, lng: g.lng }] : [],
  );

  const away = user ? Math.round(haversineM(user.lat, user.lng, st.lat as number, st.lng as number)) : null;
  const threeD = tilt || gatesOn || platformsOn;
  const toggle3d = () => {
    if (gatesOn || platformsOn) {
      setGatesOn(false);
      setPlatformsOn(false);
      setTilt(false);
    } else setTilt((v) => !v);
  };

  return (
    <StationDetailView
      testID="station-detail"
      map={
        threeD ? (
          <StationMap
            stationId={st.id}
            tilt
            zoom={16}
            gates={gatesOn ? mapGates : undefined}
            selectedGate={gate ? `${st.id}:${gate}` : undefined}
            onGatePress={(gid) => setGate((cur) => (cur === gid.split(':')[1] ? undefined : gid.split(':')[1]))}
            platformSigns={platformsOn ? { SB: `${t('common.platform', { n: fmtNum(1, lang) })} · ${t('timetable.SB')}`, NB: `${t('common.platform', { n: fmtNum(2, lang) })} · ${t('timetable.NB')}` } : undefined}
          />
        ) : (
          <StationMap stationId={st.id} />
        )
      }
      tilt={{ active: threeD, label: t(threeD ? 'live.tilt2d' : 'live.tilt3d'), onPress: toggle3d }}
      order={fmtNum(st.order, lang)}
      lineLine={`${t('common.lineChip')} · ${stationAltName(st, lang)}`}
      name={stationName(st, lang)}
      dirs={[
        { key: 'SB', title: t('timetable.SB'), platform: t('common.platform', { n: fmtNum(1, lang) }), tiles: tiles('SB') },
        { key: 'NB', title: t('timetable.NB'), platform: t('common.platform', { n: fmtNum(2, lang) }), tiles: tiles('NB') },
      ]}
      facts={[
        {
          icon: 'pin',
          value: t('gates.gate', { g: gates.length > 1 ? `${gates[0].gate}–${gates[gates.length - 1].gate}` : (gates[0]?.gate ?? '') }),
          label: t('station.entrances', { n: fmtNum(gates.length, lang) }),
          active: gatesOn,
          onPress: () => {
            setGatesOn((v) => !v);
            setGate(undefined);
          },
        },
        { icon: 'layers', value: t('station.platformsCount', { n: fmtNum(2, lang) }), label: t('station.platforms'), active: platformsOn, onPress: () => setPlatformsOn((v) => !v) },
        { icon: 'locate', value: away != null ? (away >= 1000 ? `${fmtNum((away / 1000).toFixed(1), lang)} ${t('station.kmShort')}` : t('station.metersShort', { n: fmtNum(away, lang) })) : '—', label: t('station.fromYou') },
      ]}
      journeyLabel={t('station.journeyFrom')}
      backLabel={t('common.back')}
      favouriteLabel={t('common.favourite')}
      favourite={favourites.includes(st.id)}
      onBack={() => router.back()}
      onFavourite={() => toggleFavourite(st.id)}
      onJourney={() => router.push('/journey')}
    />
  );
}

export default function StationScreen() {
  const demo = useSettings((s) => s.demo !== false);
  return demo ? <StationDemo /> : <StationReal />;
}
