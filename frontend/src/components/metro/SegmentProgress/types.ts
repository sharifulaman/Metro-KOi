import type { Direction } from '@/models';

export interface SegmentProgressProps {
  /** station the train last left (or is standing at) */
  fromLabel: string;
  /** station it is heading to */
  toLabel: string;
  /** 0..1 between them */
  progress: number;
  direction: Direction;
  /** "Arrives in 2 min", already translated */
  caption?: string;
  testID?: string;
}
