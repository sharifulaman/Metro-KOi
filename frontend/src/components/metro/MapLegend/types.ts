export type LegendKind = 'live' | 'dwell' | 'estimated';

export interface MapLegendProps {
  items: { kind: LegendKind; label: string }[];
  testID?: string;
}
