// Trip history — stored only on this phone (spec §10.10).
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { zustandStorage } from '@/lib/storage';
import type { Transaction } from '@/models';

interface HistoryState {
  items: Transaction[];
  add(tx: Transaction): void;
  clear(): void;
}

export const useHistory = create<HistoryState>()(
  persist(
    (set) => ({
      items: [],
      add: (tx) => set((s) => ({ items: [tx, ...s.items].slice(0, 500) })),
      clear: () => set({ items: [] }),
    }),
    { name: 'history', storage: createJSONStorage(() => zustandStorage('metro-koi-history')) },
  ),
);
