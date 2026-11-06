import type { Direction, Source } from '@/models';

export interface NextTrainRowProps {
  direction: Direction;
  /** "To Motijheel", already translated */
  title: string;
  /** "Platform 1" */
  subtitle?: string;
  /** formatted ETA ("2 min", "~9 min", "6:30 AM"); undefined = no train */
  eta?: string;
  source?: Source;
  /** shown instead of the ETA when there is no train */
  emptyText?: string;
  onPress?: () => void;
  divider?: boolean;
  testID?: string;
}
