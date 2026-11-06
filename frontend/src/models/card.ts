/** Trip history is stored only on the phone (spec §10.10). */
export type TransactionKind = 'trip' | 'recharge';

export interface Transaction {
  id: string;
  kind: TransactionKind;
  fromStationId?: string;
  toStationId?: string;
  /** ms epoch */
  at: number;
  amountBdt: number;
  /** true for demo rows — always labelled as samples in the UI. */
  sample: boolean;
}

export type BalanceSource = 'card' | 'local';

export interface CardBalance {
  balanceBdt: number | null;
  lastTapAt: number | null;
  cardTail: string | null;
  source: BalanceSource;
}

/** Result of the NFC feasibility gate (spec §18.4). */
export type NfcSupport = 'unknown' | 'unsupported' | 'history_only' | 'balance';
