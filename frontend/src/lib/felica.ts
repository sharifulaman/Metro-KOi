// MRT Pass / Rapid Pass (Sony FeliCa) card decoder — see NFC_CARD_READING.md.
// Pure functions, no React or native imports, so it runs in `node --test`.
// Read-only: the history lives unencrypted in service 0x220F, blocks 0–19.

export const SERVICE_CODE_LE = [0x0f, 0x22] as const; // 0x220F, little-endian
export const BLOCK_COUNT = 20;
export const WINDOW = 10;
export const DHAKA_OFFSET_MS = 6 * 3600 * 1000;
/** Blocks dated on or before this are empty/garbage. */
const MIN_VALID_MS = Date.UTC(2020, 0, 1) - DHAKA_OFFSET_MS;

export type CardTxKind = 'trip' | 'recharge' | 'bus' | 'unknown';
export type CardType = 'rapid_pass' | 'mrt_pass';

export interface CardTx {
  kind: CardTxKind;
  /** fixed header, bytes 0–3 as hex ("08521000") */
  header: string;
  /** ms epoch, hour precision (the card stores no minutes), Asia/Dhaka */
  at: number;
  fromCode: number;
  toCode: number;
  /** balance after this transaction, BDT */
  balance: number;
  /** balance change vs the previous (older) transaction; null for the oldest */
  amount: number | null;
}

export interface FelicaReadResult {
  status1: number;
  status2: number;
  blocks: number[][];
}

export interface CardRead {
  idm: number[];
  cardType: CardType;
  /** newest first */
  transactions: CardTx[];
  balance: number | null;
  /** true when the card left the field before all 20 blocks were read */
  partial: boolean;
}

// ---------- bytes ----------

export function hexToBytes(hex: string): number[] {
  const clean = hex.replace(/[^0-9a-f]/gi, '');
  const out: number[] = [];
  for (let i = 0; i + 1 < clean.length; i += 2) out.push(parseInt(clean.slice(i, i + 2), 16));
  return out;
}

export function bytesToHex(bytes: ArrayLike<number>): string {
  return Array.from(bytes, (b) => (b & 0xff).toString(16).padStart(2, '0')).join('').toUpperCase();
}

// ---------- encode: Read Without Encryption (0x06) ----------

/** Full command frame including the leading length byte (Android NfcF.transceive). */
export function buildReadCommand(idm: number[], startBlock: number, n = WINDOW): number[] {
  if (idm.length !== 8) throw new Error(`IDm must be 8 bytes, got ${idm.length}`);
  const blockList = Array.from({ length: n }, (_, i) => [0x80, startBlock + i]).flat();
  const len = 14 + blockList.length;
  return [len, 0x06, ...idm, 0x01, SERVICE_CODE_LE[0], SERVICE_CODE_LE[1], n, ...blockList];
}

// ---------- decode: response frame ----------

/**
 * Response frame with its length byte: [len, 0x07, IDm×8, sf1, sf2, N, N×16].
 * Returns null for a malformed/short frame. Status flags are returned as-is;
 * callers drop the window when either is non-zero.
 */
export function decodeFrame(frame: ArrayLike<number>): FelicaReadResult | null {
  const f = Array.from(frame);
  if (f.length < 13 || f[1] !== 0x07) return null;
  const status1 = f[10];
  const status2 = f[11];
  if (status1 !== 0 || status2 !== 0) return { status1, status2, blocks: [] };
  const n = f[12];
  if (f.length < 13 + n * 16) return null;
  const blocks = Array.from({ length: n }, (_, i) => f.slice(13 + i * 16, 13 + (i + 1) * 16));
  return { status1, status2, blocks };
}

// ---------- decode: one 16-byte transaction block ----------

export function kindOf(header: string): CardTxKind {
  switch (header) {
    case '08521000':
      return 'trip';
    case '1D600201':
    case '42600200':
      return 'recharge';
    case '08D22000':
    case '42D63000':
      return 'bus';
    default:
      return 'unknown';
  }
}

