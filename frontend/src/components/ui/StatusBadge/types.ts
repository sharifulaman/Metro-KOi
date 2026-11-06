export type StatusKind = 'live' | 'estimated' | 'delayed';

export interface StatusBadgeProps {
  kind: StatusKind;
  /** Override the default translated label. */
  label?: string;
  testID?: string;
}
