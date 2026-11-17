import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import { GoogleMapView, ZOOM_NEAR, type MapGate, type MapHints, type MapTrain } from '@/components/map';
import { BrandBar, NextTrainRow, RideBanner, SegmentProgress, Speedometer, StationHeader } from '@/components/metro';
import { Button, Chip, GlassPill, IconButton, InfoNote, Screen, Sheet, Stack, StatusBadge, Text } from '@/components/ui';
import { useStationGates } from '@/features/gates/useStationGates';
import { usePlayback } from '@/features/map/usePlayback';
import { nearestStation, useUserLocation } from '@/features/map/useUserLocation';
import { fractionOf, trainSegment, useTrains } from '@/features/map/useTrains';
import { useRiderSession } from '@/features/rider/useRiderSession';
import { useStartRide } from '@/features/rider/useStartRide';
import { useDepartures } from '@/features/stations/useDepartures';
import { stationAltName, stationName, useStations } from '@/features/stations/useStations';
import { useT } from '@/i18n';
import { config } from '@/lib/config';
import { fmtClock, fmtDistance, fmtEta, fmtEtaAt, fmtHMS, fmtMmSs, fmtNum } from '@/lib/fmt';
import { dhakaClock, etaToStation } from '@/lib/schedule';
import type { Direction, Train } from '@/models';
import { useSettings } from '@/store/settings';

/** within this many metres of a station the sheet shows that station */
const AT_STATION_M = 300;

