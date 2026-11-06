import type { CrowdLevels, Platform, Source, TrainEta } from '@/models';

export interface TrainCardProps {
  platform: Platform;
  /** "Platform 1 → Motijheel" already translated */
  title: string;
  eta?: TrainEta;
  source: Source;
  trainId?: string;
  /** e.g. "Shared by 3 riders" */
  detail?: string;
  /** 0–100 per coach; omit when unknown (spec §19.6: hide unless data exists) */
  crowd?: CrowdLevels;
  emptiestCoach?: number;
  labels?: { atStation: string; departed: string; emptiest?: string; legend?: { low: string; mid: string; high: string } };
  compact?: boolean;
  onPress?: () => void;
  testID?: string;
}
