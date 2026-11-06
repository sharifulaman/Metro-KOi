import {
  HindSiliguri_400Regular,
  HindSiliguri_500Medium,
  HindSiliguri_600SemiBold,
  HindSiliguri_700Bold,
} from '@expo-google-fonts/hind-siliguri';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { useFonts } from 'expo-font';

import type { Lang } from '@/models';

export const fontAssets = {
  HindSiliguri_400Regular,
  HindSiliguri_500Medium,
  HindSiliguri_600SemiBold,
  HindSiliguri_700Bold,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
};

export function useAppFonts(): boolean {
  const [loaded, error] = useFonts(fontAssets);
  // If fonts fail to load we still render with the system font.
  return loaded || error != null;
}

const suffix = { 400: '400Regular', 500: '500Medium', 600: '600SemiBold', 700: '700Bold' } as const;

/** Bangla → Hind Siliguri, Latin/digits → Plus Jakarta Sans (spec §9.2). */
export function fontFamily(lang: Lang, weight: 400 | 500 | 600 | 700, numeric = false): string {
  const family = lang === 'bn' && !numeric ? 'HindSiliguri' : 'PlusJakartaSans';
  // Bangla digits need Hind Siliguri glyphs.
  const fam = numeric && lang === 'bn' ? 'HindSiliguri' : family;
  return `${fam}_${suffix[weight]}`;
}
