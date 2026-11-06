import type { ConnectionState } from '@/models';

export interface ConnectionPillProps {
  state: ConnectionState;
  /** translated label for the state */
  label: string;
  testID?: string;
}
