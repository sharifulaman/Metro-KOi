import type { ReactNode } from 'react';

import type { TextVariant } from '@/theme/tokens';

export type TextTone = 'ink' | 'muted' | 'brand' | 'danger' | 'inverse' | 'onBrand' | 'live' | 'estimated';

export interface TextProps {
  variant?: TextVariant;
  tone?: TextTone;
  /** Tabular figures for times, fares and counts. */
  numeric?: boolean;
  weight?: 400 | 500 | 600 | 700;
  align?: 'left' | 'center' | 'right';
  numberOfLines?: number;
  children: ReactNode;
  testID?: string;
  accessibilityLabel?: string;
}
