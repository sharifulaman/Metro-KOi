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
  /** 'card' when read from the MRT / Rapid Pass by NFC (hour precision) */
  source?: 'card' | 'manual';
}

export type CardType = 'rapid_pass' | 'mrt_pass';

/** Last successful NFC read, kept on the phone. */
export interface CardSnapshot {
  balanceBdt: number | null;
  /** when the phone read the card, ms epoch */
  readAt: number;
  /** newest transaction on the card, ms epoch (hour precision) */
  lastTapAt: number | null;
  /** last 4 hex digits of the card's IDm */
  cardTail: string;
  cardType: CardType;
  partial: boolean;
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