/** 24-bit big-endian at bytes 4–6 → ms epoch (Asia/Dhaka, hour precision). */
export function decodeTimestamp(b: ArrayLike<number>, baseYear: number): number {
  const v = (b[4] << 16) | (b[5] << 8) | b[6];
  const hour = (v >> 3) & 0x1f;
  let day = (v >> 8) & 0x1f;
  let month = (v >> 13) & 0x0f;
  const year = baseYear + ((v >> 17) & 0x1f);
  if (day < 1 || day > 31) day = 1;
  if (month < 1 || month > 12) month = 1;
  return Date.UTC(year, month - 1, day, Math.min(hour, 23)) - DHAKA_OFFSET_MS;
}

/** One block → transaction, or null when it is empty (dated before 2020). */
export function parseBlock(b: ArrayLike<number>, baseYear: number): CardTx | null {
  if (b.length < 16) return null;
  const at = decodeTimestamp(b, baseYear);
  if (!(at > MIN_VALID_MS)) return null;
  const header = bytesToHex([b[0], b[1], b[2], b[3]]);
  return {
    kind: kindOf(header),
    header,
    at,
    fromCode: b[8],
    toCode: b[10],
    balance: b[11] | (b[12] << 8) | (b[13] << 16),
    amount: null,
  };
}

/** Fare/recharge = difference of consecutive balances (list is newest first). */
export function withAmounts(txs: CardTx[]): CardTx[] {
  return txs.map((tx, i) => ({ ...tx, amount: i + 1 < txs.length ? tx.balance - txs[i + 1].balance : null }));
}

export function cardTypeOf(idm: ArrayLike<number>): CardType {
  return idm[0] === 0x01 && idm[1] === 0x27 ? 'rapid_pass' : 'mrt_pass';
}

// ---------- station codes ----------

const STATION_CODES: Record<number, string> = {
  10: 'motijheel',
  20: 'bangladesh-secretariat',
  25: 'dhaka-university',
  30: 'shahbagh',
  35: 'karwan-bazar',
  40: 'farmgate',
  45: 'bijoy-sarani',
  50: 'agargaon',
  55: 'shewrapara',
  60: 'kazipara',
  65: 'mirpur-10',
  70: 'mirpur-11',
  75: 'pallabi',
  80: 'uttara-south',
  85: 'uttara-center',
  90: 'uttara-north',
};

/** Card station code → stations.json id; undefined for unknown codes (e.g. Kamalapur). */
export function stationIdForCode(code: number): string | undefined {
  return STATION_CODES[code];
}

// ---------- full read ----------

/** Sends a full command frame (with length byte) and returns the full response frame. */
export type Transceive = (command: number[]) => Promise<number[]>;

/**
 * Read blocks 0–19 in two windows of 10. A window with bad status flags is
 * skipped; if the card leaves the field mid-read, what was read is kept and
 * `partial` is set. Throws only when nothing at all could be read.
 */
export async function readCard(transceive: Transceive, idm: number[], baseYear = 2000): Promise<CardRead> {
  const txs: CardTx[] = [];
  let partial = false;
  let anyWindow = false;
  let lastError: unknown = null;
  for (let start = 0; start < BLOCK_COUNT; start += WINDOW) {
    try {
      const res = decodeFrame(await transceive(buildReadCommand(idm, start, WINDOW)));
      if (!res || res.status1 !== 0 || res.status2 !== 0) {
        partial = true;
        continue;
      }
      anyWindow = true;
      for (const b of res.blocks) {
        const tx = parseBlock(b, baseYear);
        if (tx) txs.push(tx);
      }
    } catch (e) {
      lastError = e;
      partial = true;
      break; // tag lost: keep what we have
    }
  }
  if (!anyWindow) throw lastError ?? new Error('card read failed');
  const transactions = withAmounts(txs);
  return { idm, cardType: cardTypeOf(idm), transactions, balance: transactions[0]?.balance ?? null, partial };
}
