// Last NFC card read — stored only on this phone (spec §10.10).
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { zustandStorage } from '@/lib/storage';
import type { CardSnapshot } from '@/models';

interface CardState {
  last: CardSnapshot | null;
  setLast(s: CardSnapshot): void;
  forget(): void;
}

export const useCard = create<CardState>()(
  persist(
    (set) => ({
      last: null,
      setLast: (last) => set({ last }),
      forget: () => set({ last: null }),
    }),
    { name: 'card', storage: createJSONStorage(() => zustandStorage('metro-koi-card')) },
  ),
);
