import type { IconName } from '../Icon/types';

export interface IconTileProps {
  icon: IconName;
  tone?: 'brand' | 'live' | 'neutral' | 'danger';
  /** Text instead of an icon (e.g. gate letter). */
  letter?: string;
  testID?: string;
}
