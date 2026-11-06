import { useRouter } from 'expo-router';

import { ScreenHeader, TrainIllustration } from '@/components/metro';
import { Button, Card, Icon, InfoNote, Screen, Stack, Text } from '@/components/ui';
import { useNfcSupport } from '@/features/card/useNfcSupport';
import { useT } from '@/i18n';

/** Card tap (NFC) — feasibility-gated (spec §10.10, §18.4). */
export default function CardScreen() {
  const { t } = useT();
  const router = useRouter();
  const nfc = useNfcSupport();
  return (
    <Screen scroll gap={5}>
      <ScreenHeader title={t('card.title')} />
      <Card radius="hero" padding={6} gap={4}>
        <Stack align="center" gap={4}>
          <Icon name="nfc" size={56} tone="brand" />
          <TrainIllustration width={260} />
          <Text variant="title" align="center">
            {t('card.hold')}
          </Text>
        </Stack>
      </Card>
      {nfc !== 'balance' ? <InfoNote icon="info" text={t('card.holdBody')} /> : null}
      <Stack gap={3}>
        <Button label={t('card.balance')} icon="wallet" fullWidth onPress={() => router.push('/balance')} />
        <Button label={t('card.history')} icon="history" variant="secondary" fullWidth onPress={() => router.push('/history')} />
      </Stack>
    </Screen>
  );
}
