export interface ScanViewProps {
  title: string;
  closeLabel: string;
  onClose(): void;
  heading: string;
  hint: string;
  /** replaces the hint when a scan failed */
  error?: string;
  retryLabel: string;
  onRetry(): void;
  androidHint: string;
  iosHint: string;
  cancelLabel: string;
  /** the card shown tilting into the phone */
  card: { name: string; tail: string; typeLabel: string };
  testID?: string;
}
