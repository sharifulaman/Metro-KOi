export interface SummaryStat {
  label: string;
  /** formatted value */
  value: string;
}

export interface SummaryCardProps {
  title?: string;
  stats: [SummaryStat, SummaryStat];
  testID?: string;
}
