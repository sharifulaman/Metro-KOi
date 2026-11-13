// Trip history — stored only on this phone (spec §10.10).
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { zustandStorage } from '@/lib/storage';
import type { Transaction } from '@/models';

interface HistoryState {
  items: Transaction[];
  add(tx: Transaction): void;
  /** add card-read transactions, skipping ids already stored; keeps newest first */
  merge(txs: Transaction[]): void;
  clear(): void;
  /** Fills an empty history with labelled sample trips (two weeks, 14 trips, one recharge) so the Card and History pages aren't blank. */
  seedSamplesIfEmpty(): void;
}

const DHAKA = 6 * 3600 * 1000;
/** ms epoch of `hour:min` Dhaka time, `daysAgo` days before now */
function at(now: number, daysAgo: number, hour: number, min: number): number {
  const dayStart = Math.floor((now + DHAKA) / 86400000) * 86400000 - DHAKA;
  return dayStart - daysAgo * 86400000 + hour * 3600000 + min * 60000;
}

/** [daysAgo, hour, min, from, to, fare] — all within the last two weeks; the recharge is yesterday evening. */
const SAMPLE_TRIPS: [number, number, number, string, string, number][] = [
  [0, 8, 12, 'agargaon', 'motijheel', 40],
  [1, 18, 5, 'motijheel', 'agargaon', 40],
  [1, 9, 20, 'uttara-north', 'farmgate', 60],
  [2, 17, 40, 'farmgate', 'uttara-north', 60],
  [2, 9, 5, 'uttara-north', 'farmgate', 20],
  [3, 18, 30, 'motijheel', 'agargaon', 40],
  [3, 8, 15, 'agargaon', 'motijheel', 40],
  [5, 19, 10, 'shahbagh', 'mirpur-10', 40],
  [5, 10, 0, 'mirpur-10', 'shahbagh', 40],
  [7, 18, 20, 'motijheel', 'agargaon', 40],
  [7, 8, 10, 'agargaon', 'motijheel', 40],
  [9, 17, 50, 'farmgate', 'pallabi', 40],
  [9, 9, 30, 'pallabi', 'farmgate', 20],
  [12, 8, 5, 'agargaon', 'motijheel', 40],
];

export const useHistory = create<HistoryState>()(
  persist(
    (set) => ({
      items: [],
      add: (tx) => set((s) => ({ items: [tx, ...s.items].slice(0, 500) })),
      merge: (txs) =>
        set((s) => {
          const have = new Set(s.items.map((i) => i.id));
          const fresh = txs.filter((t) => !have.has(t.id));
          if (!fresh.length) return s;
          return { items: [...fresh, ...s.items].sort((a, b) => b.at - a.at).slice(0, 500) };
        }),
      clear: () => set({ items: [] }),
      seedSamplesIfEmpty: () =>
        set((s) => {
          if (s.items.length > 0) return s;
          const now = Date.now();
          const trips: Transaction[] = SAMPLE_TRIPS.map(([d, h, m, from, to, fare]) => ({
            id: `sample:${d}:${h}:${m}`,
            kind: 'trip',
            fromStationId: from,
            toStationId: to,
            at: at(now, d, h, m),
            amountBdt: fare,
            sample: true,
            source: 'manual',
          }));
          const recharge: Transaction = { id: 'sample:recharge', kind: 'recharge', at: at(now, 1, 21, 30), amountBdt: 500, sample: true, source: 'manual' };
          return { items: [...trips, recharge].sort((a, b) => b.at - a.at) };
        }),
    }),
    { name: 'history', storage: createJSONStorage(() => zustandStorage('metro-koi-history')) },
  ),
);
