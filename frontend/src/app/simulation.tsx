import { useLocalSearchParams, useRouter } from 'expo-router';

import { SimulationView } from '@/components/map';
import { ScreenHeader } from '@/components/metro';
import { Screen, Stack } from '@/components/ui';
import { stationName, useStations } from '@/features/stations/useStations';
import { useT } from '@/i18n';

/**
 * 3D "station to station" simulation (assets/sim/station-to-station.html):
 * the train stops at every station, opens its doors and leaves; cameras,
 * gates and the inside route are controlled in the page itself.
 * Open with /simulation?from=<stationId>&to=<stationId>.
 */
export default function SimulationScreen() {
  const { from, to } = useLocalSearchParams<{ from?: string; to?: string }>();
  const { t, lang } = useT();
  const router = useRouter();
  const { list } = useStations();
  const idx = (id: string | undefined, fallback: number) => {
    const i = list.findIndex((s) => s.id === id);
    return i >= 0 ? i : fallback;
  };
  // page defaults: Agargaon → Karwan Bazar
  const a = idx(from, 8);
  const b = idx(to, a === 11 ? 8 : 11);
  return (
    <Screen bleed>
      <Stack safe="top" padX={4} padY={2}>
        <ScreenHeader
          title={t('sim.title')}
          subtitle={`${stationName(list[a], lang)} → ${stationName(list[b], lang)}`}
          onBack={() => router.back()}
          backLabel={t('common.back')}
        />
      </Stack>
      <Stack flex>
        <SimulationView fromIdx={a} toIdx={b} errorText={t('sim.error')} testID="simulation" />
      </Stack>
    </Screen>
  );
}
