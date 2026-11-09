import { useRouter } from 'expo-router';
import { Platform } from 'react-native';

import { BalanceCard, ScreenHeader, TrainIllustration } from '@/components/metro';
import { Button, Card, Icon, InfoNote, Screen, Stack, Text } from '@/components/ui';
import { openNfcSettings } from '@/features/card/nfcReader';
import { useCardScan } from '@/features/card/useCardScan';
import { useNfcStatus } from '@/features/card/useNfcSupport';
import { useT } from '@/i18n';
import { fmtClock, fmtDate, secOfDayFromMs } from '@/lib/fmt';
import { useCard } from '@/store/card';

/** Card tap (spec §10.10): reads the MRT / Rapid Pass balance and history by NFC (FeliCa). */
export default function CardScreen() {
  const { t, lang } = useT();
  const router = useRouter();
  const nfc = useNfcStatus();
  const scan = useCardScan();
  const last = useCard((s) => s.last);
  const when = (ms: number) => `${fmtDate(ms, lang)}, ${fmtClock(secOfDayFromMs(ms), lang)}`;
  const st = scan.state;
  const ready = nfc.availability === 'ready';

  return (
    <Screen scroll gap={5}>
      <ScreenHeader title={t('card.title')} />

      {st.kind === 'success' || (last && st.kind !== 'waiting') ? (
        <BalanceCard
          balanceBdt={st.kind === 'success' ? st.read.balance : last?.balanceBdt ?? null}
          source="card"
          cardTail={last ? `${t(`card.${last.cardType}`)} · ${t('card.cardTail', { tail: last.cardTail })}` : undefined}
          lastTap={last ? t('card.readAt', { time: when(last.readAt) }) : undefined}
          labels={{ title: t('card.balance'), unavailable: t('card.noBalance'), source: t('card.cardSource') }}
          testID="card-balance"
        />
      ) : (
        <Card radius="hero" padding={6} gap={4}>
          <Stack align="center" gap={4}>
            <Icon name="nfc" size={56} tone="brand" />
            <TrainIllustration width={260} />
            <Text variant="title" align="center">
              {st.kind === 'waiting' ? t('card.waiting') : t('card.hold')}
            </Text>
            {st.kind === 'waiting' && Platform.OS === 'android' ? (
              <Text tone="muted" align="center">
                {t('card.waitingAndroid')}
              </Text>
            ) : null}
          </Stack>
        </Card>
      )}

      {st.kind === 'success' && st.read.partial ? <InfoNote icon="info" tone="live" text={t('card.partial')} /> : null}
      {st.kind === 'error' ? <InfoNote icon="info" tone="danger" text={t(`card.err.${st.code}`)} testID="card-error" /> : null}

      {nfc.availability === 'no_module' ? <InfoNote icon="info" text={t('card.needsBuild')} /> : null}
      {nfc.availability === 'unsupported' ? <InfoNote icon="info" text={t('card.noNfc')} /> : null}
      {nfc.availability === 'disabled' ? (
        <InfoNote icon="nfc" tone="live" text={`${t('card.nfcOff')}. ${t('card.nfcOffBody')}`} action={{ label: t('card.openSettings'), onPress: openNfcSettings }} />
      ) : null}

      <Stack gap={3}>
        {ready ? (
          st.kind === 'waiting' ? (
            <Button label={t('common.cancel')} variant="secondary" fullWidth onPress={scan.cancel} testID="card-cancel" />
          ) : (
            <Button label={st.kind === 'idle' && !last ? t('card.scan') : t('card.scanAgain')} icon="nfc" fullWidth onPress={() => void scan.start()} testID="card-scan" />
          )
        ) : null}
        <Button label={t('card.balance')} icon="wallet" variant="secondary" fullWidth onPress={() => router.push('/balance')} />
        <Button label={t('card.history')} icon="history" variant="secondary" fullWidth onPress={() => router.push('/history')} />
      </Stack>
      {ready ? (
        <Text variant="micro" tone="muted">
          {t('card.readOnly')}
        </Text>
      ) : null}
    </Screen>
  );
}
