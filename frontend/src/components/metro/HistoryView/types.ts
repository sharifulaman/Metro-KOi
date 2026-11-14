export interface HistoryViewRow {
  id: string;
  kind: 'trip' | 'recharge';
  title: string;
  /** "০৮:১২" */
  time: string;
  /** "−৳ ৪০" */
  amount: string;
}

export interface HistoryViewGroup {
  key: string;
  label: string;
  rows: HistoryViewRow[];
}

export interface HistoryViewProps {
  title: string;
  backLabel: string;
  onBack(): void;
  tripsLabel: string;
  trips: string;
  spendLabel: string;
  spend: string;
  privacyNote: string;
  clearLabel: string;
  /** hide the clear link when there is nothing to clear */
  canClear: boolean;
  onClear(): void;
  tabs: { value: string; label: string }[];
  filter: string;
  onFilter(value: string): void;
  groups: HistoryViewGroup[];
  emptyTitle: string;
  emptyBody: string;
  testID?: string;
}
