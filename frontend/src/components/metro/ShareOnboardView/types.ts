import type { IconName } from '../../ui/Icon/types';

export interface ShareOnboardRow {
  icon: IconName;
  title: string;
  body: string;
}

export interface ShareOnboardViewProps {
  title: string;
  body: string;
  /** the "what is shared" list (design: no identity, only the trip, deleted in 24 h) */
  rows: ShareOnboardRow[];
  /** pill beside the train in the illustration */
  trainLabel: string;
  /** badge in the illustration's corner */
  liveLabel: string;
  ctaLabel: string;
  /** small print under the button */
  note: string;
  skipLabel: string;
  onEnable(): void;
  onSkip(): void;
  /** onboarding page dots; hidden when absent */
  progress?: { index: number; count: number };
  testID?: string;
}
