import type { CardColor } from '@/theme/tokens';

export interface SavedCardRowProps {
  name: string;
  tail: string;
  typeLabel: string;
  color: CardColor;
  balanceBdt: number | null;
  isDefault: boolean;
  defaultLabel: string;
  noBalanceLabel: string;
  editLabel: string;
  deleteLabel: string;
  /** tap the card itself: makes it the default */
  onPress?(): void;
  onEdit(): void;
  onDelete(): void;
  /** placeholder card: show `sampleLabel` */
  sample?: boolean;
  sampleLabel?: string;
  divider?: boolean;
  testID?: string;
}
