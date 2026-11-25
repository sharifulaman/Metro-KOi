import { useRouter } from 'expo-router';
import { useState } from 'react';

import { GoogleMapView } from '@/components/map';
import { ShareOnboardView } from '@/components/metro';
import { Button, Card, Screen, Segmented, Stack, Text } from '@/components/ui';
import { stationName, useStations } from '@/features/stations/useStations';
import { useT } from '@/i18n';
import type { Lang, ThemeMode } from '@/models';
import { useSettings } from '@/store/settings';

export default function Onboarding() {
  const { t, lang } = useT();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const { list } = useStations();
  const themeMode = useSettings((s) => s.themeMode);
  const { setLang, setThemeMode, setOnboarded } = useSettings.getState();
  const finish = () => {
    setOnboarded(true);
    router.replace('/');
  };
  if (step === 1) {
    // ride sharing: its own full-screen page (design: share onboarding); both choices move on
    const next = (share: boolean) => {
      useSettings.getState().setShareRides(share);
      setStep(2);
    };
    return (
      <ShareOnboardView
        title={t('shareIntro.title')}
        body={t('shareIntro.body')}
        rows={[
          { icon: 'shield', title: t('shareIntro.anonTitle'), body: t('shareIntro.anonBody') },
          { icon: 'clock', title: t('shareIntro.tripTitle'), body: t('shareIntro.tripBody') },
          { icon: 'lock', title: t('shareIntro.deleteTitle'), body: t('shareIntro.deleteBody') },
        ]}
        trainLabel={t('shareIntro.train')}
        liveLabel={t('shareIntro.liveForAll')}
        ctaLabel={t('shareIntro.cta')}
        note={t('shareIntro.note')}
        skipLabel={t('shareIntro.skip')}
        onEnable={() => next(true)}
        onSkip={() => next(false)}
        progress={{ index: 1, count: 3 }}
        testID="onboarding-share"
      />
    );
  }
  return (
    <Screen gap={5}>
      <Stack flex gap={5} justify="center">
        {step === 0 && (
          <>
            <Card radius="hero" padding={0}>
              <Stack>
                <GoogleMapView
                  stations={list.filter((_, i) => i % 3 === 0).map((s, i, a) => ({ id: s.id, label: stationName(s, lang), f: i / (a.length - 1) }))}
                  trains={[
                    { id: 'a', dir: 'SB', state: 'LIVE', f: 0.3 },
                    { id: 'b', dir: 'NB', state: 'ESTIMATED', f: 0.68 },
                  ]}
                  errorText={t('live.mapError')}
                  height={280}
                />
              </Stack>
            </Card>
            <Text variant="display">{t('onboarding.t1')}</Text>
            <Text tone="muted">{t('onboarding.b1')}</Text>
          </>
        )}
        {step === 2 && (
          <>
            <Text variant="display">{t('onboarding.t3')}</Text>
            <Text variant="label" tone="muted">{t('more.language')}</Text>
            <Segmented<Lang> value={lang} onChange={setLang} options={[{ value: 'bn', label: 'বাংলা' }, { value: 'en', label: 'English' }]} />
            <Text variant="label" tone="muted">{t('more.theme')}</Text>
            <Segmented<ThemeMode>
              value={themeMode}
              onChange={setThemeMode}
              options={[
                { value: 'system', label: t('more.themeSystem') },
                { value: 'light', label: t('more.themeLight') },
                { value: 'dark', label: t('more.themeDark') },
              ]}
            />
          </>
        )}
      </Stack>
      <Button fullWidth label={step < 2 ? t('onboarding.next') : t('onboarding.start')} onPress={() => (step < 2 ? setStep(step + 1) : finish())} testID="onboarding-next" />
    </Screen>
  );
}
