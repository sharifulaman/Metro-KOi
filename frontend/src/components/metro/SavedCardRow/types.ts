import type { CardColor } from '@/theme/tokens';

export interface SavedCardRowProps {
  name: string;
  /** "•••• ৪৮২১" already formatted */
  tailText: string;
  typeLabel: string;
  tail: string;
  rapidPass?: boolean;
  color: CardColor;
  /** "৳ ৩৪০"; null → the "no balance info" badge */
  balance: string | null;
  isDefault: boolean;
  defaultLabel: string;
  noBalanceLabel: string;
  editLabel: string;
  deleteLabel: string;
  /** the first delete tap asks; this line replaces the balance until the second tap */
  confirmText?: string;
  confirming?: boolean;
  /** tap the card thumbnail: makes it the default */
  onPress?(): void;
  onEdit(): void;
  onDelete(): void;
  divider?: boolean;
  testID?: string;
}
