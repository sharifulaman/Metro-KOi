import type { IconName } from '../Icon/types';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'dangerText';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  /** lg = 52, md = 44 */
  size?: 'lg' | 'md';
  /** exact height in px (overrides `size`; the design's Add-card sheet uses 48) */
  height?: number;
  icon?: IconName;
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  /** Floating action style (elevated, pill). */
  floating?: boolean;
  testID?: string;
  accessibilityLabel?: string;
}
