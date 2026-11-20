export interface RideBannerProps {
  /** "Sharing • Mirpur-10 → Kazipara" (translated) */
  title: string;
  /** "helping 12 riders" (translated) */
  subtitle: string;
  onStop(): void;
  stopLabel: string;
  onPress?: () => void;
  /** true (default) = position is being shared: green banner; false = checking / offline: ash-grey banner */
  live?: boolean;
  testID?: string;
}
