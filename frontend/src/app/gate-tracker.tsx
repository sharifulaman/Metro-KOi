import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { GateCompassView, GateFinderView } from '@/components/metro';
import { ListRow, Screen, Sheet, Text } from '@/components/ui';
import { useGateFlow } from '@/features/gates/useGateFlow';
import { StationMap } from '@/features/stations/StationMap';
import { stationName } from '@/features/stations/useStations';
import { useT } from '@/i18n';
import type { Gate } from '@/models';
import { goBack } from '@/lib/nav';

/** Exit-gate flow: step 1 picks the station and gate, step 2 is the compass tracker that points at it. */
export default function GateTrackerScreen() {
  const { station } = useLocalSearchParams<{ station?: string }>();
  const { t, lang } = useT();
  const f = useGateFlow(station);
  const [picking, setPicking] = useState(false);
  const [threeD, setThreeD] = useState(false);
  // heading-up by default: walking, the map's 'ahead' is the street's 'ahead' (docs/train-tracking-plan.md §6.3)
  const [headingUp, setHeadingUp] = useState(true);
  const gatePin = f.mapGates.find((g) => g.letter === f.selected);

  // the 'approximate' warning goes away once every gate of the station is surveyed
  const header = { backLabel: t('common.back'), footnote: f.approx ? t('gateTrack.approx') : undefined };
  return (
    <Screen bleed>
      {f.tracking && f.target ? (
        <GateCompassView
          testID="gate-compass"
          title={t('gateTrack.trackerTitle')}
          subtitle={t('gateTrack.trackerSubtitle')}
          onBack={f.stopTracking}
          backLabel={header.backLabel}
          caption={t('gateTrack.heading', { g: f.selected, name: f.stationLabel })}
          distance={f.distanceText}
          status={f.statusText}
          landmark={f.target.full || t('gates.gate', { g: f.selected })}
          rotation={f.rotation}
          arrived={f.arrived}
          ahead={f.ahead}
          gate={f.selected}
          rows={f.rows.map((r) => ({ gate: r.gate, name: r.full || r.name, distance: f.shortDistance(r.d), selected: r.gate === f.selected, onPress: () => f.select(r.gate) }))}
          footnote={header.footnote}
        />
      ) : (
        <GateFinderView
          testID="gate-finder"
          title={t('gateTrack.findTitle')}
          subtitle={t('gateTrack.findSubtitle')}
          onBack={() => goBack()}
          backLabel={header.backLabel}
          stationCaption={t('gateTrack.stationCaption')}
          stationName={f.stationLabel}
          changeLabel={t('gateTrack.change')}
          onChangeStation={() => setPicking(true)}
          nearestNote={f.nearestNote}
          map={
            <StationMap
              stationId={f.stationId}
              tilt={threeD}
              zoom={threeD ? 16.5 : 17.5}
              gates={f.mapGates}
              selectedGate={`${f.stationId}:${f.selected}`}
              onGatePress={(id) => f.select(id.split(':')[1] as Gate)}
              walkTo={gatePin ? { lat: gatePin.lat, lng: gatePin.lng } : null}
              headingUp={headingUp}
              onCompass={() => setHeadingUp((v) => !v)}
            />
          }
          view3d={{ active: threeD, label: t(threeD ? 'live.tilt2d' : 'live.tilt3d'), onPress: () => setThreeD((v) => !v) }}
          mapNote={f.userAccuracy != null && f.userAccuracy > 30 ? t('gateTrack.gpsWeak') : f.approx ? t('gateTrack.mapApprox') : undefined}
          gates={f.rows.map((r) => ({ gate: r.gate, name: r.name, area: r.area, tag: r.gate === f.nearestGate ? t('gateTrack.nearestTag') : undefined, selected: r.gate === f.selected, onPress: () => f.select(r.gate) }))}
          actionLabel={t('gateTrack.exitVia', { g: f.selected })}
          onAction={f.startTracking}
          footnote={header.footnote}
        />
      )}
      {picking ? (
        <Sheet modal onDismiss={() => setPicking(false)}>
          <Text variant="title">{t('gateTrack.stationCaption')}</Text>
          {f.stations.map((s, i) => (
            <ListRow
              key={s.id}
              title={stationName(s, lang)}
              highlighted={s.id === f.stationId}
              divider={i < f.stations.length - 1}
              onPress={() => {
                f.changeStation(s.id);
                setPicking(false);
              }}
            />
          ))}
        </Sheet>
      ) : null}
    </Screen>
  );
}
