import { useRouter } from 'expo-router';

import { BalanceCard, EmptyState, ScreenHeader, TransactionRow } from '@/components/metro';
import { Button, Card, InfoNote, Screen, SectionLabel } from '@/components/ui';
import { useCardScan } from '@/features/card/useCardScan';
import { useNfcStatus } from '@/features/card/useNfcSupport';
import { useHistoryView } from '@/features/history/useHistoryView';
import { useT } from '@/i18n';
import { fmtClock, fmtDate, secOfDayFromMs } from '@/lib/fmt';
import { useCard } from '@/store/card';

/** Balance (spec §10.10, board 10): the last NFC card read, else local history only. */
export default function BalanceScreen() {
  const { t, lang } = useT();
  const router = useRouter();
  const view = useHistoryView('all', lang, t);
  const last = useCard((s) => s.last);
  const nfc = useNfcStatus();
  const scan = useCardScan();
  const recent = view.groups.flatMap((g) => g.rows).slice(0, 5);
  const when = (ms: number) => `${fmtDate(ms, lang)}, ${fmtClock(secOfDayFromMs(ms), lang)}`;
  return (
    <Screen scroll gap={4}>
      <ScreenHeader title={t('card.balance')} onBack={() => router.back()} backLabel={t('common.back')} />
      {last ? (
        <BalanceCard
          balanceBdt={last.balanceBdt}
          source="card"
          cardTail={`${t(`card.${last.cardType}`)} · ${t('card.cardTail', { tail: last.cardTail })}`}
          lastTap={t('card.lastFromCard', { time: when(last.readAt) })}
          labels={{ title: t('card.balance'), unavailable: t('card.noBalance'), source: t('card.cardSource') }}
        />
      ) : (
        <BalanceCard
          balanceBdt={null}
          source="local"
          lastTap={view.last ? t('card.lastTap', { time: fmtClock(secOfDayFromMs(view.last.at), lang) }) : undefined}
          labels={{ title: t('card.balance'), unavailable: t('card.noBalance'), source: t('card.localSource') }}
        />
      )}
      {scan.state.kind === 'error' ? <InfoNote icon="info" tone="danger" text={t(`card.err.${scan.state.code}`)} /> : null}
      {nfc.availability === 'ready' ? (
        <Button
          label={scan.state.kind === 'waiting' ? t('card.waiting') : last ? t('card.scanAgain') : t('card.scan')}
          icon="nfc"
          loading={scan.state.kind === 'waiting'}
          fullWidth
          onPress={() => void scan.start()}
        />
      ) : nfc.availability === 'no_module' ? (
        <InfoNote icon="info" text={t('card.needsBuild')} />
      ) : null}
      <SectionLabel text={t('card.recent')} />
      {recent.length === 0 ? (
        <EmptyState compact icon="history" title={t('history.empty')} body={t('history.emptyBody')} />
      ) : (
        <Card padding={3}>
          {recent.map((r, i) => (
            <TransactionRow key={r.id} kind={r.kind} title={r.title} time={r.time} amountBdt={r.amountBdt} sample={r.sample} sampleLabel={t('common.sample')} divider={i < recent.length - 1} />
          ))}
        </Card>
      )}
      <Button label={t('card.history')} icon="history" variant="secondary" fullWidth onPress={() => router.push('/history')} />
    </Screen>
  );
}
