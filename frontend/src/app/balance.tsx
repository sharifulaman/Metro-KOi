import { useRouter } from 'expo-router';

import { BalanceCard, EmptyState, ScreenHeader, TransactionRow } from '@/components/metro';
import { Button, Card, Screen, SectionLabel } from '@/components/ui';
import { useHistoryView } from '@/features/history/useHistoryView';
import { useT } from '@/i18n';
import { fmtClock, secOfDayFromMs } from '@/lib/fmt';

/** Balance (spec §10.10, board 10). NFC balance is feasibility-gated, so source = local. */
export default function BalanceScreen() {
  const { t, lang } = useT();
  const router = useRouter();
  const view = useHistoryView('all', lang, t);
  const recent = view.groups.flatMap((g) => g.rows).slice(0, 5);
  return (
    <Screen scroll gap={4}>
      <ScreenHeader title={t('card.balance')} onBack={() => router.back()} backLabel={t('common.back')} />
      <BalanceCard
        balanceBdt={null}
        source="local"
        lastTap={view.last ? t('card.lastTap', { time: fmtClock(secOfDayFromMs(view.last.at), lang) }) : undefined}
        labels={{ title: t('card.balance'), unavailable: t('card.noBalance'), source: t('card.localSource') }}
      />
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
