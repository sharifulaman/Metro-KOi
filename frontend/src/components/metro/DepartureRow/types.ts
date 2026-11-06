import type { Source } from '@/models';

export interface DepartureRowProps {
  etaSec: number;
  source: Source;
  trainId?: string;
  /** secondary line, already translated (e.g. "Arrive 8:42 · 18 min") */
  note?: string;
  /** trailing text, e.g. fare */
  trailing?: string;
  onPress?: () => void;
  divider?: boolean;
  testID?: string;
}
