import { useRouter } from 'expo-router';
import { useState } from 'react';

import { HistoryView } from '@/components/metro';
import { type HistoryFilter, useHistoryView } from '@/features/history/useHistoryView';
import { useT } from '@/i18n';
import { useHistory } from '@/store/history';

/** Trip history — local only (design ৮). Shows the design's sample trips until real ones exist. */
export default function HistoryScreen() {
  const { t, lang } = useT();
  const router = useRouter();
  const [filter, setFilter] = useState<HistoryFilter>('all');
  const [confirmClear, setConfirmClear] = useState(false);
  const view = useHistoryView(filter, lang, t);
  const clear = useHistory((s) => s.clear);
  return (
    <HistoryView
      title={t('history.title')}
      backLabel={t('common.back')}
      onBack={() => router.back()}
      tripsLabel={t('history.monthTrips')}
      trips={view.summary.trips}
      spendLabel={t('history.monthSpend')}
      spend={'৳ ' + view.summary.spendDigits}
      privacyNote={t('history.onlyPhone')}
      clearLabel={confirmClear ? t('history.clear') + '?' : t('history.clear')}
      canClear
      onClear={() => {
        if (confirmClear) {
          clear();
          setConfirmClear(false);
        } else {
          setConfirmClear(true);
        }
      }}
      tabs={[
        { value: 'all', label: t('history.all') },
        { value: 'trip', label: t('history.trips') },
        { value: 'recharge', label: t('history.recharges') },
      ]}
      filter={filter}
      onFilter={(v) => setFilter(v as HistoryFilter)}
      groups={view.groups}
      emptyTitle={t('history.empty')}
      emptyBody={t('history.emptyBody')}
    />
  );
}
