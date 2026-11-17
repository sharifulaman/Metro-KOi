// Saved cards (Card section redesign): name, colour and last-4 only, stored on
// this phone. Separate from `store/card.ts`, which holds just the most recent
// NFC read, staged for the Found screen before it is saved here.
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { zustandStorage } from '@/lib/storage';
import type { SavedCard } from '@/models';

type NewCard = Omit<SavedCard, 'id' | 'isDefault' | 'updatedAt'> & { updatedAt?: number };

interface WalletState {
  cards: SavedCard[];
  /** Existing card with this IDm, so a re-scan updates it instead of adding a duplicate. */
  findByIdm(idmHex: string): SavedCard | undefined;
  /** Returns the new card's id. The first saved card becomes the default. */
  add(card: NewCard): string;
  update(id: string, patch: Partial<Omit<SavedCard, 'id'>>): void;
  remove(id: string): void;
  setDefault(id: string): void;
}

export const useWallet = create<WalletState>()(
  persist(
    (set, get) => ({
      cards: [],
      findByIdm: (idmHex) => get().cards.find((c) => c.idmHex === idmHex),
      add: (card) => {
        const id = `card_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
        set((s) => ({ cards: [...s.cards, { ...card, id, updatedAt: card.updatedAt ?? Date.now(), isDefault: s.cards.length === 0 }] }));
        return id;
      },
      update: (id, patch) => set((s) => ({ cards: s.cards.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      remove: (id) =>
        set((s) => {
          const was = s.cards.find((c) => c.id === id);
          const cards = s.cards.filter((c) => c.id !== id);
          if (was?.isDefault && cards.length > 0) cards[0] = { ...cards[0], isDefault: true };
          return { cards };
        }),
      setDefault: (id) => set((s) => ({ cards: s.cards.map((c) => ({ ...c, isDefault: c.id === id })) })),
    }),
    {
      name: 'wallet',
      version: 1,
      storage: createJSONStorage(() => zustandStorage('metro-koi-wallet')),
      // earlier builds saved three made-up sample cards: drop them, keep real ones
      migrate: (persisted) => {
        const p = persisted as { cards?: SavedCard[] };
        const cards = (p.cards ?? []).filter((c) => !c.sample);
        if (cards.length > 0 && !cards.some((c) => c.isDefault)) cards[0] = { ...cards[0], isDefault: true };
        return { ...p, cards } as WalletState;
      },
    },
  ),
);
