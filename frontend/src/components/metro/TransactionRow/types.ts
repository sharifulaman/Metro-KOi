import type { TransactionKind } from '@/models';

export interface TransactionRowProps {
  kind: TransactionKind;
  /** "Mirpur-10 → Farmgate" or "Recharge" (translated) */
  title: string;
  /** formatted time */
  time: string;
  amountBdt: number;
  sample?: boolean;
  sampleLabel?: string;
  divider?: boolean;
  testID?: string;
}
