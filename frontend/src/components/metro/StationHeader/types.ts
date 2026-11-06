export interface StationHeaderProps {
  /** name in the current language (primary) */
  name: string;
  /** name in the other language (secondary) */
  altName: string;
  /** e.g. "Station 11 of 16" (already translated) */
  orderLabel?: string;
  /** e.g. "220 m away" (already translated) */
  distance?: string;
  /** "MRT Line 6" chip label */
  lineChip?: string;
  favourite?: boolean;
  onFavourite?: () => void;
  favouriteLabel?: string;
  onBack?: () => void;
  compact?: boolean;
  testID?: string;
}
