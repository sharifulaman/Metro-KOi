export type TabKey = 'live' | 'stations' | 'journey' | 'card' | 'more';
export const TAB_KEYS: TabKey[] = ['live', 'stations', 'journey', 'card', 'more'];

export interface TabBarProps {
  active: TabKey;
  onSelect(key: TabKey): void;
  /** translated labels */
  labels: Record<TabKey, string>;
  bottomInset?: number;
  testID?: string;
}
