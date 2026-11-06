import type { ReactNode } from 'react';

import type { SpaceStep } from '@/theme/tokens';

export interface SheetProps {
  children: ReactNode;
  /** Show the grab handle; pressing it toggles collapsed/expanded. */
  handle?: boolean;
  /** Docked to the bottom edge of the map (square bottom corners, height capped). */
  docked?: boolean;
  /** Collapsed sheets show only `peek`. */
  collapsed?: boolean;
  onToggle?: () => void;
  peek?: ReactNode;
  gap?: SpaceStep;
  /** Max height as a fraction of the window (docked only). */
  maxHeight?: number;
  testID?: string;
}
