import type { ReactNode } from 'react';

import type { SpaceStep } from '@/theme/tokens';

export interface DividerProps {
  inset?: SpaceStep;
}

export interface SpacerProps {
  size?: SpaceStep;
  /** grow to fill */
  flex?: boolean;
}

export interface ScreenProps {
  children: ReactNode;
  /** Wrap in a ScrollView with standard padding. */
  scroll?: boolean;
  /** With `scroll`: the content is at least as tall as the screen, so a flex child (a map) fills the space that is left instead of leaving a gap. */
  fill?: boolean;
  /** Edge-to-edge content (maps, scenes): no padding, no top safe-area. */
  bleed?: boolean;
  gap?: SpaceStep;
  /** Leave room for the tab bar. */
  withTabBar?: boolean;
  testID?: string;
}
