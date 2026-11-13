import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Splash } from '@/components/metro';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/useTheme';

const queryClient = new QueryClient();

/** App-wide providers. Lives here so `src/app/**` stays free of style objects. */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/** Root stack navigator themed with the app background, under the opening page (shown once per launch). */
export function AppStack() {
  const { c, dark } = useTheme();
  const { t } = useT();
  const [splash, setSplash] = useState(true);
  return (
    <View style={{ flex: 1 }}>
      <StatusBar style={splash || dark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }} />
      {splash ? (
        <Splash
          title="Metro"
          accent="KOI"
          subtitle={t('splash.brandBn')}
          tagline={t('splash.tagline')}
          status={t('splash.status')}
          credit={t('splash.credit')}
          logoLabel={t('splash.logo')}
          onFinish={() => setSplash(false)}
          testID="splash"
        />
      ) : null}
    </View>
  );
}
