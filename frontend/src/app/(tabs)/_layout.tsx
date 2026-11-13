import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabBar, type TabKey } from '@/components/metro';
import { useT } from '@/i18n';

const ROUTE_OF: Record<TabKey, string> = { live: 'index', stations: 'stations', journey: 'journey', card: 'card', more: 'more' };
const KEY_OF: Record<string, TabKey> = { index: 'live', stations: 'stations', journey: 'journey', card: 'card', more: 'more' };

/** The one TabBar instance (spec §9.0 rule 5). */
export default function TabsLayout() {
  const { t } = useT();
  const insets = useSafeAreaInsets();
  const labels = { live: t('tabs.live'), stations: t('tabs.stations'), journey: t('tabs.journey'), card: t('tabs.card'), more: t('tabs.more') };
  return (
    <Tabs
      screenOptions={{ headerShown: false, tabBarStyle: { position: 'absolute' } }}
      tabBar={({ state, navigateToTab, insets: tabInsets }) => (
        <TabBar
          active={KEY_OF[state.routes[state.index].name] ?? 'live'}
          onSelect={(k) => {
            const route = state.routes.find((r) => r.name === ROUTE_OF[k]);
            if (route) navigateToTab(route.key);
          }}
          labels={labels}
          bottomInset={tabInsets?.bottom ?? insets.bottom}
        />
      )}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="stations" />
      <Tabs.Screen name="journey" />
      <Tabs.Screen name="card" />
      <Tabs.Screen name="more" />
    </Tabs>
  );
}
