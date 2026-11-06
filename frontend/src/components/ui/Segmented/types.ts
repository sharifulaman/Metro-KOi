export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange(v: T): void;
  /** tabs = chip row; pill = joined track */
  variant?: 'tabs' | 'pill';
  testID?: string;
}
