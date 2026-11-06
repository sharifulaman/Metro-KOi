import type { Direction, TrainState } from '@/models';

export interface LineDiagramStation {
  id: string;
  label: string;
}

export interface LineDiagramTrain {
  id: string;
  dir: Direction;
  state: TrainState;
  /** fractional station index: 3.5 = halfway between station 3 and 4 */
  pos: number;
}

export interface LineDiagramProps {
  stations: LineDiagramStation[];
  trains?: LineDiagramTrain[];
  highlightStation?: string;
  /** inclusive index range drawn bold (journey / ride segment) */
  range?: [number, number];
  /** vertical = full list (train sheet); horizontal = compact strip */
  orientation?: 'vertical' | 'horizontal';
  testID?: string;
}
