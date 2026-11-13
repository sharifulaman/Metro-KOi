import type { Source } from '@/models';

export interface JourneyOptionCardProps {
  /** departure clock time, e.g. "২:০৩" */
  depart: string;
  /** arrival clock time */
  arrive: string;
  /** "Leaves · in 2 min" */
  waitText: string;
  /** "Arrives" (best) or "→ 2:15 arrive" (compact), already translated */
  arriveText: string;
  source: Source;
  /** highlighted first option with the full timeline */
  best?: boolean;
  /** chip on the best card, e.g. "Fastest" */
  bestLabel?: string;
  /** "Platform 1 · Train T-17" */
  footerLeft?: string;
  /** fare text */
  footerRight?: string;
  onPress?: () => void;
  testID?: string;
}
