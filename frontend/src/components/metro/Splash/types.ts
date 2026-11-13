export interface SplashProps {
  /** "Metro" + accent-coloured "KOI" */
  title: string;
  accent: string;
  /** Bangla name under the title */
  subtitle: string;
  tagline: string;
  /** loading caption under the bar */
  status: string;
  /** map and data credits at the bottom (may contain a line break) */
  credit: string;
  logoLabel: string;
  /** how long it stays up before fading out; tapping skips it */
  durationMs?: number;
  /** called once it has faded out, so the parent can unmount it */
  onFinish: () => void;
  testID?: string;
}
