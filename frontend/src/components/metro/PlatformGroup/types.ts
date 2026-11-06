import type { Direction, Platform } from '@/models';

import type { DepartureRowProps } from '../DepartureRow/types';

export interface PlatformGroupProps {
  platform: Platform;
  direction: Direction;
  /** "Platform 1 → Motijheel", already translated */
  title: string;
  rows: (DepartureRowProps & { key: string })[];
  /** shown when there are no rows */
  emptyText?: string;
  testID?: string;
}
