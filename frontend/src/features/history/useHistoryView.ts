import { useMemo } from 'react';

import { fmtClock, fmtDate, fmtNum, fmtTaka, secOfDayFromMs } from '@/lib/fmt';
import type { Lang, Transaction, TransactionKind } from '@/models';
import { useHistory } from '@/store/history';

import { stationName, useStations } from '../stations/useStations';

type T = (key: string, opts?: Record<string, unknown>) => string;
export type HistoryFilter = 'all' | TransactionKind;

export interface HistoryRowVM {
  id: string;
  kind: TransactionKind;
  title: string;
  time: string;
  amountBdt: number;
  sample: boolean;
}

const dayKey = (ms: number) => new Date(ms + 6 * 3600 * 1000).toISOString().slice(0, 10);

/** Groups local history by day and computes the month summary (spec §10.10). */
export function useHistoryView(filter: HistoryFilter, lang: Lang, t: T) {
  const items = useHistory((s) => s.items);
  const { byId } = useStations();
  return useMemo(() => {
    const now = Date.now();
    const month = dayKey(now).slice(0, 7);
    const thisMonth = items.filter((i) => dayKey(i.at).startsWith(month));
    const trips = thisMonth.filter((i) => i.kind === 'trip');
    const spend = trips.reduce((a, i) => a + i.amountBdt, 0);

    const title = (i: Transaction) =>
      i.kind === 'recharge'
        ? t('history.recharge')
        : t('history.trip', {
            from: i.fromStationId && byId[i.fromStationId] ? stationName(byId[i.fromStationId], lang) : '—',
            to: i.toStationId && byId[i.toStationId] ? stationName(byId[i.toStationId], lang) : '—',
          });

    const today = dayKey(now);
    const yesterday = dayKey(now - 86400000);
    const groups: { key: string; label: string; rows: HistoryRowVM[] }[] = [];
    for (const i of items.filter((x) => filter === 'all' || x.kind === filter)) {
      const k = dayKey(i.at);
      let g = groups.find((x) => x.key === k);
      if (!g) {
        g = { key: k, label: k === today ? t('common.today') : k === yesterday ? t('common.yesterday') : fmtDate(i.at, lang), rows: [] };
        groups.push(g);
      }
      g.rows.push({ id: i.id, kind: i.kind, title: title(i), time: fmtClock(secOfDayFromMs(i.at), lang), amountBdt: i.amountBdt, sample: i.sample });
    }
    return {
      groups,
      empty: items.length === 0,
      summary: { trips: fmtNum(trips.length, lang), spend: fmtTaka(spend, lang) },
      last: items[0] ?? null,
    };
  }, [items, filter, lang, t, byId]);
}
