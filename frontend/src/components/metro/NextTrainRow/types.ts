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
  /**
   * The train is standing here: its departure countdown replaces the ETA and
   * the badge reads "At the station".
   */
  dwell?: {
    /** "0:14" */
    countdown: string;
    /** "Time to leave" */
    caption: string;
  };
  /** shown instead of the ETA when there is no train */
  emptyText?: string;
  onPress?: () => void;
  divider?: boolean;
  testID?: string;
}
