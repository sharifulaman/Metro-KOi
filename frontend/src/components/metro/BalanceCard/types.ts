import type { BalanceSource } from '@/models';

export interface BalanceCardProps {
  balanceBdt: number | null;
  /** formatted, translated */
  lastTap?: string;
  cardTail?: string;
  source: BalanceSource;
  labels: { title: string; unavailable: string; source: string };
  testID?: string;
}
