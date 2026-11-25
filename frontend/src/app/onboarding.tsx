import { useRouter } from 'expo-router';
import { useState } from 'react';

import { ObPrefsView, ObWelcomeView, ShareOnboardView } from '@/components/metro';
import { stationName, useStations } from '@/features/stations/useStations';
import { useT } from '@/i18n';
import { useSettings } from '@/store/settings';

const STEPS = 3;

/** First launch (design: ObWelcome → ObPrefs → ShareOnboard): the live line, language and theme, then ride sharing. */
export default function Onboarding() {
  const { t, lang } = useT();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const { first, last } = useStations();
  const themeMode = useSettings((s) => s.themeMode);
  const { setLang, setThemeMode, setOnboarded, setShareRides } = useSettings.getState();
  const finish = (share?: boolean) => {
    if (share != null) setShareRides(share);
    setOnboarded(true);
    router.replace('/');
  };

  if (step === 0) {
    return (
      <ObWelcomeView
        title={t('onboarding.t1')}
        body={t('onboarding.b1')}
        fromLabel={first ? stationName(first, lang) : ''}
        toLabel={last ? stationName(last, lang) : ''}
        etaLabel={t('onboarding.eta')}
        liveLabel={t('onboarding.live')}
        nextLabel={t('onboarding.next')}
        skipLabel={t('onboarding.skip')}
        onNext={() => setStep(1)}
        onSkip={() => finish()}
        progress={{ index: 0, count: STEPS }}
        testID="onboarding-welcome"
      />
    );
  }

  if (step === 1) {
    return (
      <ObPrefsView
        title={t('onboarding.prefsTitle')}
        body={t('onboarding.prefsBody')}
        lang={lang}
        onLang={setLang}
        theme={themeMode}
        onTheme={setThemeMode}
        labels={{
          language: t('more.language'),
          theme: t('more.theme'),
          bangla: 'বাংলা',
          banglaSub: t('onboarding.banglaSub'),
          english: 'English',
          englishSub: t('onboarding.englishSub'),
          system: t('more.themeSystem'),
          light: t('more.themeLight'),
          dark: t('more.themeDark'),
          systemNote: t('onboarding.systemNote'),
        }}
        nextLabel={t('onboarding.next')}
        onNext={() => setStep(2)}
        progress={{ index: 1, count: STEPS }}
        testID="onboarding-prefs"
      />
    );
  }

  // ride sharing last, already in the language just picked; both choices finish onboarding
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
      onEnable={() => finish(true)}
      onSkip={() => finish(false)}
      progress={{ index: 2, count: STEPS }}
      testID="onboarding-share"
    />
  );
}
