import i18n from 'i18next';
import { useEffect } from 'react';
import { initReactI18next, useTranslation } from 'react-i18next';

import type { Lang } from '@/models';
import { useSettings } from '@/store/settings';

import { bn } from './bn';
import { en } from './en';

/** One-time setup (safe to call while rendering: nothing is subscribed yet). Switching language later is `useI18nLanguage`. */
export function initI18n(lang: Lang): typeof i18n {
  if (!i18n.isInitialized) {
    void i18n.use(initReactI18next).init({
      resources: { bn: { translation: bn }, en: { translation: en } },
      lng: lang,
      fallbackLng: 'bn',
      interpolation: { escapeValue: false },
      returnNull: false,
    });
  }
  return i18n;
}

/**
 * Follows the saved language. changeLanguage notifies every translated component, so it must run in an effect:
 * calling it while Root renders updates other components mid-render ("Cannot update a component while rendering a different component").
 */
export function useI18nLanguage(lang: Lang): void {
  useEffect(() => {
    if (i18n.isInitialized && i18n.language !== lang) void i18n.changeLanguage(lang);
  }, [lang]);
}

// After a fast refresh this file runs again while i18n is already set up: load the edited texts here, at module
// level. Doing it inside initI18n (called while rendering) updates other components mid-render and logs an error.
if (i18n.isInitialized) {
  i18n.addResourceBundle('bn', 'translation', bn, true, true);
  i18n.addResourceBundle('en', 'translation', en, true, true);
}

/** `t` plus the current language, for fmt* helpers. */
export function useT(): { t: (key: string, opts?: Record<string, unknown>) => string; lang: Lang } {
  const { t } = useTranslation();
  const lang = useSettings((s) => s.lang);
  return { t: t as (key: string, opts?: Record<string, unknown>) => string, lang };
}

export { i18n };
