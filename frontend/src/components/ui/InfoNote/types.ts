import type { IconName } from '../Icon/types';

export interface InfoNoteProps {
  text: string;
  icon?: IconName;
  tone?: 'neutral' | 'live' | 'danger' | 'brand';
  action?: { label: string; onPress(): void };
  testID?: string;
}