/** Live map (design ১০–১২): Google map with the line, trains and station pills; floating controls; next-trains sheet. */
export function LiveReal() {
  const { t, lang } = useT();
  const router = useRouter();
  const { list, byId, first, last, geometry } = useStations();
  const { trains, model, now } = useTrains(500);
  const favourites = useSettings((s) => s.favourites);
  const rider = useRiderSession();
  const startRide = useStartRide();
  const playback = usePlayback(now);
  const [selStation, setSelStation] = useState<string | undefined>();
  const [selTrain, setSelTrain] = useState<string | undefined>();
  const [collapsed, setCollapsed] = useState(false);
  const [near, setNear] = useState(true);
  const [followNext, setFollowNext] = useState(false);
  const [recenter, setRecenter] = useState(0);
  const [view3d, setView3d] = useState(false);
  const [selGate, setSelGate] = useState<string | undefined>();
  const [userFocus, setUserFocus] = useState<{ lat: number; lng: number } | null>(null);
  const [locNote, setLocNote] = useState(false);
  const { user, request: requestLocation } = useUserLocation();

  // standing at / near a station: the sheet follows that station by itself and updates as the rider moves
  const nearest = user ? nearestStation(user, model.chainage.map((m) => fractionOf(model, m))) : null;
  const nearbyId = nearest && nearest.metres <= AT_STATION_M ? model.stationIds[nearest.index] : undefined;
  const [seenNearby, setSeenNearby] = useState<string | undefined>();
  if (nearbyId !== seenNearby) {
    setSeenNearby(nearbyId);
    if (nearbyId) setSelStation(undefined);
  }

  const focusId = selStation ?? nearbyId ?? favourites[0] ?? config.defaultStationId;
  const focus = byId[focusId];
  const focusIdx = model.stationIds.indexOf(focusId);
  const deps = useDepartures(focusId, 1);
  const train = trains.find((x) => x.id === selTrain);
  const seg = train ? trainSegment(model, train) : null;
  const nameAt = (i: number) => (byId[model.stationIds[i]] ? stationName(byId[model.stationIds[i]], lang) : '');
  /** km/h: standing at a station = 0; a rider's own train uses the phone's GPS speed */
  const trainKmh = (tr: Train) => (tr.dwellLeftSec != null ? 0 : Math.abs(tr.v) * 3.6);
  const nameOf = (id: string) => (byId[id] ? stationName(byId[id], lang) : id);
  const tagFor = (state: string, id: string) => `${id} · ${state === 'ESTIMATED' ? t('common.estimated') : t('common.live')}`;

  // follow the selected train; otherwise frame the station in focus
  const mapFocus = train ? fractionOf(model, train.s) : focusIdx >= 0 ? fractionOf(model, model.chainage[focusIdx]) : 0.5;

  // platform number: Motijheel (the terminus) uses platform 1 for both arriving and departing trains, elsewhere Motijheel-bound = 1, Uttara-bound = 2
  const lastIdx = model.stationIds.length - 1;
  const platformNo = (dir: Direction, idx: number) => (idx === lastIdx ? 1 : dir === 'SB' ? 1 : 2);

  // every train carries a tag; a train standing at a station says so
  const mapTrains: MapTrain[] = trains.map((tr) => {
    const base = { id: tr.id, dir: tr.dir, state: tr.state, f: fractionOf(model, tr.s), women: t('live.womenCoach') };
    if (tr.dwellLeftSec != null) {
      const sg = trainSegment(model, tr);
      const callout = {
        title: `${t('common.platform', { n: fmtNum(platformNo(tr.dir, sg.fromIdx), lang) })} · ${tr.id}`,
        rows: [
          [t('live.leavesIn'), fmtMmSs(tr.dwellLeftSec, lang)],
          [t('live.nextStationIs', { name: nameAt(sg.toIdx) }), ''],
        ] as [string, string][],
      };
      return { ...base, callout, label: t('live.atStationTag', { id: tr.id }), dwell: { timer: fmtMmSs(tr.dwellLeftSec, lang), progress: tr.dwellLeftSec / model.dwellSec } };
    }
    return { ...base, label: tagFor(tr.state, tr.id) };
  });

  /** the train standing at the focus station in this direction, if any */
  const standingAt = (dir: Direction): Train | undefined =>
    trains.find((tr) => {
      if (tr.dir !== dir || tr.dwellLeftSec == null) return false;
      const s = trainSegment(model, tr);
      return s.atStation && s.fromIdx === focusIdx;
    });

  /** where the next train in this direction is coming from */
  const comingFrom = (dir: Direction): string | undefined => {
    const id = standingAt(dir)?.id ?? deps.byDir[dir][0]?.trainId;
    const tr = id ? trains.find((x) => x.id === id) : undefined;
    if (!tr) return undefined;
    const s = trainSegment(model, tr);
    return t('live.fromStation', { name: nameAt(s.fromIdx) });
  };

  const selectStation = (id: string) => {
    setSelTrain(undefined);
    setSelStation(id);
    setUserFocus(null);
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
  const startPlayback = (fromFirstTrain = false) => {
    playback.start(fromFirstTrain);
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

  // where the rider is relative to the line
  const nearestName = nearest ? nameAt(nearest.index) : '';
  const locate = async () => {
    const fix = user ?? (await requestLocation());
    setSelTrain(undefined);
    setSelStation(undefined);
    setNear(true);
    setLocNote(!fix);
    setUserFocus(fix ? { lat: fix.lat, lng: fix.lng } : null);
    setRecenter((n) => n + 1);
  };

  // "I'm on this train": share my position so others see it live (only possible near the line)
  const goLive = (tr: Train) => void startRide({ direction: tr.dir });

  // while live: the trip (or the rest of the line in my direction) drawn on the map
  const sess = rider.session;
  const iFrom = sess?.fromStationId ? model.stationIds.indexOf(sess.fromStationId) : -1;
  const iTo = sess?.toStationId ? model.stationIds.indexOf(sess.toStationId) : -1;
  const liveRoute = sess && iFrom >= 0 && iTo >= 0 ? { from: fractionOf(model, model.chainage[iFrom]), to: fractionOf(model, model.chainage[iTo]) } : null;

  // gate pins (A–D, with their landmark) for the station the map is framing: the one a followed train is at, else the focus station
  const gateStationId = (() => {
    if (!(near || view3d)) return undefined;
    const at = train ? train.s : model.chainage[focusIdx];
    if (at == null) return undefined;
    let best = 0;
    model.chainage.forEach((c, i) => {
      if (Math.abs(c - at) < Math.abs(model.chainage[best] - at)) best = i;
    });
    return Math.abs(model.chainage[best] - at) <= 450 ? model.stationIds[best] : undefined;
  })();
  const { gates: stationGates } = useStationGates(gateStationId ?? '');
  const mapGates: MapGate[] = stationGates.flatMap((g) =>
    g.lat != null && g.lng != null ? [{ id: `${g.stationId}:${g.gate}`, letter: g.gate, label: ((lang === 'bn' ? g.landmarkBn : g.landmarkEn) ?? '').split(' · ')[0], lat: g.lat, lng: g.lng }] : [],
  );

  // 3D: hint cards along the track for the followed train around the station it is entering, standing at or just leaving (design "model 2")
  const hints: MapHints | null = (() => {
    if (!view3d || !train || !seg) return null;
    const idx = seg.atStation ? seg.fromIdx : seg.progress > 0.12 ? seg.toIdx : -1;
    const sid = idx >= 0 ? model.stationIds[idx] : undefined;
    if (!sid) return null;
    const dw = model.dwellSec;
    let tStop: number | null = null;
    if (train.dwellLeftSec != null && seg.atStation) tStop = now + (train.dwellLeftSec - dw) * 1000;
    else {
      const eta = etaToStation(model, train, sid);
      if (eta != null) tStop = now + eta * 1000;
    }
    if (tStop == null) return null;
    const at = (sec: number) => tStop + sec * 1000;
    const h = (sec: number) => fmtHMS(at(sec), lang);
    const past = (sec: number) => at(sec) < now;
    const platform = t('common.platform', { n: fmtNum(platformNo(train.dir, idx), lang) });
    return {
      stationId: sid,
      trainId: train.id,
      dir: train.dir,
      items: [
        { off: -300, title: t('live.hint.entered', { id: train.id }), rows: [[t('live.hint.enteredRow'), h(-32)]], past: past(-32) },
        { off: -231, title: t('live.hint.brake'), time: h(-21), past: past(-21) },
        { off: 0, title: t('live.hint.standing', { platform }), rows: [[t('live.hint.stopped'), h(0)], [t('live.hint.leaves'), h(dw)]], past: past(0) },
        { off: 120, title: t('live.hint.gone'), rows: [[t('live.hint.left'), h(dw)], [t('live.hint.clear'), h(dw + 32)]], past: past(dw) },
        { off: 231, title: t('live.hint.full'), time: h(dw + 21), past: past(dw + 21) },
      ],
    };
  })();

  const closedUntil = playback.closedUntil;

  // line closed: a train waits at each terminal for its first run (both on platform 1 at their terminus)
  const parked: MapTrain[] = closedUntil
    ? (['SB', 'NB'] as const).map((dir) => {
        const c = dhakaClock(closedUntil);
        const hh = String(Math.floor(c.sec / 3600)).padStart(2, '0');
        const mm = String(Math.floor((c.sec % 3600) / 60)).padStart(2, '0');
        const id = `${dir}-${hh}${mm}`;
        const at = fmtClock(c.sec, lang);
        const platform = t('common.platform', { n: fmtNum(platformNo(dir, dir === 'SB' ? 0 : lastIdx), lang) });
        return {
          id,
          dir,
          state: 'ESTIMATED',
          f: dir === 'SB' ? 0 : 1,
          women: t('live.womenCoach'),
          label: t('live.parkedTag', { id, time: at }),
          callout: { title: `${platform} · ${id}`, rows: [[t('live.hint.leaves'), at]] as [string, string][] },
        } satisfies MapTrain;
      })
    : [];
  const zoomLevel = near ? 15 : 12;

  return (
    <Screen bleed>
      <GoogleMapView
        stations={list.map((s, i) => ({ id: s.id, label: stationName(s, lang), f: fractionOf(model, model.chainage[i]) }))}
        trains={[...mapTrains, ...parked]}
        selectedStation={selStation ?? (train ? undefined : focusId)}
        selectedTrain={selTrain}
        zoom={near || view3d ? ZOOM_NEAR : 1}
        focus={mapFocus}
        focusPoint={userFocus ?? undefined}
        route={liveRoute}
        gates={mapGates}
        hints={hints}
        womenLabel={t('live.womenCoach')}
        selectedGate={selGate}
        onGatePress={(id) => setSelGate((cur) => (cur === id ? undefined : id))}
        user={user}
        tilt={view3d}
        recenterKey={recenter}
        topInset={playback.active ? 330 : 200}
        focusShiftX={70}
        onStationPress={selectStation}
        onTrainPress={(id) => {
          setSelStation(undefined);
          setSelTrain(id);
          setUserFocus(null);
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
            testID="brand"
          />
          <Stack direction="row" gap={2} justify="between" align="start">
            <Stack gap={2}>
              <Stack direction="row" gap={2} align="center">
                <GlassPill size="sm" icon="train" label={t('live.trainsCount', { count: trains.length })} testID="counts" />
              </Stack>
              {nearest && !train && collapsed ? <GlassPill size="sm" icon="locate" label={t('live.youAre', { m: fmtDistance(nearest.metres, lang), name: nearestName })} testID="near-you" /> : null}
            </Stack>
            <Stack gap={2}>
              <IconButton icon="box" label={view3d ? '2D' : '3D'} size="sm" elevated active={view3d} accessibilityLabel={t(view3d ? 'live.tilt2d' : 'live.tilt3d')} onPress={() => {
                  // entering 3D: follow the next train so it can be watched going station to station
                  if (!view3d) {
                    setSelStation(undefined);
                    setUserFocus(null);
                    setNear(true);
                    // nothing running (line closed): go to the train waiting at Uttara North
                    if (trains.length === 0 && parked[0]) setSelTrain(parked[0].id);
                    else setFollowNext(true);
                  }
                  setView3d((v) => !v);
                }} testID="open-3d" />
              <IconButton icon="locate" size="sm" elevated active={!!userFocus} accessibilityLabel={t('live.locate')} onPress={() => void locate()} testID="locate" />
              <IconButton icon={near ? 'zoomOut' : 'zoomIn'} size="sm" elevated accessibilityLabel={t(near ? 'live.zoomOut' : 'live.zoomIn')} onPress={() => setNear((v) => !v)} testID="zoom" />
            </Stack>
          </Stack>
          {locNote ? <InfoNote icon="gpsOff" tone="danger" text={t('live.locationOff')} /> : null}
          {geometry === 'TO_FETCH' ? <InfoNote icon="map" text={t('live.schematicNote')} /> : null}
        </Stack>

        <Stack overlay="fill" justify="end">
          <Stack padX={4} padY={3} gap={2} direction="row" justify="between" align="end">
            {rider.session ? (
              <Stack flex>
                <RideBanner
                  title={`${t('rider.sharing')}${rider.sharing ? '' : ' · ' + t('rider.waiting')}`}
                  subtitle={
                    rider.session.fromStationId && rider.session.toStationId
                      ? `${nameOf(rider.session.fromStationId)} → ${nameOf(rider.session.toStationId)} · ${t('rider.helping', { count: fmtNum(rider.helping, lang) })}`
                      : t('rider.helping', { count: fmtNum(rider.helping, lang) })
                  }
                  stopLabel={t('common.close')}
                  onStop={() => rider.stop('user')}
                  onPress={() => router.push('/rider')}
                />
              </Stack>
            ) : (
              <Stack />
            )}
            {collapsed ? <GlassPill size="sm" icon="layers" label={t('live.zoomBadge', { z: fmtNum(zoomLevel, lang), what: near ? t('live.zoomCity') : t('live.zoomWhole') })} /> : null}
          </Stack>
          <Sheet docked withTabBar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} maxHeight={0.5} peek={null}>
            {train && seg ? (
              <>
                <Stack direction="row" justify="between" align="center">
                  <Chip label={t('live.platformTo', { n: fmtNum(train.dir === 'SB' ? 1 : 2, lang), name: stationName(train.dir === 'SB' ? last : first, lang) })} tone="brand" />
                  <Text variant="label" tone="muted" numeric>
                    {train.id}
                  </Text>
                </Stack>
                <Stack direction="row" justify="between" align="end">
                  <Stack gap={2}>
                    <Text variant="countdown" numeric>
                      {train.dwellLeftSec != null
                        ? fmtMmSs(train.dwellLeftSec, lang)
                        : train.etaSec != null
                          ? fmtEta(train.etaSec, train.state === 'ESTIMATED' ? 'schedule' : 'live', lang)
                          : '—'}
                    </Text>
                    <StatusBadge kind={train.dwellLeftSec != null ? 'stop' : train.state === 'ESTIMATED' ? 'estimated' : 'live'} />
                  </Stack>
                  <Speedometer value={trainKmh(train)} unit={t('live.kmh')} valueLabel={fmtNum(Math.round(trainKmh(train)), lang)} size={112} testID="speedometer" />
                </Stack>
                <SegmentProgress
                  fromLabel={nameAt(seg.fromIdx)}
                  toLabel={nameAt(seg.toIdx)}
                  progress={seg.progress}
                  direction={train.dir}
                  caption={seg.atStation ? t('train.standing', { name: nameAt(seg.fromIdx) }) : t('live.nextStationIs', { name: nameAt(seg.toIdx) })}
                />
                {nearest ? (
                  (() => {
                    const eta = etaToStation(model, train, model.stationIds[nearest.index]);
                    return (
                      <Text variant="label" tone="muted">
                        {eta == null ? t('live.passedYou', { name: nearestName }) : t('live.reachesYou', { name: nearestName, eta: fmtEta(eta, train.state === 'ESTIMATED' ? 'schedule' : 'live', lang) })}
                      </Text>
                    );
                  })()
                ) : null}
                <Stack direction="row" gap={2}>
                  <Stack flex>
                    <Button label={t('train.open')} variant="secondary" size="md" fullWidth onPress={() => router.push(`/train/${train.id}`)} />
                  </Stack>
                  {!rider.session ? (
                    <Stack flex>
                      <Button label={t('live.goLive')} icon="train" size="md" fullWidth onPress={() => goLive(train)} testID="go-live" />
                    </Stack>
                  ) : null}
                </Stack>
              </>
            ) : focus ? (
              <>
                <Stack direction="row" justify="between" align="center">
                  <Text variant="title" weight={700}>
                    {closedUntil ? t('live.closedShort') : t('live.runningTitle')}
                  </Text>
                  <Chip label={t('live.trainsCount', { count: trains.length })} tone="brand" icon="train" />
                </Stack>
                <StationHeader
                  compact
                  name={stationName(focus, lang)}
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
                  </>
                ) : null}
                {(['SB', 'NB'] as const)
                  .filter((dir) => !deps.isTerminusFor[dir])
                  .map((dir, i, arr) => {
                    const d = deps.byDir[dir][0];
                    const standing = standingAt(dir);
                    const platform = t('common.platform', { n: fmtNum(dir === 'SB' ? 1 : 2, lang) });
                    return (
                      <NextTrainRow
                        key={dir}
                        direction={dir}
                        title={t(`timetable.${dir}`)}
                        subtitle={comingFrom(dir) ?? platform}
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
              </>
            ) : null}
          </Sheet>
        </Stack>
      </GoogleMapView>
    </Screen>
  );
}
