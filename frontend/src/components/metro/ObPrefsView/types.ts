import type { Lang, ThemeMode } from '@/models';

export interface ObPrefsViewProps {
  title: string;
  body: string;
  lang: Lang;
  onLang(l: Lang): void;
  theme: ThemeMode;
  onTheme(m: ThemeMode): void;
  labels: {
    language: string;
    theme: string;
    bangla: string;
    banglaSub: string;
    english: string;
    englishSub: string;
    system: string;
    light: string;
    dark: string;
    /** note under the theme cards ("System follows the phone") */
    systemNote: string;
  };
  nextLabel: string;
  onNext(): void;
  progress?: { index: number; count: number };
  testID?: string;
}
