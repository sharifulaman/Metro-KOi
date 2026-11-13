import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import { GoogleMapView, ZOOM_NEAR, type MapTrain } from '@/components/map';
import { BrandBar, ConnectionPill, MapLegend, NextTrainRow, PlaybackBar, RideBanner, SearchPill, SegmentProgress, StationHeader, TrainCard } from '@/components/metro';
import { Button, IconButton, InfoNote, Screen, Sheet, Stack } from '@/components/ui';
import { usePlayback } from '@/features/map/usePlayback';
import { fractionOf, trainSegment, useTrains } from '@/features/map/useTrains';
import { useRiderSession } from '@/features/rider/useRiderSession';
import { platformTitle } from '@/features/stations/mappers';
import { useDepartures } from '@/features/stations/useDepartures';
import { stationAltName, stationName, useStations } from '@/features/stations/useStations';
import { useT } from '@/i18n';
import { config } from '@/lib/config';
import { fmtEta, fmtEtaAt, fmtMmSs, fmtNum } from '@/lib/fmt';
import type { Direction, Train } from '@/models';
import { useLive } from '@/store/live';
import { useSettings } from '@/store/settings';

/** Live map (spec §10.2, board 1): oblique city, trains with departure timers, next trains sheet. */
export default function LiveScreen() {
  const { t, lang } = useT();
  const router = useRouter();
  const { list, byId, first, last, geometry } = useStations();
  const { trains, model, now } = useTrains(500);
  const connection = useLive((s) => s.connection);
  const favourites = useSettings((s) => s.favourites);
  const setLang = useSettings((s) => s.setLang);
  const rider = useRiderSession();
  const playback = usePlayback(now);
  const [selStation, setSelStation] = useState<string | undefined>();
  const [selTrain, setSelTrain] = useState<string | undefined>();
  const [collapsed, setCollapsed] = useState(false);
  const [near, setNear] = useState(true);
  const [followNext, setFollowNext] = useState(false);
  const [recenter, setRecenter] = useState(0);

  const focusId = selStation ?? favourites[0] ?? config.defaultStationId;
  const focus = byId[focusId];
  const focusIdx = model.stationIds.indexOf(focusId);
  const deps = useDepartures(focusId, 1);
  const train = trains.find((x) => x.id === selTrain);
  const seg = train ? trainSegment(model, train) : null;
  const nameAt = (i: number) => (byId[model.stationIds[i]] ? stationName(byId[model.stationIds[i]], lang) : '');
  const tagFor = (state: string, id: string) => `${id} · ${state === 'ESTIMATED' ? t('common.estimated') : t('common.live')}`;

  // follow the selected train; otherwise frame the station in focus
  const mapFocus = train ? fractionOf(model, train.s) : focusIdx >= 0 ? fractionOf(model, model.chainage[focusIdx]) : 0.5;

  // tags: live trains and any train standing at a station (with its departure timer); a selected train always has one
  const mapTrains: MapTrain[] = trains.map((tr) => {
    const left = tr.dwellLeftSec;
    const base = { id: tr.id, dir: tr.dir, state: tr.state, f: fractionOf(model, tr.s) };
    if (left != null) return { ...base, label: t('live.tagDwell', { id: tr.id }), dwell: { timer: fmtMmSs(left, lang), progress: left / model.dwellSec } };
    return { ...base, label: tr.state === 'LIVE' || tr.id === selTrain ? tagFor(tr.state, tr.id) : undefined };
  });

  /** the train standing at the focus station in this direction, if any */
  const standingAt = (dir: Direction): Train | undefined =>
    trains.find((tr) => {
      if (tr.dir !== dir || tr.dwellLeftSec == null) return false;
      const s = trainSegment(model, tr);
      return s.atStation && s.fromIdx === focusIdx;
    });

  const selectStation = (id: string) => {
    setSelTrain(undefined);
    setSelStation(id);
    setCollapsed(false);
    setNear(true);
  };
  const stepStation = (by: number) => {
    const id = model.stationIds[focusIdx + by];
    if (id) selectStation(id);
  };

  const openDeparture = (dir: Direction) => {
    const standing = standingAt(dir);
    const d = deps.byDir[dir][0];
    const id = standing?.id ?? d?.trainId;
    if (!id) return;
    if (trains.some((x) => x.id === id)) {
      setSelStation(undefined);
      setSelTrain(id);
      setNear(true);
    } else router.push(`/train/${id}`);
  };

  // playback starts by following a train (the one due at the focus station,
  // else the first one out) so it can be watched moving station to station
  const startPlayback = () => {
    playback.start();
    setSelStation(undefined);
    setNear(true);
    setFollowNext(true);
  };
  useEffect(() => {
    if (!followNext || trains.length === 0) return;
    const due = deps.byDir.SB[0]?.trainId ?? deps.byDir.NB[0]?.trainId;
    setSelTrain((trains.find((x) => x.id === due) ?? trains[0]).id);
    setFollowNext(false);
  }, [followNext, trains, deps]);

  const closedUntil = playback.closedUntil;

  return (
    <Screen bleed>
      <GoogleMapView
        stations={list.map((s, i) => ({ id: s.id, label: stationName(s, lang), f: fractionOf(model, model.chainage[i]) }))}
        trains={mapTrains}
        selectedStation={selStation ?? (train ? undefined : focusId)}
        selectedTrain={selTrain}
        zoom={near ? ZOOM_NEAR : 1}
        focus={mapFocus}
        recenterKey={recenter}
        topInset={playback.active ? 330 : 215}
        focusShiftX={70}
        onStationPress={selectStation}
        onTrainPress={(id) => {
          setSelStation(undefined);
          setSelTrain(id);
          setCollapsed(false);
        }}
        errorText={t('live.mapError')}
        reserveSheet={!collapsed}
      >
        <Stack overlay="top" safe="top" padX={4} padY={2} gap={3}>
          <BrandBar
            title="Metro"
            accent="KOI"
            subtitle={t('splash.brandBn')}
            langLabel={lang === 'bn' ? 'বাং · EN' : 'EN · বাং'}
            onLangPress={() => setLang(lang === 'bn' ? 'en' : 'bn')}
            langAccessibilityLabel={t('more.language')}
            testID="brand"
          />
          <SearchPill placeholder={t('live.search')} onPress={() => router.push('/stations')} testID="search" />
          {playback.active ? (
            <PlaybackBar
              title={t('live.playbackTitle')}
              timeLabel={playback.timeLabel(now)}
              rates={playback.rates}
              rate={playback.rate}
              onRate={playback.setRate}
              onClose={playback.stop}
              closeLabel={t('common.close')}
              testID="playback"
            />
          ) : null}
          <Stack direction="row" gap={2} justify="between" align="start">
            <Stack gap={2}>
              {playback.active ? null : <ConnectionPill state={connection} label={t(`conn.${connection}`)} />}
              <MapLegend
                items={[
                  { kind: 'live', label: t('live.legendLive') },
                  { kind: 'dwell', label: t('live.legendDwell') },
                  { kind: 'estimated', label: t('live.legendEstimated') },
                ]}
              />
            </Stack>
            <Stack gap={2}>
              <IconButton icon="box" elevated accessibilityLabel={t('live.open3dShort')} onPress={() => router.push(`/station/${focusId}/3d`)} testID="open-3d" />
              <IconButton icon={near ? 'zoomOut' : 'zoomIn'} elevated accessibilityLabel={t(near ? 'live.zoomOut' : 'live.zoomIn')} onPress={() => setNear((v) => !v)} testID="zoom" />
              {!playback.active ? <IconButton icon="play" elevated accessibilityLabel={t('live.watchShort')} onPress={startPlayback} testID="play" /> : null}
              <IconButton
                icon="locate"
                elevated
                accessibilityLabel={t('live.locate')}
                onPress={() => {
                  setSelTrain(undefined);
                  setSelStation(undefined);
                  setNear(true);
                  setRecenter((n) => n + 1);
                }}
              />
            </Stack>
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
            {train && seg ? (
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
                <SegmentProgress
                  fromLabel={nameAt(seg.fromIdx)}
                  toLabel={nameAt(seg.toIdx)}
                  progress={seg.progress}
                  direction={train.dir}
                  caption={
                    seg.atStation
                      ? t('train.standing', { name: nameAt(seg.fromIdx) })
                      : train.etaSec != null
                        ? t('train.arrivesIn', { name: nameAt(seg.toIdx), eta: fmtEta(train.etaSec, train.state === 'ESTIMATED' ? 'schedule' : 'live', lang) })
                        : undefined
                  }
                />
                <Button label={t('train.open')} variant="secondary" icon="train" fullWidth onPress={() => router.push(`/train/${train.id}`)} />
              </>
            ) : focus ? (
              <>
                <StationHeader
                  compact
                  name={t('live.stationTitle', { name: stationName(focus, lang) })}
                  altName={stationAltName(focus, lang)}
                  orderLabel={t('common.stationNo', { n: fmtNum(focus.order, lang), total: fmtNum(list.length, lang) })}
                  onPress={() => router.push(`/station/${focusId}`)}
                  onPrev={focusIdx > 0 ? () => stepStation(-1) : undefined}
                  onNext={focusIdx >= 0 && focusIdx < model.stationIds.length - 1 ? () => stepStation(1) : undefined}
                  prevLabel={t('live.prevStation')}
                  nextLabel={t('live.nextStation')}
                  testID="station-header"
                />
                {closedUntil ? (
                  <>
                    <InfoNote icon="clock" text={`${t('live.closedTitle')} · ${t('live.closedBody', { time: playback.timeLabel(closedUntil), station: stationName(first, lang) })}`} />
                    <Button label={t('live.watch')} icon="play" fullWidth onPress={startPlayback} testID="watch-schedule" />
                  </>
                ) : null}
                {(['SB', 'NB'] as const)
                  .filter((dir) => !deps.isTerminusFor[dir])
                  .map((dir, i, arr) => {
                    const d = deps.byDir[dir][0];
                    const standing = standingAt(dir);
                    const platform = t('common.platform', { n: fmtNum(dir === 'SB' ? 1 : 2, lang) });
                    const liveId = standing?.id ?? (d?.source === 'live' ? d.trainId : undefined);
                    return (
                      <NextTrainRow
                        key={dir}
                        direction={dir}
                        title={t(`timetable.${dir}`)}
                        subtitle={liveId ? `${platform} · ${liveId}` : platform}
                        eta={d ? fmtEtaAt(d.etaSec, d.atSec, d.source, lang) : undefined}
                        source={d?.source}
                        dwell={standing?.dwellLeftSec != null ? { countdown: fmtMmSs(standing.dwellLeftSec, lang), caption: t('live.leavesIn') } : undefined}
                        emptyText={t('station.noService')}
                        onPress={standing || d?.trainId ? () => openDeparture(dir) : undefined}
                        divider={i < arr.length - 1}
                        testID={`next-${dir}`}
                      />
                    );
                  })}
                <Button label={t('live.open3d')} icon="box" fullWidth onPress={() => router.push(`/station/${focusId}/3d`)} testID="open-3d-cta" />
              </>
            ) : null}
          </Sheet>
        </Stack>
      </GoogleMapView>
    </Screen>
  );
}
