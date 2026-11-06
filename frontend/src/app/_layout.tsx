import { useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';

import { AppProviders, AppStack } from '@/components/AppShell';
import { useLiveConnection } from '@/features/live/useLiveConnection';
import { initI18n } from '@/i18n';
import { useSettings } from '@/store/settings';
import { useAppFonts } from '@/theme/fonts';

function Root() {
  const lang = useSettings((s) => s.lang);
  const onboarded = useSettings((s) => s.onboarded);
  const router = useRouter();
  const segments = useSegments();
  initI18n(lang);
  useLiveConnection();

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
