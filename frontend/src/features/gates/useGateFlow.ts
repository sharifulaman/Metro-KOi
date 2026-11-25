import { useMemo, useState } from 'react';

import { useScreenLocation } from '@/features/map/useUserLocation';
import { stationName, useStations } from '@/features/stations/useStations';
import { useT } from '@/i18n';
import { fmtDistance, fmtDistanceShort } from '@/lib/fmt';
import { bearingDeg, haversineM } from '@/lib/geo';
import type { MapGate } from '@/components/map';
import type { Gate, StationGate } from '@/models';

import { NEAR_STATION_M } from './useAtStation';
import { useHeading } from './useHeading';
import { useStationGates } from './useStationGates';

const ARRIVED_M = 12;
const AHEAD_DEG = 15;

/** A landmark reads "Daily Bangla Mor · Motijheel Thana": the first part is the name, the rest the area. */
function splitLandmark(text: string): { name: string; area?: string } {
  const [name, ...rest] = text.split(' · ');
  return { name, area: rest.length ? rest.join(' · ') : undefined };
}

/**
 * The exit-gate flow: step 1 "find" (station + gate), step 2 "track" (compass arrow + distance).
 * Position comes from the phone; the compass arrow needs the phone's heading, the distance only needs position.
 */
export function useGateFlow(initialStation?: string | null) {
  const { t, lang } = useT();
  const { list, byId } = useStations();
  const { user, status } = useScreenLocation();
  const [manual, setManual] = useState<string | null>(null);
  const [chosen, setChosen] = useState<Gate | null>(null);
  const [tracking, setTracking] = useState(false);

  const closestStation = useMemo(() => {
    if (!user) return null;
    let best: { id: string; d: number } | null = null;
    for (const s of list) {
      const d = haversineM(user.lat, user.lng, s.lat as number, s.lng as number);
      if (!best || d < best.d) best = { id: s.id, d };
    }
    return best;
  }, [user, list]);
  const atStation = closestStation != null && closestStation.d <= NEAR_STATION_M;

  const stationId = manual ?? (atStation ? closestStation!.id : null) ?? (initialStation && byId[initialStation] ? initialStation : 'farmgate');
  const station = byId[stationId];
  const stationLabel = station ? stationName(station, lang) : '';
  const { gates } = useStationGates(stationId);

  const rows = useMemo(
    () =>
      gates.map((g: StationGate) => {
        const text = (lang === 'bn' ? g.landmarkBn : g.landmarkEn) ?? '';
        const { name, area } = splitLandmark(text);
        const d = user && g.lat != null && g.lng != null ? haversineM(user.lat, user.lng, g.lat as number, g.lng as number) : null;
        return { gate: g.gate, full: text, name: name || t('gates.gate', { g: g.gate }), area, d, lat: g.lat, lng: g.lng };
      }),
    [gates, lang, user, t],
  );
  const nearestGate = atStation ? [...rows].filter((r) => r.d != null).sort((a, b) => (a.d as number) - (b.d as number))[0]?.gate : undefined;
  const selected: Gate = chosen ?? nearestGate ?? rows[0]?.gate ?? 'A';
  const target = rows.find((r) => r.gate === selected) ?? null;

  // lettered pins on the real map, each with its landmark
  const mapGates: MapGate[] = rows.flatMap((r) => (r.lat != null && r.lng != null ? [{ id: `${stationId}:${r.gate}`, letter: r.gate, label: r.name, lat: r.lat as number, lng: r.lng as number }] : []));

  const heading = useHeading(tracking && status === 'granted');
  const bearing = target && user && target.lat != null && target.lng != null ? bearingDeg(user.lat, user.lng, target.lat as number, target.lng as number) : null;
  const rotation = bearing != null && heading != null ? ((((bearing - heading) % 360) + 540) % 360) - 180 : null;
  const arrived = target?.d != null && target.d <= ARRIVED_M;
  const ahead = rotation != null && Math.abs(rotation) <= AHEAD_DEG;

  const statusText = arrived
    ? t('gateTrack.arrived', { g: selected })
    : rotation == null
      ? user
        ? t('gateTrack.noCompass')
        : t('gateTrack.needLocation')
      : ahead
        ? t('gateTrack.ahead')
        : rotation > 0
          ? t('gateTrack.turnRight')
          : t('gateTrack.turnLeft');
  const distanceText = target?.d != null ? (arrived ? t('gateTrack.here') : fmtDistance(target.d, lang)) : '—';
  const nearestNote = closestStation && byId[closestStation.id] ? t('gateTrack.nearestStation', { name: stationName(byId[closestStation.id], lang), d: fmtDistance(closestStation.d, lang) }) : undefined;

  return {
    stations: list,
    stationId,
    stationLabel,
    nearestNote,
    rows,
    nearestGate,
    mapGates,
    selected,
    select: setChosen,
    changeStation: (id: string) => {
      setManual(id);
      setChosen(null);
    },
    tracking,
    startTracking: () => setTracking(true),
    stopTracking: () => setTracking(false),
    target,
    rotation,
    arrived,
    ahead,
    statusText,
    distanceText,
    /** some gate of this station is not surveyed yet: its spot is an estimate */
    approx: gates.some((g: StationGate) => g.approx !== false),
    /** GPS accuracy (m) of the rider's position, null when unknown */
    userAccuracy: user?.accuracy ?? null,
    shortDistance: (d: number | null) => (d == null ? undefined : fmtDistanceShort(d, lang)),
  };
}
