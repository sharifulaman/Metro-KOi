import * as Crypto from 'expo-crypto';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { zustandStorage } from '@/lib/storage';
import type { Lang, ThemeMode } from '@/models';

interface SettingsState {
  lang: Lang;
  themeMode: ThemeMode;
  onboarded: boolean;
  notifications: boolean;
  deviceId: string;
  favourites: string[];
  setLang(l: Lang): void;
  setThemeMode(m: ThemeMode): void;
  setOnboarded(v: boolean): void;
  setNotifications(v: boolean): void;
  toggleFavourite(stationId: string): void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      lang: 'bn',
      themeMode: 'system',
      onboarded: false,
      notifications: false,
      deviceId: Crypto.randomUUID(),
      favourites: [],
      setLang: (lang) => set({ lang }),
      setThemeMode: (themeMode) => set({ themeMode }),
      setOnboarded: (onboarded) => set({ onboarded }),
      setNotifications: (notifications) => set({ notifications }),
      toggleFavourite: (id) =>
        set((s) => ({ favourites: s.favourites.includes(id) ? s.favourites.filter((f) => f !== id) : [...s.favourites, id] })),
    }),
    { name: 'settings', storage: createJSONStorage(() => zustandStorage('metro-koi')) },
  ),
);
