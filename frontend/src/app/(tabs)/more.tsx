import { useRouter } from 'expo-router';
import { useState } from 'react';

import { ScreenHeader } from '@/components/metro';
import { Card, IconTile, InfoNote, ListRow, Screen, SectionLabel, Segmented, SwitchRow, Text } from '@/components/ui';
import { useT } from '@/i18n';
import type { Lang, ThemeMode } from '@/models';
import { useSettings } from '@/store/settings';

export default function MoreScreen() {
  const { t, lang } = useT();
  const router = useRouter();
  const themeMode = useSettings((s) => s.themeMode);
  const notifications = useSettings((s) => s.notifications);
  const { setLang, setThemeMode, setNotifications } = useSettings.getState();
  const [showCredits, setShowCredits] = useState(false);
  return (
    <Screen scroll gap={4} withTabBar>
      <ScreenHeader title={t('more.title')} />
      <SectionLabel text={t('more.language')} />
      <Segmented<Lang> value={lang} onChange={setLang} options={[{ value: 'bn', label: 'বাংলা' }, { value: 'en', label: 'English' }]} testID="lang" />
      <SectionLabel text={t('more.theme')} />
      <Segmented<ThemeMode>
        value={themeMode}
        onChange={setThemeMode}
        testID="theme"
        options={[
          { value: 'system', label: t('more.themeSystem') },
          { value: 'light', label: t('more.themeLight') },
          { value: 'dark', label: t('more.themeDark') },
        ]}
      />
      <Card padding={3}>
        <SwitchRow label={t('more.notifications')} value={notifications} onValueChange={setNotifications} divider />
        <ListRow title={t('more.timetable')} leading={<IconTile icon="calendar" tone="neutral" />} chevron divider onPress={() => router.push('/timetable')} />
        <ListRow title={t('sim.more')} subtitle={t('sim.moreSub')} leading={<IconTile icon="box" tone="neutral" />} chevron divider onPress={() => router.push('/simulation')} testID="more-sim" />
        <ListRow title={t('more.privacy')} leading={<IconTile icon="shield" tone="neutral" />} subtitle={t('rider.explain3')} divider />
        <ListRow title={t('more.about')} leading={<IconTile icon="info" tone="neutral" />} chevron divider onPress={() => setShowCredits((v) => !v)} />
        {showCredits ? <Text variant="label" tone="muted">{t('more.credits')}</Text> : null}
        <ListRow title={t('more.report')} leading={<IconTile icon="bell" tone="neutral" />} divider />
        {__DEV__ ? <ListRow title={t('more.gallery')} leading={<IconTile icon="layers" tone="neutral" />} chevron onPress={() => router.push('/dev/gallery')} /> : null}
      </Card>
      <InfoNote text={t('app.unofficial')} />
    </Screen>
  );
}
