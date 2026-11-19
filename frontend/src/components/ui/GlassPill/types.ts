import type { IconName } from '../Icon/types';

export interface GlassPillProps {
  label: string;
  /** coloured dot before the text: amber = live, dashed grey = estimated */
  dot?: 'live' | 'estimated';
  icon?: IconName;
  /** 32px (default) or the smaller 28px badge */
  size?: 'md' | 'sm';
  /** toggle look: filled brand colour (a filter that is on) */
  active?: boolean;
  onPress?: () => void;
  testID?: string;
  accessibilityLabel?: string;
}
