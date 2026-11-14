export interface NearestBannerProps {
  /** nearest = green tint with the station and its next train; closed = grey "service has ended" */
  mode: 'nearest' | 'closed';
  /** small caption, e.g. "Your nearest station" */
  caption: string;
  /** station name, or "Today's service has ended" */
  title: string;
  /** "220 m · 3 min walk", or "Next first train 6:30 · by the timetable" */
  subtitle?: string;
  /** right side: "4 min" + a live/estimated badge (nearest only) */
  eta?: { label: string; live: boolean; /** translated "Live" / "Estimated" */ badge: string };
  onPress?: () => void;
  testID?: string;
}
