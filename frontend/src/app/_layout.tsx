import * as Location from 'expo-location';
import { useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';

import { AppProviders, AppStack } from '@/components/AppShell';
import { useLiveConnection } from '@/features/live/useLiveConnection';
import { useNearStationAlert } from '@/features/notify/useNearStationAlert';
import { initI18n, useI18nLanguage } from '@/i18n';
import { useClock } from '@/store/clock';
import { useSettings } from '@/store/settings';
import { useAppFonts } from '@/theme/fonts';

function Root() {
  const lang = useSettings((s) => s.lang);
  const onboarded = useSettings((s) => s.onboarded);
  const router = useRouter();
  const segments = useSegments();
  initI18n(lang);
  useI18nLanguage(lang);
  useLiveConnection();
  useNearStationAlert();

  useEffect(() => useClock.getState().stop(), []);

  // location is asked once, the first time the app opens; after that the OS remembers the answer
  useEffect(() => {
    if (useSettings.getState().locationAsked) return;
    useSettings.getState().setLocationAsked(true);
    void Location.requestForegroundPermissionsAsync().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!onboarded && segments[0] !== 'onboarding') router.replace('/onboarding');
  }, [onboarded, segments, router]);

  return <AppStack />;
}

export default function RootLayout() {
  const fontsReady = useAppFonts();
  const [hydrated, setHydrated] = useState(useSettings.persist.hasHydrated());
  useEffect(() => useSettings.persist.onFinishHydration(() => setHydrated(true)), []);
  if (!fontsReady || !hydrated) return null;
  return (
    <AppProviders>
      <Root />
    </AppProviders>
  );
}
