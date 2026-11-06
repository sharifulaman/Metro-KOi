export interface CoachCrowdBarProps {
  /** 0–100 per coach (6 coaches) */
  values: number[];
  showLegend?: boolean;
  /** translated legend labels */
  legend?: { low: string; mid: string; high: string };
  testID?: string;
}

export function crowdLevel(v: number): 'low' | 'mid' | 'high' {
  return v < 40 ? 'low' : v < 70 ? 'mid' : 'high';
}
