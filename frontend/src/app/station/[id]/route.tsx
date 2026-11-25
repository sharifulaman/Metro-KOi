import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { GateSelector, RouteSteps, ScreenHeader, StationSection } from '@/components/metro';
import { Screen, Segmented } from '@/components/ui';
import { buildRouteSteps, gateLabels, toGateItems, useStationGates } from '@/features/gates/useStationGates';
import { stationName, useStations } from '@/features/stations/useStations';
import { useT } from '@/i18n';
import { fmtNum } from '@/lib/fmt';
import type { Gate, GateMode, Platform } from '@/models';
import { goBack } from '@/lib/nav';

/** Inside the station: gate → platform (spec §18.3, board 14). Also the 3D fallback. */
export default function InsideRouteScreen() {
  const { id, gate } = useLocalSearchParams<{ id: string; gate?: Gate }>();
  const { t, lang } = useT();
  const { byId, first, last } = useStations();
  const { gates } = useStationGates(id);
  const [selected, setSelected] = useState<Gate>(gate ?? 'A');
  const [mode, setMode] = useState<GateMode>('entry');
  const [platform, setPlatform] = useState<Platform>(1);
  const st = byId[id];
  if (!st) return null;
  const towards = stationName(platform === 1 ? last : first, lang);
  const walk = gates.find((g) => g.gate === selected)?.walkMin;
  return (
    <Screen scroll gap={4}>
      <ScreenHeader title={t('route.title')} subtitle={stationName(st, lang)} onBack={() => goBack()} backLabel={t('common.back')} />
      <StationSection
        gate={selected}
        platform={platform}
        mode={mode}
        trainAt={platform}
        labels={{
          concourse: t('route.concourse'),
          platform1: `${t('common.platform', { n: fmtNum(1, lang) })} ${t('common.towardsShort', { name: stationName(last, lang) })}`,
          platform2: `${t('common.platform', { n: fmtNum(2, lang) })} ${t('common.towardsShort', { name: stationName(first, lang) })}`,
          street: stationName(st, lang),
        }}
      />
      <Segmented<GateMode> value={mode} onChange={setMode} options={[{ value: 'entry', label: t('route.entry') }, { value: 'exit', label: t('route.exit') }]} />
      <Segmented<'1' | '2'>
        variant="tabs"
        value={String(platform) as '1' | '2'}
        onChange={(v) => setPlatform(Number(v) as Platform)}
        options={[
          { value: '1', label: t('common.towards', { name: stationName(last, lang) }) },
          { value: '2', label: t('common.towards', { name: stationName(first, lang) }) },
        ]}
      />
      <GateSelector variant="chips" gates={toGateItems(gates, lang)} selected={selected} onSelect={setSelected} labels={gateLabels(t)} />
      <RouteSteps steps={buildRouteSteps(mode, selected, platform, towards, lang, t)} estimate={walk != null ? t('route.est', { n: fmtNum(walk, lang) }) : t('route.estUnknown')} />
    </Screen>
  );
}
