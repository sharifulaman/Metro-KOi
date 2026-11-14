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
}

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
    }),
    { name: 'history', storage: createJSONStorage(() => zustandStorage('metro-koi-history')) },
  ),
);
