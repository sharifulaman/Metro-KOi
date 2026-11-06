import type { IconName } from '../Icon/types';

export interface IconButtonProps {
  icon: IconName;
  onPress?: () => void;
  /** Adds the float shadow (map controls). */
  elevated?: boolean;
  /** Filled star etc. */
  active?: boolean;
  testID?: string;
  accessibilityLabel: string;
}
