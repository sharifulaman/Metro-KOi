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

const BENGALI = /[ঀ-৿]/;

/** True when the text contains any Bangla letter or digit. */
export function hasBengali(text: string | undefined | null): boolean {
  return !!text && BENGALI.test(text);
}

/**
 * Bangla → Hind Siliguri, Latin/digits → Plus Jakarta Sans (spec §9.2).
 * Text that contains Bangla always gets Hind Siliguri, even in English mode (e.g. the Bangla station name shown
 * under the English one): Plus Jakarta Sans has no Bangla glyphs, so the phone would otherwise fall back to
 * whatever Bangla font it happens to have, and some phones have none or a poor one.
 */
export function fontFamily(lang: Lang, weight: 400 | 500 | 600 | 700, numeric = false, text?: string | null): string {
  const bangla = lang === 'bn' || hasBengali(text);
  void numeric; // Bangla digits need Hind Siliguri glyphs, which is what Bangla text already uses
  return `${bangla ? 'HindSiliguri' : 'PlusJakartaSans'}_${suffix[weight]}`;
}

/** Bangla glyphs are visually smaller than Latin at the same size, so small Bangla text is enlarged a little. */
export function bnSize(size: number): number {
  if (size > 18) return size;
  return Math.max(12, Math.round(size * 1.08));
}
