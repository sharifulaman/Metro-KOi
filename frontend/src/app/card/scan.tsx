import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

import { ScanView } from '@/components/metro';
import { useCardScan } from '@/features/card/useCardScan';
import { useSampleCards } from '@/features/card/useSampleCards';
import { useT } from '@/i18n';
import { useWallet } from '@/store/wallet';

/** Full-screen NFC scan (design ২): starts automatically, then hands off to /card/found on a good read. */
export default function CardScanScreen() {
  const { t } = useT();
  const router = useRouter();
  useSampleCards();
  const scan = useCardScan();
  const started = useRef(false);
  const sample = useWallet((s) => s.cards.find((c) => c.isDefault) ?? s.cards[0]);

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
    <ScanView
      title={t('card.scanTitle')}
      closeLabel={t('common.cancel')}
      onClose={cancel}
      heading={t('card.hold')}
      hint={t('card.holdHint')}
      error={scan.state.kind === 'error' ? t('card.err.' + scan.state.code) : undefined}
      retryLabel={t('card.scanAgain')}
      onRetry={() => void scan.start()}
      androidHint={t('card.androidHint')}
      iosHint={t('card.iosHint')}
      cancelLabel={t('common.cancel')}
      card={{ name: sample?.name ?? t('card.defaultCardName'), tail: sample?.tail ?? '4821', typeLabel: t('card.rapid_pass') }}
    />
  );
}
