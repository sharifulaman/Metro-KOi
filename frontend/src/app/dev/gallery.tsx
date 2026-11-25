
import { ScreenHeader } from '@/components/metro';
import { galleryRegistry } from '@/components/registry';
import { Card, Screen, SectionLabel, Segmented, Stack, Text } from '@/components/ui';
import { useT } from '@/i18n';
import type { Lang, ThemeMode } from '@/models';
import { useSettings } from '@/store/settings';
import { goBack } from '@/lib/nav';

/** Every catalog component, all variants; toggle light/dark and bn/en (spec §9.0 rule 4). */
export default function GalleryScreen() {
  const { t, lang } = useT();
  const themeMode = useSettings((s) => s.themeMode);
  const { setLang, setThemeMode } = useSettings.getState();
  return (
    <Screen scroll gap={4}>
      <ScreenHeader title={t('gallery.title')} onBack={() => goBack()} />
      <Stack direction="row" gap={2}>
        <Stack flex>
          <Segmented<Lang> value={lang} onChange={setLang} options={[{ value: 'bn', label: 'বাং' }, { value: 'en', label: 'EN' }]} />
        </Stack>
        <Stack flex>
          <Segmented<ThemeMode> value={themeMode === 'system' ? 'light' : themeMode} onChange={setThemeMode} options={[{ value: 'light', label: '☀' }, { value: 'dark', label: '☾' }]} />
        </Stack>
      </Stack>
      {galleryRegistry.map((entry) => (
        <Stack key={entry.name} gap={2}>
          <SectionLabel text={`${entry.layer}/ ${entry.name}`} />
          {entry.variants.map((v) => (
            <Card key={v.label} gap={2} padding={3}>
              <Text variant="micro" tone="muted">
                {v.label}
              </Text>
              {v.render()}
            </Card>
          ))}
        </Stack>
      ))}
    </Screen>
  );
}
