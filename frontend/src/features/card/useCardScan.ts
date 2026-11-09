import { useCallback, useEffect, useRef, useState } from 'react';

import { useT } from '@/i18n';
import { bytesToHex, stationIdForCode, type CardRead } from '@/lib/felica';
import { fmtTaka } from '@/lib/fmt';
import type { Transaction } from '@/models';
import { useCard } from '@/store/card';
import { useHistory } from '@/store/history';

import { CardReadError, cancelScan, scanCard } from './nfcReader';

/** Card states (NFC_CARD_READING.md §7). */
export type ScanState =
  | { kind: 'idle' }
  | { kind: 'waiting' }
  | { kind: 'success'; read: CardRead }
  | { kind: 'error'; code: CardReadError['code'] | 'unknown' };

/** Card transactions → local history rows (trips and recharges with a known amount). */
export function toHistory(read: CardRead): Transaction[] {
  const card = bytesToHex(read.idm);
  const out: Transaction[] = [];
  for (const tx of read.transactions) {
    if (tx.amount == null || (tx.kind !== 'trip' && tx.kind !== 'recharge')) continue;
    out.push({
      id: `card:${card}:${tx.at}:${tx.balance}`,
      kind: tx.kind,
      fromStationId: tx.kind === 'trip' ? stationIdForCode(tx.fromCode) : undefined,
      toStationId: tx.kind === 'trip' ? stationIdForCode(tx.toCode) : undefined,
      at: tx.at,
      amountBdt: Math.abs(tx.amount),
      sample: false,
      source: 'card',
    });
  }
  return out;
}

/**
 * Tap-to-read the MRT / Rapid Pass. On success the balance is saved and the
 * card's last ~20 transactions are merged into the phone's trip history.
 */
export function useCardScan() {
  const { t, lang } = useT();
  const [state, setState] = useState<ScanState>({ kind: 'idle' });
  const alive = useRef(true);
  useEffect(
    () => () => {
      alive.current = false;
      cancelScan();
    },
    [],
  );

  const start = useCallback(async () => {
    setState({ kind: 'waiting' });
    try {
      const read = await scanCard({
        prompt: t('card.hold'),
        success: (r) => (r.balance != null ? t('card.readOk', { amount: fmtTaka(r.balance, lang) }) : t('card.noBalance')),
        error: (code) => t(`card.err.${code}`),
      });
      const tail = bytesToHex(read.idm).slice(-4);
      useCard.getState().setLast({
        balanceBdt: read.balance,
        readAt: Date.now(),
        lastTapAt: read.transactions[0]?.at ?? null,
        cardTail: tail,
        cardType: read.cardType,
        partial: read.partial,
      });
      useHistory.getState().merge(toHistory(read));
      if (alive.current) setState({ kind: 'success', read });
    } catch (e) {
      if (!alive.current) return;
      const code = e instanceof CardReadError ? e.code : 'unknown';
      setState(code === 'cancelled' ? { kind: 'idle' } : { kind: 'error', code });
    }
  }, [t, lang]);

  const cancel = useCallback(() => {
    cancelScan();
    setState({ kind: 'idle' });
  }, []);

  return { state, start, cancel };
}
