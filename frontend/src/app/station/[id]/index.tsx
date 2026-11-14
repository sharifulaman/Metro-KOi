import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

import { StationDemo } from '@/features/stations/StationDemo';

import { GoogleMapView } from '@/components/map';
import { DirectionEtaCard, EmptyState, InfoTile, type EtaTile } from '@/components/metro';
import { Button, Card, IconButton, IconTile, InfoNote, Screen, Stack, Text } from '@/components/ui';
import { fractionOf, useTrains } from '@/features/map/useTrains';
import { useUserLocation } from '@/features/map/useUserLocation';
import { useDepartures } from '@/features/stations/useDepartures';
import { stationAltName, stationName, useStations } from '@/features/stations/useStations';
import { useT } from '@/i18n';
import { fmtClock, fmtEtaAt, fmtNum } from '@/lib/fmt';
import type { Departure, Direction } from '@/models';
import { useSettings } from '@/store/settings';

/** Station detail (design ১৫): map header, both directions' next trains as tiles, facts, journey / 3D. */
function StationReal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, lang } = useT();
  const router = useRouter();
  const { byId, list } = useStations();
  const favourites = useSettings((s) => s.favourites);
  const toggleFavourite = useSettings((s) => s.toggleFavourite);
  const { trains, model } = useTrains(1000);
  const st = byId[id];
  const deps = useDepartures(id, 3);
  const [tilt, setTilt] = useState(false);
  const { user } = useUserLocation();
  if (!st) {
    return (
      <Screen>
        <EmptyState icon="info" title={t('empty.notFound')} action={{ label: t('common.back'), onPress: () => router.back() }} />
      </Screen>
    );
  }
  const idx = model.stationIds.indexOf(st.id);
  const fav = favourites.includes(st.id);
  const tiles = (dir: Direction): EtaTile[] =>
    deps.byDir[dir].map((d: Departure, i) => ({
      value: i === 0 && d.source === 'live' && d.etaSec < 60 ? t('train.now') : fmtEtaAt(d.etaSec, d.atSec, d.source, lang),
      caption: d.source === 'live' ? t('common.live') : t('common.estimated'),
      live: d.source === 'live',
    }));

  return (
    <Screen scroll gap={3}>
      <Card radius="hero" padding={0}>
        <GoogleMapView
          height={262}
          zoom={7}
          focus={idx >= 0 ? fractionOf(model, model.chainage[idx]) : 0.5}
          stations={list.map((s, i) => ({ id: s.id, label: stationName(s, lang), f: fractionOf(model, model.chainage[i]) }))}
          trains={trains.map((tr) => ({ id: tr.id, dir: tr.dir, state: tr.state, f: fractionOf(model, tr.s), label: tr.dwellLeftSec != null ? t('live.atStationTag', { id: tr.id }) : undefined }))}
          selectedStation={st.id}
          user={user}
          tilt={tilt}
          onTrainPress={(trainId) => router.push(`/train/${trainId}`)}
          errorText={t('live.mapError')}
        >
          <Stack overlay="top" padX={3} padY={3} direction="row" justify="between">
            <IconButton icon="back" elevated accessibilityLabel={t('common.back')} onPress={() => router.back()} />
            <Stack direction="row" gap={2}>
              <IconButton icon="box" label={tilt ? '2D' : '3D'} elevated active={tilt} accessibilityLabel={t(tilt ? 'live.tilt2d' : 'live.tilt3d')} onPress={() => setTilt((v) => !v)} />
              <IconButton icon="star" elevated active={fav} accessibilityLabel={t('common.favourite')} onPress={() => toggleFavourite(st.id)} />
            </Stack>
          </Stack>
        </GoogleMapView>
      </Card>
      <Stack gap={1}>
        <Stack direction="row" gap={2} align="center">
          <IconTile icon="train" letter={fmtNum(st.order, lang)} tone="brand" />
          <Text variant="label" weight={600} tone="muted">
            {`${t('common.lineChip')} · ${stationAltName(st, lang)}`}
          </Text>
        </Stack>
        <Text variant="display">{stationName(st, lang)}</Text>
      </Stack>
      {(['SB', 'NB'] as const).map((dir) =>
        deps.isTerminusFor[dir] ? (
          <InfoNote key={dir} text={t('station.terminus')} />
        ) : (
          <DirectionEtaCard
            key={dir}
            title={t(`timetable.${dir}`)}
            platformLabel={t('common.platform', { n: fmtNum(dir === 'SB' ? 1 : 2, lang) })}
            tiles={tiles(dir)}
            emptyText={t('station.noService')}
            testID={`platform-${dir === 'SB' ? 1 : 2}`}
          />
        ),
      )}
      <Stack direction="row" gap={2}>
        <InfoTile icon="gate" value={t('station.gates')} label={t('station.entrances', { n: fmtNum(4, lang) })} onPress={() => router.push(`/station/${st.id}/gates`)} />
        <InfoTile icon="layers" value={fmtNum(2, lang)} label={t('station.platforms')} />
        <InfoTile icon="locate" value="—" label={t('station.fromYou')} />
      </Stack>
      <Stack direction="row" gap={3} equal>
        <Button label={t('station.journeyFrom')} icon="route" fullWidth onPress={() => router.push('/journey')} />
        <Button label={t('station.view3d')} icon="box" variant="secondary" fullWidth onPress={() => router.push(`/station/${st.id}/3d`)} />
      </Stack>
      <Button label={t('station.insideRoute')} icon="walk" variant="ghost" onPress={() => router.push(`/station/${st.id}/route`)} />
      <Text variant="label" tone="muted" align="center" numeric>
        {t('station.todayWindow', { from: fmtClock(deps.window.firstSec, lang), to: fmtClock(deps.window.lastSec, lang) })}
      </Text>
    </Screen>
  );
}

export default function StationScreen() {
  const demo = useSettings((s) => s.demo !== false);
  return demo ? <StationDemo /> : <StationReal />;
}
