export interface RideBannerProps {
  /** "Sharing • Mirpur-10 → Kazipara" (translated) */
  title: string;
  /** "helping 12 riders" (translated) */
  subtitle: string;
  onStop(): void;
  stopLabel: string;
  onPress?: () => void;
  testID?: string;
}
