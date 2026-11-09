import type { Direction } from '@/models';

export interface TimelineStop {
  key: string;
  label: string;
  /** right-hand text: "2 min", "7:18 AM" */
  right?: string;
  /** small muted text under the right-hand text, e.g. "Passed" */
  rightSub?: string;
  state: 'passed' | 'upcoming';
  /** chip after the name, e.g. "Your station" */
  tag?: string;
}

export interface TrainTimelineProps {
  stops: TimelineStop[];
  direction: Direction;
  /** "SB-0710 is here" row, drawn after `stops[afterIndex]` (-1 = before the first stop) */
  marker?: { afterIndex: number; label: string; right?: string };
  testID?: string;
}
