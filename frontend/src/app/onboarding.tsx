import { useRouter } from 'expo-router';
import { useState } from 'react';

import { MapView3D } from '@/components/map';
import { TrainIllustration } from '@/components/metro';
import { Button, Card, InfoNote, Screen, Segmented, Stack, Text } from '@/components/ui';
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
  return (
    <Screen gap={5}>
      <Stack flex gap={5} justify="center">
        {step === 0 && (
          <>
            <Card radius="hero" padding={0}>
              <Stack>
                <MapView3D
                  stations={list.filter((_, i) => i % 3 === 0).map((s, i, a) => ({ id: s.id, label: stationName(s, lang), f: i / (a.length - 1) }))}
                  trains={[
                    { id: 'a', dir: 'SB', state: 'LIVE', f: 0.3 },
                    { id: 'b', dir: 'NB', state: 'ESTIMATED', f: 0.68 },
                  ]}
                  attribution={t('live.attribution')}
                  height={280}
                />
              </Stack>
            </Card>
            <Text variant="display">{t('onboarding.t1')}</Text>
            <Text tone="muted">{t('onboarding.b1')}</Text>
          </>
        )}
        {step === 1 && (
          <>
            <TrainIllustration />
            <Text variant="display">{t('onboarding.t2')}</Text>
            <Text tone="muted">{t('onboarding.b2')}</Text>
            <InfoNote icon="shield" text={t('rider.explain3')} />
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
