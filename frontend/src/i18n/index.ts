import i18n from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';

import type { Lang } from '@/models';
import { useSettings } from '@/store/settings';

import { bn } from './bn';
import { en } from './en';

export function initI18n(lang: Lang): typeof i18n {
  if (!i18n.isInitialized) {
    void i18n.use(initReactI18next).init({
      resources: { bn: { translation: bn }, en: { translation: en } },
      lng: lang,
      fallbackLng: 'bn',
      interpolation: { escapeValue: false },
      returnNull: false,
    });
  } else {
    // refresh the bundles on every call so edited texts show after a fast refresh, not only after a full restart
    i18n.addResourceBundle('bn', 'translation', bn, true, true);
    i18n.addResourceBundle('en', 'translation', en, true, true);
    if (i18n.language !== lang) void i18n.changeLanguage(lang);
  }
  return i18n;
}

/** `t` plus the current language, for fmt* helpers. */
export function useT(): { t: (key: string, opts?: Record<string, unknown>) => string; lang: Lang } {
  const { t } = useTranslation();
  const lang = useSettings((s) => s.lang);
  return { t: t as (key: string, opts?: Record<string, unknown>) => string, lang };
}

export { i18n };
