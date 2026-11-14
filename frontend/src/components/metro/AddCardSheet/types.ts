export interface AddCardSheetProps {
  title: string;
  subtitle: string;
  scanTitle: string;
  scanBadge: string;
  scanBody: string;
  manualTitle: string;
  manualBody: string;
  cancelLabel: string;
  onScan(): void;
  onManual(): void;
  onCancel(): void;
  testID?: string;
}
