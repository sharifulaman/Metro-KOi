export interface TransactionRowProps {
  kind: 'trip' | 'recharge';
  title: string;
  /** "আজ ০৮:১২" */
  time: string;
  /** signed, formatted ("−৳ ৪০" / "+৳ ৫০০") */
  amount: string;
  /** hairline under the row (not the last one) */
  divider?: boolean;
  testID?: string;
}
