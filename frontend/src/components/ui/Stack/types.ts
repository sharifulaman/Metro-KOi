import type { ReactNode } from 'react';

import type { SpaceStep } from '@/theme/tokens';

/**
 * Layout primitive so screens never write style objects (spec §9.0 rule 2).
 * Added to the §9.4 catalog: used on every screen.
 */
export interface StackProps {
  children?: ReactNode;
  direction?: 'column' | 'row';
  gap?: SpaceStep;
  pad?: SpaceStep;
  padX?: SpaceStep;
  padY?: SpaceStep;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between';
  wrap?: boolean;
  flex?: boolean;
  /** smallest height in px (a flex child that should still stay usable on a short phone) */
  minH?: number;
  /** direction="row": give every direct child equal width (e.g. two side-by-side buttons) */
  equal?: boolean;
  /** Float over a map/scene: pinned to an edge of the nearest positioned parent. */
  overlay?: 'top' | 'bottom' | 'topRight' | 'bottomRight' | 'fill';
  /** add the device safe-area inset on that edge (floating overlays) */
  safe?: 'top' | 'bottom';
  testID?: string;
}
