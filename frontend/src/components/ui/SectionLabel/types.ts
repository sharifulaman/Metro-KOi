import type { ReactNode } from 'react';

export interface SectionLabelProps {
  text: string;
  /** token colour for the leading dot */
  colorDot?: string;
  right?: ReactNode;
  testID?: string;
}
