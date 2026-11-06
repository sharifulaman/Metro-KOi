import type { IconName } from '../../ui/Icon/types';

export interface EmptyStateProps {
  icon: IconName;
  title: string;
  body?: string;
  action?: { label: string; onPress(): void };
  compact?: boolean;
  testID?: string;
}
