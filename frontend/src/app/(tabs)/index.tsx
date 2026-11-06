import { useRouter } from 'expo-router';
import { useState } from 'react';

import { MapView3D } from '@/components/map';
import { ConnectionPill, PlatformGroup, RideBanner, StationHeader, TrainCard } from '@/components/metro';
import { Button, Chip, IconButton, InfoNote, Screen, Sheet, Stack } from '@/components/ui';
import { fractionOf, useTrains } from '@/features/map/useTrains';
import { useRiderSession } from '@/features/rider/useRiderSession';
import { platformTitle, toDepartureRows } from '@/features/stations/mappers';
import { useDepartures } from '@/features/stations/useDepartures';
import { stationAltName, stationName, useStations } from '@/features/stations/useStations';
import { useT } from '@/i18n';
import { config } from '@/lib/config';
import { fmtNum } from '@/lib/fmt';
import { useLive } from '@/store/live';
import { useSettings } from '@/store/settings';

export default function LiveScreen() {
  const { t, lang } = useT();
  const router = useRouter();
  const { list, byId, first, last, geometry } = useStations();
  const { trains, model } = useTrains(500);
  const connection = useLive((s) => s.connection);
  const favourites = useSettings((s) => s.favourites);
  const setLang = useSettings((s) => s.setLang);
  const rider = useRiderSession();
  const [selStation, setSelStation] = useState<string | undefined>();
  const [selTrain, setSelTrain] = useState<string | undefined>();
  const [collapsed, setCollapsed] = useState(false);

  const focusId = selStation ?? favourites[0] ?? config.defaultStationId;
  const focus = byId[focusId];
  const deps = useDepartures(focusId, 2);
  const train = trains.find((x) => x.id === selTrain);

  const rows = (dir: 'SB' | 'NB') => toDepartureRows(deps.byDir[dir], (id) => router.push(`/train/${id}`));

  return (
    <Screen bleed>
      <MapView3D
        stations={list.map((s, i) => ({ id: s.id, label: stationName(s, lang), f: model.chainage[i] / model.lengthM }))}
        trains={trains.map((tr) => ({ id: tr.id, dir: tr.dir, state: tr.state, f: fractionOf(model, tr.s) }))}
        selectedStation={selStation}
        selectedTrain={selTrain}
        onStationPress={(id) => {
          setSelTrain(undefined);
          setSelStation(id);
          setCollapsed(false);
        }}
        onTrainPress={(id) => {
          setSelStation(undefined);
          setSelTrain(id);
          setCollapsed(false);
        }}
        attribution={t('live.attribution')}
        reserveSheet={!collapsed}
      >
        <Stack overlay="top" safe="top" padX={4} padY={2} gap={2}>
          <Stack direction="row" gap={2} justify="between">
            <Chip label={t('live.search')} icon="search" elevated onPress={() => router.push('/stations')} />
            <Chip label={lang === 'bn' ? 'EN' : 'বাং'} icon="globe" elevated onPress={() => setLang(lang === 'bn' ? 'en' : 'bn')} accessibilityLabel={t('more.language')} />
          </Stack>
          <Stack direction="row" gap={2} justify="between">
            <ConnectionPill state={connection} label={t(`conn.${connection}`)} />
            <IconButton icon="locate" elevated accessibilityLabel={t('live.locate')} />
          </Stack>
          {geometry === 'TO_FETCH' ? <InfoNote icon="map" text={t('live.schematicNote')} /> : null}
        </Stack>

        <Stack overlay="fill" justify="end">
          <Stack padX={4} padY={3} gap={2} align="end">
            {rider.session ? (
              <Stack align="stretch">
                <RideBanner
                  title={`${t('rider.sharing')}${rider.sharing ? '' : ' · ' + t('rider.waiting')}`}
                  subtitle={t('rider.helping', { count: fmtNum(rider.helping, lang) })}
                  stopLabel={t('common.close')}
                  onStop={() => rider.stop('user')}
                  onPress={() => router.push('/rider')}
                />
              </Stack>
            ) : (
              <Button label={t('live.ride')} icon="train" floating onPress={() => router.push('/rider')} testID="fab-ride" />
            )}
          </Stack>
          <Sheet docked collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} maxHeight={0.5} peek={null}>
            {train ? (
              <>
                <TrainCard
                  platform={train.dir === 'SB' ? 1 : 2}
                  title={platformTitle(train.dir, first, last, lang, t)}
                  eta={train.etaSec != null ? { sec: train.etaSec } : undefined}
                  source={train.state === 'ESTIMATED' ? 'schedule' : 'live'}
                  trainId={train.id}
                  detail={
                    (train.nextStation && byId[train.nextStation] ? t('train.next', { name: stationName(byId[train.nextStation], lang) }) + ' · ' : '') +
                    (train.riders > 0 ? t('train.riders', { count: fmtNum(train.riders, lang) }) : t('train.noRiders'))
                  }
                  labels={{ atStation: t('train.atStation'), departed: t('train.departed') }}
                />
                <Button label={t('train.title', { id: train.id })} variant="secondary" icon="train" fullWidth onPress={() => router.push(`/train/${train.id}`)} />
              </>
            ) : focus ? (
              <>
                <StationHeader
                  compact
                  name={selStation ? stationName(focus, lang) : t('live.nextNearYou')}
                  altName={selStation ? stationAltName(focus, lang) : stationName(focus, lang)}
                />
                {!deps.isTerminusFor.SB && <PlatformGroup platform={1} direction="SB" title={platformTitle('SB', first, last, lang, t)} rows={rows('SB')} emptyText={t('station.noService')} />}
                {!deps.isTerminusFor.NB && <PlatformGroup platform={2} direction="NB" title={platformTitle('NB', first, last, lang, t)} rows={rows('NB')} emptyText={t('station.noService')} />}
                <Button label={t('stations.title')} variant="secondary" icon="list" fullWidth onPress={() => router.push(`/station/${focusId}`)} />
              </>
            ) : null}
          </Sheet>
        </Stack>
      </MapView3D>
    </Screen>
  );
}
