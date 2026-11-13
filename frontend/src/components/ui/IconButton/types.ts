import type { IconName } from '../Icon/types';

export interface IconButtonProps {
  icon: IconName;
  /** short text shown instead of the icon, e.g. "3D" */
  label?: string;
  onPress?: () => void;
  /** Adds the float shadow (map controls). */
  elevated?: boolean;
  /** Filled star etc. */
  active?: boolean;
  /** 46 (default) or the 44px map control */
  size?: 'md' | 'sm';
  testID?: string;
  accessibilityLabel: string;
}
