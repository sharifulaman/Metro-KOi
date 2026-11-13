import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable } from 'react-native';

import { EmptyState, ScreenHeader, SummaryCard, TransactionRow } from '@/components/metro';
import { Card, Icon, Screen, SectionLabel, Segmented, Stack, Text } from '@/components/ui';
import { useHistoryView, type HistoryFilter } from '@/features/history/useHistoryView';
import { useT } from '@/i18n';
import { useHistory } from '@/store/history';

/** Trip history — local only (spec §10.10, board 11). */
export default function HistoryScreen() {
  const { t, lang } = useT();
  const router = useRouter();
  const [filter, setFilter] = useState<HistoryFilter>('all');
  const [confirmClear, setConfirmClear] = useState(false);
  const view = useHistoryView(filter, lang, t);
  const clear = useHistory((s) => s.clear);
  useEffect(() => useHistory.getState().seedSamplesIfEmpty(), []);
  return (
    <Screen scroll gap={4}>
      <ScreenHeader title={t('history.title')} onBack={() => router.back()} backLabel={t('common.back')} />
      <SummaryCard stats={[{ label: t('history.monthTrips'), value: view.summary.trips }, { label: t('history.monthSpend'), value: view.summary.spend }]} />
      <Segmented<HistoryFilter>
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: t('history.all') },
          { value: 'trip', label: t('history.trips') },
          { value: 'recharge', label: t('history.recharges') },
        ]}
      />
      {view.empty ? (
        <EmptyState icon="history" title={t('history.empty')} body={t('history.emptyBody')} />
      ) : (
        view.groups.map((g) => (
          <Card key={g.key} padding={3}>
            <SectionLabel text={g.label} />
            {g.rows.map((r, i) => (
              <TransactionRow key={r.id} kind={r.kind} title={r.title} time={r.time} amountBdt={r.amountBdt} sample={r.sample} sampleLabel={t('common.sample')} divider={i < g.rows.length - 1} />
            ))}
          </Card>
        ))
      )}
      <Stack direction="row" justify="between" align="center" gap={3}>
        <Stack direction="row" gap={2} align="center">
          <Icon name="lock" size={16} tone="muted" />
          <Text variant="label" tone="muted">
            {t('history.onlyPhone')}
          </Text>
        </Stack>
        {!view.empty ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              if (confirmClear) {
                clear();
                setConfirmClear(false);
              } else {
                setConfirmClear(true);
              }
            }}
            hitSlop={8}
            testID="history-clear"
          >
            <Text variant="label" weight={700} tone="danger">
              {confirmClear ? `${t('history.clear')}?` : t('history.clear')}
            </Text>
          </Pressable>
        ) : null}
      </Stack>
    </Screen>
  );
}
