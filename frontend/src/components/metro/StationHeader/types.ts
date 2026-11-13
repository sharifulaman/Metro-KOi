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
  /** step to the neighbouring station (live sheet); both are needed to show the arrows */
  onPrev?: () => void;
  onNext?: () => void;
  prevLabel?: string;
  nextLabel?: string;
  /** tapping the name opens the station */
  onPress?: () => void;
  compact?: boolean;
  testID?: string;
}
