import { useState } from 'react';

import { GoogleMapView, ZOOM_NEAR } from '@/components/map';
import { SegmentProgress } from '@/components/metro';
import { Button, Card, Chip, IconButton, Screen, Stack, StatusBadge, Text } from '@/components/ui';
import { fractionOf, LOCAL_TRAIN_ID, trainSegment, useTrains } from '@/features/map/useTrains';
import { snapToLine } from '@/lib/lineGeo';
import { useScreenLocation } from '@/features/map/useUserLocation';
import { useRiderSession } from '@/features/rider/useRiderSession';
import { stationName, useStations } from '@/features/stations/useStations';
import { useT } from '@/i18n';
import { fmtEta, fmtMmSs, fmtNum } from '@/lib/fmt';
import { etaToStation } from '@/lib/schedule';
import { useLive } from '@/store/live';

/**
 * Journey page while the rider is live: the trip on the map (route from → to with arrows, your dot, the
 * train), then which train it is, where it is between stations and when it reaches the destination.
 */
export function ActiveTrip() {
  const { t, lang } = useT();
  const { list, byId, first, last } = useStations();
  const { trains, model } = useTrains(500);
  const rider = useRiderSession();
  const connection = useLive((s) => s.connection);
  const { user } = useScreenLocation();
  const [view3d, setView3d] = useState(false);
  const session = rider.session;
  if (!session) return null;

  const dir = session.direction;
  const userF = user ? snapToLine(user.lat, user.lng).f : null;
  const idxOf = (id: string | null) => (id ? model.stationIds.indexOf(id) : -1);
  const fromIdx = idxOf(session.fromStationId);
  const toIdx = idxOf(session.toStationId);
  const fromF = fromIdx >= 0 ? fractionOf(model, model.chainage[fromIdx]) : userF;
  const toF = toIdx >= 0 ? fractionOf(model, model.chainage[toIdx]) : dir === 'NB' ? 0 : 1;
  const route = fromF != null ? { from: fromF, to: toF } : null;

  // my train: the one in my direction closest to where I am
  const mySec = userF != null ? model.chainage[0] + userF * model.lengthM : null;
  const mine =
    mySec == null
      ? undefined
      : trains
          .filter((x) => x.id !== LOCAL_TRAIN_ID && (!dir || x.dir === dir))
          .sort((a, b) => Math.abs(a.s - mySec) - Math.abs(b.s - mySec))[0];
  const seg = mine ? trainSegment(model, mine) : null;
  const nameAt = (i: number) => (byId[model.stationIds[i]] ? stationName(byId[model.stationIds[i]], lang) : '');
  const destId = toIdx >= 0 ? model.stationIds[toIdx] : model.stationIds[dir === 'NB' ? 0 : model.stationIds.length - 1];
  const destEta = mine ? etaToStation(model, mine, destId) : null;
  const src = mine?.state === 'ESTIMATED' ? 'schedule' : 'live';

  return (
    <Screen scroll gap={4} withTabBar>
      <Stack direction="row" justify="between" align="center">
        <Stack>
          <Text variant="display">{t('trip.title')}</Text>
          <Text tone="muted">
            {session.fromStationId && session.toStationId
              ? `${nameAt(fromIdx)} → ${nameAt(toIdx)}`
              : dir
                ? t('live.platformTo', { n: fmtNum(dir === 'SB' ? 1 : 2, lang), name: stationName(dir === 'SB' ? last : first, lang) })
                : ''}
          </Text>
        </Stack>
        <Chip label={rider.sharing ? t('rider.sharing') : connection !== 'live' ? t('trip.local') : t('rider.waiting')} tone="brand" icon="train" />
      </Stack>

      <Stack>
        <GoogleMapView
          height={300}
          stations={list.map((s, i) => ({ id: s.id, label: stationName(s, lang), f: fractionOf(model, model.chainage[i]) }))}
          trains={trains.map((x) => ({ id: x.id, dir: x.dir, state: x.state, f: fractionOf(model, x.s), label: x.id === mine?.id || x.id === LOCAL_TRAIN_ID ? x.id : undefined }))}
          selectedTrain={mine?.id}
          route={route}
          user={user}
          // 3D: tilted street view of the stretch you are on, stations and the track ahead drawn
          zoom={view3d ? ZOOM_NEAR : 1}
          focus={userF ?? undefined}
          focusPoint={view3d && user ? { lat: user.lat, lng: user.lng } : undefined}
          tilt={view3d}
          errorText={t('live.mapError')}
          topInset={16}
        >
          <Stack overlay="top" padX={3} padY={3} direction="row" justify="end">
            <IconButton icon="box" label={view3d ? '2D' : '3D'} size="sm" elevated active={view3d} accessibilityLabel={t(view3d ? 'live.tilt2d' : 'live.tilt3d')} onPress={() => setView3d((v) => !v)} testID="trip-3d" />
          </Stack>
        </GoogleMapView>
      </Stack>

      <Card padding={4} gap={3}>
        {mine && seg ? (
          <>
            <Stack direction="row" justify="between" align="center">
              <Text variant="title">{mine.id}</Text>
              <StatusBadge kind={mine.dwellLeftSec != null ? 'stop' : src === 'schedule' ? 'estimated' : 'live'} />
            </Stack>
            <SegmentProgress
              fromLabel={nameAt(seg.fromIdx)}
              toLabel={nameAt(seg.toIdx)}
              progress={seg.progress}
              direction={mine.dir}
              caption={seg.atStation ? t('train.standing', { name: nameAt(seg.fromIdx) }) : t('live.nextStationIs', { name: nameAt(seg.toIdx) })}
            />
            <Text variant="label" tone="muted" numeric>
              {mine.dwellLeftSec != null
                ? `${t('live.leavesIn')} ${fmtMmSs(mine.dwellLeftSec, lang)}`
                : destEta != null
                  ? t('trip.reaches', { name: byId[destId] ? stationName(byId[destId], lang) : '', eta: fmtEta(destEta, src, lang) })
                  : t('trip.arrived')}
            </Text>
          </>
        ) : (
          <Text tone="muted">{user ? t('trip.noTrain') : t('trip.locating')}</Text>
        )}
      </Card>

      <Text variant="label" tone="muted">
        {t('trip.autoStop')}
      </Text>
      <Button fullWidth variant="dangerText" icon="stop" label={t('trip.end')} onPress={() => rider.stop('user')} testID="trip-end" />
    </Screen>
  );
}
