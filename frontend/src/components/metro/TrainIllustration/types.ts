import type { Direction } from '@/models';

export interface TrainIllustrationProps {
  cars?: number;
  direction?: Direction;
  /** 0–100 per coach, tints each window strip */
  crowd?: number[];
  /** rendered width in px (height follows) */
  width?: number;
  testID?: string;
}
