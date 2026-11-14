import type { ReactNode } from 'react';

import type { TextVariant } from '@/theme/tokens';

export type TextTone = 'ink' | 'muted' | 'brand' | 'danger' | 'inverse' | 'onBrand' | 'live' | 'estimated';

export interface TextProps {
  variant?: TextVariant;
  tone?: TextTone;
  /** Tabular figures for times, fares and counts. */
  numeric?: boolean;
  weight?: 400 | 500 | 600 | 700;
  /** exact px size (pixel-accurate screens); overrides the variant's size */
  size?: number;
  /** line-height as a multiple of `size` (e.g. 1.35); default follows the variant / Bangla factor */
  lh?: number;
  /** explicit colour from a token (overrides tone) */
  color?: string;
  /** letter-spacing in px */
  tracking?: number;
  align?: 'left' | 'center' | 'right';
  numberOfLines?: number;
  children: ReactNode;
  testID?: string;
  accessibilityLabel?: string;
}
