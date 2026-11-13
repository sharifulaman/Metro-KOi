import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

import { TrainIllustration } from '@/components/metro';
import { Button, Icon, IconButton, InfoNote, Screen, Stack, Text } from '@/components/ui';
import { useCardScan } from '@/features/card/useCardScan';
import { useT } from '@/i18n';

/** Full-screen NFC scan: starts automatically, then hands off to /card/found on a good read. */
export default function CardScanScreen() {
  const { t } = useT();
  const router = useRouter();
  const scan = useCardScan();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void scan.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (scan.state.kind === 'success') router.replace('/card/found');
  }, [scan.state.kind, router]);

  const cancel = () => {
    scan.cancel();
    router.back();
  };

  return (
    <Screen gap={5}>
      <IconButton icon="close" onPress={cancel} accessibilityLabel={t('common.cancel')} elevated />
      <Stack flex align="center" justify="center" gap={4}>
        <Icon name="nfc" size={56} tone="brand" />
        <TrainIllustration width={260} />
        <Text variant="heading" align="center">
          {t('card.hold')}
        </Text>
        {scan.state.kind === 'error' ? (
          <InfoNote icon="info" tone="danger" text={t(`card.err.${scan.state.code}`)} testID="scan-error" />
        ) : (
          <Text tone="muted" align="center">
            {t('card.holdHint')}
          </Text>
        )}
      </Stack>
      <Stack gap={2}>
        <InfoNote icon="info" text={t('card.androidHint')} />
        <InfoNote icon="info" text={t('card.iosHint')} />
      </Stack>
      {scan.state.kind === 'error' ? <Button label={t('card.scanAgain')} icon="nfc" fullWidth onPress={() => void scan.start()} /> : null}
      <Button label={t('common.cancel')} variant="secondary" fullWidth onPress={cancel} />
    </Screen>
  );
}
