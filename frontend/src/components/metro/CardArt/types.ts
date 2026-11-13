import type { CardColor } from '@/theme/tokens';

export interface CardArtProps {
  /** label the rider gave the card ("My metro card") */
  name: string;
  /** last 4 digits only */
  tail: string;
  /** translated card-type chip, e.g. "Rapid Pass" */
  typeLabel: string;
  color: CardColor;
  /** 'hero' = full card with name/tail; 'row' = small thumbnail for a list row, art only */
  size?: 'hero' | 'row';
  /** card width in px; height follows the card's aspect ratio. Defaults: hero 310, row 104 */
  width?: number;
  testID?: string;
}
