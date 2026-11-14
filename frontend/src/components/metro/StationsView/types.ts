import type { NearestBannerProps } from '../NearestBanner/types';
import type { StationTimelineProps } from '../StationTimeline/types';

export interface StationsViewProps {
  title: string;
  subtitle: string;
  timetableLabel: string;
  onTimetable(): void;
  dirs: { key: string; label: string }[];
  dir: string;
  onDir(key: string): void;
  searchPlaceholder: string;
  legendLive: string;
  legendEstimated: string;
  /** omit to hide the banner */
  banner?: Pick<NearestBannerProps, 'mode' | 'caption' | 'title' | 'subtitle' | 'eta' | 'onPress'>;
  timeline: Pick<StationTimelineProps, 'stations' | 'train' | 'labels'>;
  footnote?: string;
  testID?: string;
}
