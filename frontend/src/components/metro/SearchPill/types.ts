export interface SearchPillProps {
  /** placeholder text, already translated */
  placeholder: string;
  onPress?: () => void;
  /** language toggle inside the pill, e.g. "বাং · EN" */
  langLabel?: string;
  onLangPress?: () => void;
  langAccessibilityLabel?: string;
  testID?: string;
}
