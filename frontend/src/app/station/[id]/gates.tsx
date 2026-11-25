import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

import { GateSelector, ScreenHeader, StationHeader } from '@/components/metro';
import { Button, InfoNote, Screen } from '@/components/ui';
import { gateLabels, toGateItems, useStationGates } from '@/features/gates/useStationGates';
import { stationAltName, stationName, useStations } from '@/features/stations/useStations';
import { useT } from '@/i18n';
import type { Gate } from '@/models';
import { goBack } from '@/lib/nav';

/** Gates A B C D (spec §10.8, board 13). */
export default function GatesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, lang } = useT();
  const router = useRouter();
  const { byId } = useStations();
  const { gates, recommended, surveyed } = useStationGates(id);
  const [selected, setSelected] = useState<Gate>(recommended ?? 'A');
  const st = byId[id];
  if (!st) return null;
  const items = toGateItems(gates, lang);
  const labels = gateLabels(t);
  return (
    <Screen scroll gap={4}>
      <ScreenHeader title={t('gates.title')} onBack={() => goBack()} backLabel={t('common.back')} />
      <StationHeader compact name={stationName(st, lang)} altName={stationAltName(st, lang)} />
      <GateSelector variant="pins" gates={items} selected={selected} recommended={recommended} onSelect={setSelected} labels={labels} />
      <GateSelector variant="cards" gates={items} selected={selected} recommended={recommended} onSelect={setSelected} labels={labels} />
      {!surveyed ? <InfoNote icon="info" text={t('gates.surveyNote')} /> : null}
      <Button label={t('gates.route')} icon="walk" fullWidth onPress={() => router.push(`/station/${id}/route?gate=${selected}`)} />
    </Screen>
  );
}
