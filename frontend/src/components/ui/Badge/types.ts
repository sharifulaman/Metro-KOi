import type { IconName } from '../Icon/types';

export type BadgeTone = 'brand' | 'neutral' | 'live' | 'danger';

export interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  /** small leading icon */
  icon?: IconName;
  /** leading dot: filled (live) or dashed ring (estimated) */
  dot?: 'live' | 'estimated';
  testID?: string;
}
