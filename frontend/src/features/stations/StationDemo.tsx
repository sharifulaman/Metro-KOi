import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

import { StationDetailView } from '@/components/metro';
import { useT } from '@/i18n';
import { fmtNum } from '@/lib/fmt';
import { useSettings } from '@/store/settings';

import { StationMap } from './StationMap';
import { stationAltName, stationName, useStations } from './useStations';

/** Station detail with the design's sample trains (artboard ১৫). Shown while "Sample data" is on. */
export function StationDemo() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, lang } = useT();
  const router = useRouter();
  const { byId } = useStations();
  const favourites = useSettings((s) => s.favourites);
  const toggleFavourite = useSettings((s) => s.toggleFavourite);
  const [tilt, setTilt] = useState(false);
  const st = byId[id] ?? byId.farmgate;
  if (!st) return null;

  const live = t('common.live');
  const est = t('common.estimated');
  const mins = (n: number, approx: boolean) => (approx ? '~' : '') + t('stations.minShort', { n: fmtNum(n, lang) });
  const tiles = (now: boolean, a: number, b: number, c: number) => [
    now ? { value: t('live.now'), caption: live, live: true } : { value: mins(a, false), caption: est, live: false },
    { value: mins(b, true), caption: est, live: false },
    { value: mins(c, true), caption: est, live: false },
  ];

  return (
    <StationDetailView
      testID="station-detail"
      map={<StationMap stationId={st.id} tilt={tilt} />}
      tilt={{ active: tilt, label: t(tilt ? 'live.tilt2d' : 'live.tilt3d'), onPress: () => setTilt((v) => !v) }}
      trainTag={'SB-0630 · ' + t('live.trainAtStationShort')}
      order={fmtNum(st.order, lang)}
      lineLine={`${t('common.lineChip')} · ${stationAltName(st, lang)}`}
      name={stationName(st, lang)}
      dirs={[
        { key: 'SB', title: t('timetable.SB'), platform: t('common.platform', { n: fmtNum(1, lang) }), tiles: tiles(true, 0, 9, 19) },
        { key: 'NB', title: t('timetable.NB'), platform: t('common.platform', { n: fmtNum(2, lang) }), tiles: tiles(false, 5, 15, 25) },
      ]}
      facts={[
        { icon: 'pin', value: t('station.gates'), label: t('station.entrances', { n: fmtNum(4, lang) }), onPress: () => router.push(`/station/${st.id}/gates`) },
        { icon: 'layers', value: t('station.platformsCount', { n: fmtNum(2, lang) }), label: t('station.platforms') },
        { icon: 'locate', value: t('station.metersShort', { n: fmtNum(220, lang) }), label: t('station.fromYou') },
      ]}
      journeyLabel={t('station.journeyFrom')}
      view3dLabel={t('station.view3dShort')}
      backLabel={t('common.back')}
      favouriteLabel={t('common.favourite')}
      favourite={favourites.includes(st.id)}
      onBack={() => router.back()}
      onFavourite={() => toggleFavourite(st.id)}
      onJourney={() => router.push('/journey')}
      onView3d={() => router.push(`/station/${st.id}/3d`)}
    />
  );
}
