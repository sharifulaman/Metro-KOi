import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';

import { EmptyState, WalletHome } from '@/components/metro';
import { Screen } from '@/components/ui';
import { useHistoryView } from '@/features/history/useHistoryView';
import { useT } from '@/i18n';
import { fmtNum } from '@/lib/fmt';
import { useWallet } from '@/store/wallet';

/** Card tab home (design ১ · ৪ · ৯): saved cards, the focused one's balance, actions, recent trips. */
export default function CardScreen() {
  const { t, lang } = useT();
  const router = useRouter();
  const cards = useWallet((s) => s.cards);
  const defaultIndex = useMemo(() => Math.max(0, cards.findIndex((c) => c.isDefault)), [cards]);
  const [index, setIndex] = useState(defaultIndex);
  useEffect(() => setIndex((i) => (i < cards.length ? i : defaultIndex)), [cards.length, defaultIndex]);
  const focused = cards[index] ?? cards[0];
  const history = useHistoryView('all', lang, t);


  if (cards.length === 0 || !focused) {
    return (
      <Screen scroll withTabBar>
        <EmptyState icon="wallet" title={t('card.noCardsTitle')} body={t('card.noCardsBody')} action={{ label: t('card.addCard'), onPress: () => router.push('/card/add') }} />
      </Screen>
    );
  }

  const known = focused.balanceBdt != null;
  const lastTap = history.recent.find((r) => r.kind === 'trip');
  const caption = !known ? t('card.noBalanceBody') : lastTap ? t('card.lastTapRoute', { when: lastTap.when, route: lastTap.title }) : t('card.cardSource');

  return (
    <WalletHome
      title={t('card.title')}
      subtitle={t('card.subtitle')}
      addLabel={t('card.addCard')}
      savedLabel={t('card.savedLabel', { n: fmtNum(cards.length, lang) })}
      viewAllLabel={t('card.viewAll')}
      cards={cards.map((c) => ({ id: c.id, name: c.name, tail: c.tail, typeLabel: t(`card.${c.cardType}`), color: c.color }))}
      index={index}
      onIndexChange={setIndex}
      balance={{
        label: t('card.currentBalance'),
        badgeLabel: known ? t('card.readFromCard') : t('card.historyOnly'),
        badgeTone: known ? 'brand' : 'neutral',
        amount: known ? fmtNum((focused.balanceBdt as number).toLocaleString('en-US'), lang) : null,
        caption,
        noInfoTitle: t('card.noBalanceInfo'),
      }}
      scanLabel={t('card.scanCard')}
      historyLabel={t('card.history')}
      editLabel={t('card.edit')}
      recentLabel={t('card.recentTrips')}
      recent={history.recent}
      onAdd={() => router.push('/card/add')}
      onViewAll={() => router.push('/card/saved')}
      onScan={() => router.push('/card/scan')}
      onHistory={() => router.push('/history')}
      onEdit={() => router.push(`/card/manual?id=${focused.id}`)}
    />
  );
}
