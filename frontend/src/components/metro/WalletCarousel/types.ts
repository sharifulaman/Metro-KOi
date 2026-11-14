import type { CardColor } from '@/theme/tokens';

export interface WalletCarouselCard {
  id: string;
  name: string;
  tail: string;
  typeLabel: string;
  color: CardColor;
}

export interface WalletCarouselProps {
  cards: WalletCarouselCard[];
  /** index of the card currently centred; the caller drives the balance panel from it */
  index: number;
  onIndexChange(index: number): void;
  onPressCard?(id: string): void;
  /** hide the pager dots (the home draws them after the balance panel) */
  hideDots?: boolean;
  testID?: string;
}
