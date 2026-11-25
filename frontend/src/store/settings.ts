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
  /** the journey screen's last From / To stations, restored on the next visit */
  /** 3D view: show the real map (OpenStreetMap buildings, streets and place names) */
  realMap3d: boolean;
  tripFrom: string | null;
  tripTo: string | null;
  setLang(l: Lang): void;
  setThemeMode(m: ThemeMode): void;
  setOnboarded(v: boolean): void;
  setNotifications(v: boolean): void;
  setLocationAsked(v: boolean): void;
  toggleFavourite(stationId: string): void;
  setDemo(v: boolean): void;
  setRealMap3d(v: boolean): void;
  setTripFrom(id: string | null): void;
  setTripTo(id: string | null): void;
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
      realMap3d: true,
      // From follows the rider's nearest station once location is known; no made-up start before that
      tripFrom: null,
      tripTo: 'motijheel',
      setLang: (lang) => set({ lang }),
      setThemeMode: (themeMode) => set({ themeMode }),
      setOnboarded: (onboarded) => set({ onboarded }),
      setNotifications: (notifications) => set({ notifications }),
      setLocationAsked: (locationAsked) => set({ locationAsked }),
      setDemo: (demo) => set({ demo }),
      setRealMap3d: (realMap3d) => set({ realMap3d }),
      setTripFrom: (tripFrom) => set({ tripFrom }),
      setTripTo: (tripTo) => set({ tripTo }),
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
