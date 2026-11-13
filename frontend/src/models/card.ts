import type { CardColor } from '@/theme/tokens';

export type { CardColor } from '@/theme/tokens';

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
  /** full IDm hex, used only to recognise the same physical card on a later scan */
  idmHex: string;
}

/**
 * A card the rider has saved to this phone's wallet (spec: Card section redesign).
 * Only a name, a colour and the last 4 digits are kept — never a full card number.
 */
export interface SavedCard {
  id: string;
  name: string;
  color: CardColor;
  /** last 4 digits shown to the rider */
  tail: string;
  cardType: CardType;
  /** how it was added: tapped to the phone, or typed in by hand */
  source: 'scan' | 'manual';
  /** full IDm hex of a scanned card, to recognise it again; absent for a manual card */
  idmHex?: string;
  /** null until a scan reads it, or for a manual-only card */
  balanceBdt: number | null;
  /** newest transaction on the card at the last scan, ms epoch; null if never scanned */
  lastTapAt: number | null;
  /** when this record was last created or refreshed, ms epoch */
  updatedAt: number;
  isDefault: boolean;
  /** true for a placeholder card shown before the rider has saved a real one — always labelled as a sample in the UI. */
  sample?: boolean;
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
