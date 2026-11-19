import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { Button, Card, Chip, InfoNote, Text } from '@/components/ui';
import { useScreenLocation } from '@/features/map/useUserLocation';
import { stationName, useStations } from '@/features/stations/useStations';
import { useT } from '@/i18n';
import { fmtDistance } from '@/lib/fmt';
import { bearingDeg, haversineM } from '@/lib/geo';
import type { Gate } from '@/models';
import { useTheme } from '@/theme/useTheme';

import { useHeading } from './useHeading';
import { useStationGates } from './useStationGates';

const NEAR_STATION_M = 300;
const ARRIVED_M = 12;

/** Exit-gate finder inside Journey: pick the gate you want, then follow the arrow (like Precision Finding) until you reach it. */
export function GateTrackerPanel({ stationHint }: { stationHint?: string | null }) {
  const { t, lang } = useT();
  const { c } = useTheme();
  const { list, byId } = useStations();
  const { user, status, request } = useScreenLocation();
  const [manual, setManual] = useState<string | null>(null);
  const [picked, setPicked] = useState<Gate | null>(null);

  const closestStation = useMemo(() => {
    if (!user) return null;
    let best: { id: string; d: number } | null = null;
    for (const s of list) {
      const d = haversineM(user.lat, user.lng, s.lat as number, s.lng as number);
      if (!best || d < best.d) best = { id: s.id, d };
    }
    return best;
  }, [user, list]);
  // the finder works inside the station radius; further away it only says how far the station is
  const atStation = closestStation != null && closestStation.d <= NEAR_STATION_M;
  const nearest = atStation ? closestStation : null;

  const stationId = manual ?? nearest?.id ?? (stationHint && byId[stationHint] ? stationHint : 'farmgate');
  const station = byId[stationId];
  const { gates } = useStationGates(stationId);
  const heading = useHeading(status === 'granted');

  const rows = gates
    .filter((g) => g.lat != null && g.lng != null)
    .map((g) => ({ g, d: user && atStation ? haversineM(user.lat, user.lng, g.lat as number, g.lng as number) : null }));
  const closest = rows
    .filter((r) => r.d != null)
    .sort((a, b) => (a.d as number) - (b.d as number))[0]?.g.gate;
  const target = rows.find((r) => r.g.gate === picked) ?? null;
  const landmark = (g: { landmarkBn: string | null; landmarkEn: string | null }) => (lang === 'bn' ? g.landmarkBn : g.landmarkEn) ?? '';

  // arrow: where the gate is, relative to where the phone points
  const bearing = target && user ? bearingDeg(user.lat, user.lng, target.g.lat as number, target.g.lng as number) : null;
  const rel = bearing != null && heading != null ? ((((bearing - heading) % 360) + 540) % 360) - 180 : null;
  const arrived = target?.d != null && target.d <= ARRIVED_M;
  const ahead = rel != null && Math.abs(rel) <= 15;
  const hint = arrived
    ? t('gateTrack.arrived', { g: target?.g.gate })
    : rel == null
      ? user
        ? t('gateTrack.noCompass')
        : t('gateTrack.needLocation')
      : ahead
        ? t('gateTrack.ahead')
        : rel > 0
          ? t('gateTrack.turnRight')
          : t('gateTrack.turnLeft');

  return (
    <View style={{ gap: 16 }}>
      <View style={{ gap: 2 }}>
        <Text variant="title" weight={700}>
          {t('gateTrack.title')}
        </Text>
        <Text variant="label" tone="muted">
          {t('gateTrack.subtitle')}
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {list.map((s) => (
          <Chip
            key={s.id}
            label={stationName(s, lang)}
            selected={s.id === stationId}
            dot={s.id === nearest?.id ? c.brand : undefined}
            onPress={() => {
              setManual(s.id);
              setPicked(null);
            }}
          />
        ))}
      </ScrollView>

      {!user ? <Button label={t('gateTrack.enable')} icon="locate" fullWidth onPress={() => void request()} testID="gate-locate" /> : null}
      {status === 'denied' ? <InfoNote icon="gpsOff" tone="danger" text={t('live.locationOff')} /> : null}
      {closestStation && !atStation ? <InfoNote icon="info" text={t('gateTrack.goToStation', { name: stationName(byId[closestStation.id], lang), d: fmtDistance(closestStation.d, lang) })} /> : null}

      {target && atStation ? (
        <Card padding={4} elevated>
          <View style={{ alignItems: 'center', gap: 6 }}>
            <Text variant="label" tone="muted">
              {t('gateTrack.heading', { g: target.g.gate, name: station ? stationName(station, lang) : '' })}
            </Text>
            <View style={{ width: 200, height: 200, alignItems: 'center', justifyContent: 'center' }}>
              <Svg width={200} height={200} viewBox="0 0 200 200" style={{ position: 'absolute' }}>
                <Circle cx={100} cy={100} r={94} fill={arrived || ahead ? c.brandTint : c.surfaceAlt} stroke={arrived || ahead ? c.brand : c.outline} strokeWidth={3} />
              </Svg>
              {arrived ? (
                <Text size={52} lh={1.1} weight={700} color={c.brandDeep}>
                  {target.g.gate}
                </Text>
              ) : (
                <View style={{ transform: [{ rotate: `${rel ?? 0}deg` }], opacity: rel == null ? 0.25 : 1 }}>
                  <Svg width={110} height={130} viewBox="0 0 110 130">
                    <Path d="M55 6 100 118 55 94 10 118Z" fill={ahead ? c.brand : c.brandDeep} />
                  </Svg>
                </View>
              )}
            </View>
            <Text size={38} lh={1.2} weight={700} numeric>
              {target.d != null ? (arrived ? t('gateTrack.here') : fmtDistance(target.d, lang)) : '—'}
            </Text>
            <Text variant="label" tone="muted" align="center">
              {hint}
            </Text>
            <Text weight={600} align="center">
              {landmark(target.g)}
            </Text>
          </View>
        </Card>
      ) : null}

      <View style={{ gap: 8 }}>
        {rows.map(({ g, d }) => (
          <Pressable key={g.gate} accessibilityRole="button" onPress={() => setPicked(g.gate)}>
            <Card padding={3} elevated={g.gate === picked} tone={g.gate === picked ? 'surface' : 'alt'}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: g.gate === picked ? c.brandDeep : c.surface, alignItems: 'center', justifyContent: 'center' }}>
                  <Text weight={700} color={g.gate === picked ? c.onBrand : c.ink}>
                    {g.gate}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text weight={600}>{landmark(g)}</Text>
                  {d != null ? (
                    <Text variant="label" tone="muted">
                      {fmtDistance(d, lang)}
                    </Text>
                  ) : null}
                </View>
                {g.gate === closest ? <Chip label={t('gates.nearest')} tone="brand" /> : null}
              </View>
            </Card>
          </Pressable>
        ))}
      </View>

      <InfoNote icon="info" text={t('gateTrack.approx')} />
    </View>
  );
}
