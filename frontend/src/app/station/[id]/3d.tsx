import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

import { GateSelector, RouteSteps, ScreenHeader, StationHeader, StationSection, TrainCard } from '@/components/metro';
import { Card, InfoNote, Screen, Segmented, SwitchRow } from '@/components/ui';
import { buildRouteSteps, gateLabels, toGateItems, useStationGates } from '@/features/gates/useStationGates';
import { platformTitle } from '@/features/stations/mappers';
import { useDepartures } from '@/features/stations/useDepartures';
import { stationAltName, stationName, useStations } from '@/features/stations/useStations';
import { useT } from '@/i18n';
import { fmtNum } from '@/lib/fmt';
import type { Gate, GateMode } from '@/models';

type Shot = 'exterior' | 'platform' | 'city' | 'line';

/**
 * Station 3D (spec §19, board 8). The GL scene (Task 12) is not built yet, so
 * the scene area uses the 2D cross-section fallback; the panel is final and
 * shares TrainCard / GateSelector / RouteSteps with the 2D screens.
 */
export default function Station3DScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, lang } = useT();
  const router = useRouter();
  const { byId, first, last } = useStations();
  const deps = useDepartures(id, 1);
  const { gates, recommended } = useStationGates(id);
  const [gate, setGate] = useState<Gate>(recommended ?? 'A');
  const [mode, setMode] = useState<GateMode>('entry');
  const [shot, setShot] = useState<Shot>('platform');
  const [roofOpen, setRoofOpen] = useState(true);
  const [showCrowd, setShowCrowd] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [tour, setTour] = useState(false);
  const st = byId[id];
  if (!st) return null;
  const sb = deps.byDir.SB[0];
  const nb = deps.byDir.NB[0];
  const trainAt = sb && sb.etaSec < 30 ? 1 : nb && nb.etaSec < 30 ? 2 : null;
  const cardLabels = { atStation: t('train.atStation'), departed: t('train.departed') };
  return (
    <Screen scroll gap={4}>
      <ScreenHeader title={t('s3d.title')} onBack={() => router.back()} backLabel={t('common.back')} />
      <Segmented<Shot>
        variant="tabs"
        value={shot}
        onChange={setShot}
        options={(['exterior', 'platform', 'city', 'line'] as const).map((s) => ({ value: s, label: t(`s3d.shots.${s}`) }))}
      />
      <StationSection
        gate={gate}
        mode={mode}
        platform={1}
        trainAt={trainAt}
        roofOpen={roofOpen}
        labels={{
          concourse: showLabels ? t('route.concourse') : '',
          platform1: showLabels ? `${t('common.platform', { n: fmtNum(1, lang) })} ${t('common.towardsShort', { name: stationName(last, lang) })}` : '',
          platform2: showLabels ? `${t('common.platform', { n: fmtNum(2, lang) })} ${t('common.towardsShort', { name: stationName(first, lang) })}` : '',
          street: showLabels ? stationName(st, lang) : '',
        }}
      />
      <InfoNote icon="box" text={t('s3d.fallback')} />
      <StationHeader compact name={stationName(st, lang)} altName={stationAltName(st, lang)} />
      {!deps.isTerminusFor.SB ? (
        <TrainCard compact platform={1} title={platformTitle('SB', first, last, lang, t)} eta={sb ? { sec: sb.etaSec } : undefined} source={sb?.source ?? 'schedule'} trainId={sb?.source === 'live' ? sb.trainId : undefined} labels={cardLabels} />
      ) : null}
      {!deps.isTerminusFor.NB ? (
        <TrainCard compact platform={2} title={platformTitle('NB', first, last, lang, t)} eta={nb ? { sec: nb.etaSec } : undefined} source={nb?.source ?? 'schedule'} trainId={nb?.source === 'live' ? nb.trainId : undefined} labels={cardLabels} />
      ) : null}
      <GateSelector variant="chips" gates={toGateItems(gates, lang)} selected={gate} recommended={recommended} onSelect={setGate} labels={gateLabels(t)} />
      <Segmented<GateMode> value={mode} onChange={setMode} options={[{ value: 'entry', label: t('route.entry') }, { value: 'exit', label: t('route.exit') }]} />
      <RouteSteps steps={buildRouteSteps(mode, gate, 1, stationName(last, lang), lang, t)} />
      <Card padding={3}>
        <SwitchRow label={t('s3d.roofOff')} value={roofOpen} onValueChange={setRoofOpen} divider />
        <SwitchRow label={t('s3d.crowd')} value={showCrowd} onValueChange={setShowCrowd} divider />
        <SwitchRow label={t('s3d.labels')} value={showLabels} onValueChange={setShowLabels} divider />
        <SwitchRow label={t('s3d.tour')} value={tour} onValueChange={setTour} />
      </Card>
      {showCrowd ? <InfoNote icon="users" tone="live" text={t('s3d.crowdNote')} /> : null}
    </Screen>
  );
}
