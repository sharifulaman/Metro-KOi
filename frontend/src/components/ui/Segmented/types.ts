import type { IconName } from '../Icon/types';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  /** small icon before the label (pill variant) */
  icon?: IconName;
}

export interface SegmentedProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange(v: T): void;
  /** tabs = chip row; pill = joined track */
  variant?: 'tabs' | 'pill';
  /** pill variant: the selected segment is white (default) or filled brand green */
  selectedTone?: 'surface' | 'brand';
  testID?: string;
}
