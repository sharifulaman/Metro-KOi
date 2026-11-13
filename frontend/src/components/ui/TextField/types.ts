export interface TextFieldProps {
  /** small label shown above the field */
  label?: string;
  value: string;
  onChangeText(text: string): void;
  placeholder?: string;
  maxLength?: number;
  keyboardType?: 'default' | 'numeric';
  autoFocus?: boolean;
  testID?: string;
  accessibilityLabel?: string;
}
