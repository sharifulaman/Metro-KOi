import { Stack as RouteStack, useRouter } from 'expo-router';

import { Button, Chip, IconTile, ListRow, Screen, Sheet, Stack, Text } from '@/components/ui';
import { useT } from '@/i18n';

/** How to save a card (design ৫): a sheet over the Card page — tap it to the phone, or type a name and last 4 digits. */
export default function CardAddScreen() {
  const { t } = useT();
  const router = useRouter();
  const close = () => router.back();
  return (
    <Screen bleed>
      <RouteStack.Screen options={{ presentation: 'transparentModal', animation: 'slide_from_bottom', headerShown: false }} />
      <Sheet modal onDismiss={close} gap={3} testID="add-sheet">
        <Stack gap={1}>
          <Text variant="heading">{t('card.chooseHowTitle')}</Text>
          <Text tone="muted">{t('card.chooseHowBody')}</Text>
        </Stack>
        <Stack gap={3}>
          <ListRow
            highlighted
            leading={<IconTile icon="nfc" tone="brand" />}
            title={t('card.scanOptionTitle')}
            subtitle={t('card.scanOptionBody')}
            trailing={<Chip label={t('card.scanOptionEasy')} tone="brand" />}
            onPress={() => router.replace('/card/scan')}
            testID="add-scan"
          />
          <ListRow
            leading={<IconTile icon="edit" tone="brand" />}
            title={t('card.manualOptionTitle')}
            subtitle={t('card.manualOptionBody')}
            onPress={() => router.replace('/card/manual')}
            testID="add-manual"
          />
        </Stack>
        <Button label={t('common.cancel')} variant="secondary" size="md" fullWidth onPress={close} />
      </Sheet>
    </Screen>
  );
}
