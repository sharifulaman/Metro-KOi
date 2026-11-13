export interface SearchPillProps {
  /** placeholder text, already translated */
  placeholder: string;
  onPress?: () => void;
  /** language toggle inside the pill, e.g. "বাং · EN" */
  langLabel?: string;
  onLangPress?: () => void;
  langAccessibilityLabel?: string;
  /** small legend on the right: an amber dot + "Live", a dashed dot + "Estimated" */
  legend?: { live: string; estimated: string };
  /** outlined (stations list) instead of floating (map) */
  outlined?: boolean;
  testID?: string;
}
