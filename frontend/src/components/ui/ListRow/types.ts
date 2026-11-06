import type { ReactNode } from 'react';

export interface ListRowProps {
  title: string;
  subtitle?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  /** row 56 / rowLg 66 */
  height?: 'row' | 'rowLg';
  divider?: boolean;
  chevron?: boolean;
  highlighted?: boolean;
  onPress?: () => void;
  testID?: string;
  accessibilityLabel?: string;
}
