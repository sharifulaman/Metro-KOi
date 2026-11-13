export interface BrandBarProps {
  /** "Metro" + brand-coloured "KOI" */
  title: string;
  accent: string;
  /** second line, e.g. the Bangla name */
  subtitle?: string;
  /** language toggle on the right, e.g. "বাং · EN" */
  langLabel: string;
  onLangPress?: () => void;
  langAccessibilityLabel?: string;
  testID?: string;
}
