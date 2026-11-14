import type { CardColor } from '@/theme/tokens';

export interface SavedCardsViewCard {
  id: string;
  name: string;
  tail: string;
  tailText: string;
  typeLabel: string;
  color: CardColor;
  balance: string | null;
  isDefault: boolean;
  confirming: boolean;
}

export interface SavedCardsViewProps {
  title: string;
  backLabel: string;
  addLabel: string;
  cards: SavedCardsViewCard[];
  defaultLabel: string;
  noBalanceLabel: string;
  editLabel: string;
  deleteLabel: string;
  confirmText: string;
  note: string;
  newCardLabel: string;
  onBack(): void;
  onAdd(): void;
  onEdit(id: string): void;
  onDelete(id: string): void;
  onSetDefault(id: string): void;
  testID?: string;
}
