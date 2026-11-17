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
  /** the one-time location permission prompt has been shown */
  locationAsked: boolean;
  deviceId: string;
  favourites: string[];
  /** show the design's fixed sample data instead of the real timetable (off by default) */
  demo: boolean;
  setLang(l: Lang): void;
  setThemeMode(m: ThemeMode): void;
  setOnboarded(v: boolean): void;
  setNotifications(v: boolean): void;
  setLocationAsked(v: boolean): void;
  toggleFavourite(stationId: string): void;
  setDemo(v: boolean): void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      lang: 'bn',
      themeMode: 'system',
      onboarded: false,
      notifications: false,
      locationAsked: false,
      deviceId: Crypto.randomUUID(),
      favourites: [],
      demo: false,
      setLang: (lang) => set({ lang }),
      setThemeMode: (themeMode) => set({ themeMode }),
      setOnboarded: (onboarded) => set({ onboarded }),
      setNotifications: (notifications) => set({ notifications }),
      setLocationAsked: (locationAsked) => set({ locationAsked }),
      setDemo: (demo) => set({ demo }),
      toggleFavourite: (id) =>
        set((s) => ({ favourites: s.favourites.includes(id) ? s.favourites.filter((f) => f !== id) : [...s.favourites, id] })),
    }),
    {
      name: 'settings',
      version: 1,
      storage: createJSONStorage(() => zustandStorage('metro-koi')),
      // v0 defaulted to the design's fixed sample times; show the real timetable instead
      migrate: (persisted) => ({ ...(persisted as object), demo: false }) as SettingsState,
    },
  ),
);
