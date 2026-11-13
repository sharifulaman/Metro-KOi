import type { IconName } from '../../ui/Icon/types';

export interface InfoTileProps {
  icon: IconName;
  /** "Gates A B C D", "2", "220 m" */
  value: string;
  /** "4 entrances", "Platforms", "From you" */
  label: string;
  onPress?: () => void;
  testID?: string;
}
