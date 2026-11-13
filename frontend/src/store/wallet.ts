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
  /** Fills the wallet with 3 clearly-labelled sample cards, only if it is empty — so the Card tab isn't blank before the rider saves a real one. */
  seedSamplesIfEmpty(names: { card: string; office: string; dad: string }): void;
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
      seedSamplesIfEmpty: (names) => {
        if (get().cards.length > 0) return;
        const now = Date.now();
        const base: Omit<SavedCard, 'id' | 'isDefault'>[] = [
          { name: names.card, color: 'green', tail: '4821', cardType: 'rapid_pass', source: 'manual', balanceBdt: 340, lastTapAt: now - 2 * 3600_000, updatedAt: now, sample: true },
          { name: names.office, color: 'gold', tail: '1709', cardType: 'rapid_pass', source: 'manual', balanceBdt: 120, lastTapAt: now - 26 * 3600_000, updatedAt: now, sample: true },
          { name: names.dad, color: 'dark', tail: '9302', cardType: 'mrt_pass', source: 'manual', balanceBdt: null, lastTapAt: null, updatedAt: now, sample: true },
        ];
        set({ cards: base.map((c, i) => ({ ...c, id: `sample_${now}_${i}`, isDefault: i === 0 })) });
      },
    }),
    { name: 'wallet', storage: createJSONStorage(() => zustandStorage('metro-koi-wallet')) },
  ),
);
