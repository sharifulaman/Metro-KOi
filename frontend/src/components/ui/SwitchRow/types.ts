export interface SwitchRowProps {
  label: string;
  subtitle?: string;
  value: boolean;
  onValueChange(v: boolean): void;
  divider?: boolean;
  disabled?: boolean;
  testID?: string;
}
