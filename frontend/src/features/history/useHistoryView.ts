import { useMemo } from 'react';

import { DEMO_HISTORY, DEMO_RECENT, type DemoRow } from '@/data/demoHistory';
import { dayDiff, fmtDate, fmtHM, fmtNum, fmtTaka, fmtTakaSigned } from '@/lib/fmt';
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
  /** signed + formatted: "−৳ ৪০" */
  amount: string;
  /** when it happened, ms epoch (0 for placeholder rows) */
  at: number;
  sample: boolean;
}

const dayKey = (ms: number) => new Date(ms + 6 * 3600 * 1000).toISOString().slice(0, 10);

/**
 * Groups history by day and computes the month summary (spec §10.10). With no real
 * history yet it shows the design's placeholder trips (flagged `sample`).
 */
export function useHistoryView(filter: HistoryFilter, lang: Lang, t: T) {
  const stored = useHistory((s) => s.items);
  const { byId } = useStations();
  return useMemo(() => {
    const now = Date.now();
    const real = stored.filter((i) => !i.sample);
    const name = (id?: string) => (id && byId[id] ? stationName(byId[id], lang) : '—');
    const dayLabel = (ago: number, ms?: number) =>
      ago === 0 ? t('common.today') : ago === 1 ? t('common.yesterday') : ago < 7 ? t('common.daysAgo', { n: fmtNum(ago, lang) }) : fmtDate(ms ?? now - ago * 86400000, lang);

    const title = (kind: TransactionKind, from?: string, to?: string) =>
      kind === 'recharge' ? t('history.recharge') : t('history.trip', { from: name(from), to: name(to) });

    type Group = { key: string; label: string; rows: HistoryRowVM[] };
    let groups: Group[] = [];
    let tripCount = 0;
    let spend = 0;
    let recent: { id: string; kind: TransactionKind; title: string; when: string; amount: string }[] = [];

    if (real.length > 0) {
      const month = dayKey(now).slice(0, 7);
      const thisMonth = real.filter((i) => dayKey(i.at).startsWith(month) && i.kind === 'trip');
      tripCount = thisMonth.length;
      spend = thisMonth.reduce((a, i) => a + i.amountBdt, 0);
      const row = (i: Transaction): HistoryRowVM => ({
        id: i.id,
        kind: i.kind,
        title: title(i.kind, i.fromStationId, i.toStationId),
        time: fmtHM(i.at, lang),
        amountBdt: i.amountBdt,
        amount: fmtTakaSigned(i.amountBdt, i.kind === 'trip' ? '−' : '+', lang),
        at: i.at,
        sample: false,
      });
      for (const i of real.filter((x) => filter === 'all' || x.kind === filter)) {
        const k = dayKey(i.at);
        let g = groups.find((x) => x.key === k);
        if (!g) {
          g = { key: k, label: dayLabel(dayDiff(now, i.at), i.at), rows: [] };
          groups.push(g);
        }
        g.rows.push(row(i));
      }
      recent = real.slice(0, 3).map((i) => ({ id: i.id, kind: i.kind, title: title(i.kind, i.fromStationId, i.toStationId), when: dayLabel(dayDiff(now, i.at), i.at) + ' ' + fmtHM(i.at, lang), amount: fmtTakaSigned(i.amountBdt, i.kind === 'trip' ? '−' : '+', lang) }));
    } else {
      const toRow = (r: DemoRow, id: string): HistoryRowVM => ({
        id,
        kind: r.kind,
        title: title(r.kind, r.from, r.to),
        time: fmtNum(r.hm, lang),
        amountBdt: r.fare,
        amount: fmtTakaSigned(r.fare, r.kind === 'trip' ? '−' : '+', lang),
        at: 0,
        sample: true,
      });
      groups = DEMO_HISTORY.map((d, di) => ({
        key: 'demo-' + d.ago,
        label: dayLabel(d.ago),
        rows: d.rows.filter((r) => filter === 'all' || r.kind === filter).map((r, ri) => toRow(r, 'demo-' + di + '-' + ri)),
      })).filter((g) => g.rows.length > 0);
      const allTrips = DEMO_HISTORY.flatMap((d) => d.rows).filter((r) => r.kind === 'trip');
      tripCount = allTrips.length;
      spend = allTrips.reduce((a, r) => a + r.fare, 0);
      recent = DEMO_RECENT.map((d, i) => {
        const r = toRow(d.row, 'demo-recent-' + i);
        return { id: r.id, kind: r.kind, title: r.title, when: dayLabel(d.ago) + ' ' + r.time, amount: r.amount };
      });
    }

    return {
      groups,
      empty: groups.length === 0,
      summary: { trips: fmtNum(tripCount, lang), spend: fmtTaka(spend, lang), spendDigits: fmtNum(spend.toLocaleString('en-US'), lang) },
      recent,
      last: real[0] ?? null,
      isSample: real.length === 0,
    };
  }, [stored, filter, lang, t, byId]);
}
