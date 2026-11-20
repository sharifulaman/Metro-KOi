import type { CardColor } from '@/theme/tokens';

export interface FoundViewProps {
  title: string;
  card: { name: string; tail: string; typeLabel: string; rapidPass?: boolean };
  color: CardColor;
  balanceLabel: string;
  /** digits only ("৩৪০"); null → no balance could be read */
  amount: string | null;
  noInfoTitle: string;
  badgeLabel: string;
  badgeTone: 'brand' | 'neutral';
  nameLabel: string;
  name: string;
  onName(v: string): void;
  colorLabel: string;
  onColor(c: CardColor): void;
  colorLabels: Record<CardColor, string>;
  saveLabel: string;
  onSave(): void;
  rescanLabel: string;
  onRescan(): void;
  testID?: string;
}
