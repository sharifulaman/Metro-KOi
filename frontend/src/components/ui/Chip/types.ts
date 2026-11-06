import type { IconName } from '../Icon/types';

export type ChipTone = 'brand' | 'neutral' | 'live' | 'ink';

export interface ChipProps {
  label: string;
  tone?: ChipTone;
  selected?: boolean;
  /** Small coloured dot before the label (token colour). */
  dot?: string;
  icon?: IconName;
  onPress?: () => void;
  elevated?: boolean;
  testID?: string;
  accessibilityLabel?: string;
}
