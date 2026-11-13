import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable } from 'react-native';

import { BalancePanel, EmptyState, TransactionRow, WalletCarousel } from '@/components/metro';
import { Button, Card, Chip, IconButton, InfoNote, Screen, Stack, Text } from '@/components/ui';
import { openNfcSettings } from '@/features/card/nfcReader';
import { useNfcStatus } from '@/features/card/useNfcSupport';
import { useHistoryView } from '@/features/history/useHistoryView';
import { useT } from '@/i18n';
import { fmtClock, secOfDayFromMs } from '@/lib/fmt';
import { useHistory } from '@/store/history';
import { useWallet } from '@/store/wallet';

/** Card tab home (design ১): saved cards, the focused one's balance, actions, recent trips. */
export default function CardScreen() {
  const { t, lang } = useT();
  const router = useRouter();
  const nfc = useNfcStatus();
  const cards = useWallet((s) => s.cards);
  const defaultIndex = useMemo(() => Math.max(0, cards.findIndex((c) => c.isDefault)), [cards]);
  const [index, setIndex] = useState(defaultIndex);
  useEffect(() => setIndex((i) => (i < cards.length ? i : defaultIndex)), [cards.length, defaultIndex]);
  const focused = cards[index] ?? cards[0];
  const history = useHistoryView('all', lang, t);
  const recent = history.groups.flatMap((g) => g.rows.map((r) => ({ ...r, day: g.label }))).slice(0, 3);

  // until the rider saves a real card, show the sample ones from the design (always labelled)
  useEffect(() => {
    useWallet.getState().seedSamplesIfEmpty({ card: t('card.defaultCardName'), office: t('card.sampleOffice'), dad: t('card.sampleDad') });
    useHistory.getState().seedSamplesIfEmpty();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Screen scroll gap={4} withTabBar>
      <Stack direction="row" justify="between" align="start" gap={3}>
        <Stack flex gap={1}>
          <Text variant="display">{t('card.title')}</Text>
          <Text tone="muted">{t('card.subtitle')}</Text>
        </Stack>
        <IconButton icon="add" onPress={() => router.push('/card/add')} accessibilityLabel={t('card.addCard')} />
      </Stack>

      {cards.length === 0 ? (
        <EmptyState icon="wallet" title={t('card.noCardsTitle')} body={t('card.noCardsBody')} action={{ label: t('card.addCard'), onPress: () => router.push('/card/add') }} />
      ) : (
        <>
          <Stack direction="row" justify="between" align="center">
            <Text variant="label" weight={700} tone="muted">
              {t('card.savedCount', { count: cards.length })}
            </Text>
            <Pressable accessibilityRole="button" onPress={() => router.push('/card/saved')} hitSlop={8}>
              <Text variant="label" weight={700} tone="brand">
                {t('card.viewAll')}
              </Text>
            </Pressable>
          </Stack>

          <WalletCarousel
            cards={cards.map((c) => ({ id: c.id, name: c.name, tail: c.tail, typeLabel: t(`card.${c.cardType}`), color: c.color }))}
            index={index}
            onIndexChange={setIndex}
          />

          {focused ? (
            <Stack gap={2}>
              <BalancePanel
                label={t('card.currentBalance')}
                badgeLabel={focused.balanceBdt != null ? t('card.readFromCard') : t('card.historyOnly')}
                badgeTone={focused.balanceBdt != null ? 'brand' : 'neutral'}
                balanceBdt={focused.balanceBdt}
                caption={
                  focused.balanceBdt != null && focused.lastTapAt != null
                    ? t('card.lastTapShort', { time: fmtClock(secOfDayFromMs(focused.lastTapAt), lang) })
                    : focused.balanceBdt != null
                      ? t('card.cardSource')
                      : t('card.noBalanceBody')
                }
                noInfoLabel={t('card.noBalanceInfo')}
              />
              {focused.sample ? <Chip label={t('common.sample')} tone="neutral" icon="info" /> : null}
            </Stack>
          ) : null}

          {nfc.availability === 'ready' ? (
            <Button label={t('card.scanCard')} icon="nfc" fullWidth onPress={() => router.push('/card/scan')} />
          ) : nfc.availability === 'no_module' ? (
            <InfoNote icon="info" text={t('card.needsBuild')} />
          ) : nfc.availability === 'disabled' ? (
            <InfoNote icon="nfc" tone="live" text={`${t('card.nfcOff')}. ${t('card.nfcOffBody')}`} action={{ label: t('card.openSettings'), onPress: openNfcSettings }} />
          ) : null}

          <Stack direction="row" gap={3} equal>
            <Button label={t('card.history')} icon="clock" variant="secondary" size="md" fullWidth onPress={() => router.push('/history')} />
            {focused ? <Button label={t('card.edit')} icon="edit" variant="secondary" size="md" fullWidth onPress={() => router.push(`/card/manual?id=${focused.id}`)} /> : null}
          </Stack>

          {recent.length > 0 ? (
            <Stack gap={2}>
              <Text variant="label" weight={700} tone="muted">
                {t('card.recentTrips')}
              </Text>
              <Card padding={3}>
                {recent.map((r, i) => (
                  <TransactionRow key={r.id} kind={r.kind} title={r.title} time={`${r.day} ${r.time}`} amountBdt={r.amountBdt} sample={r.sample} sampleLabel={t('common.sample')} divider={i < recent.length - 1} />
                ))}
              </Card>
            </Stack>
          ) : null}
        </>
      )}
    </Screen>
  );
}
