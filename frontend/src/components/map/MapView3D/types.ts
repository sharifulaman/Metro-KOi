import type { ReactNode } from 'react';

import type { Direction, TrainState } from '@/models';

export interface MapStation {
  id: string;
  label: string;
  /** 0 = Uttara North … 1 = Motijheel */
  f: number;
}

export interface MapTrain {
  id: string;
  dir: Direction;
  state: TrainState;
  f: number;
}

export interface MapView3DProps {
  stations: MapStation[];
  trains: MapTrain[];
  selectedStation?: string;
  selectedTrain?: string;
  onStationPress?(id: string): void;
  onTrainPress?(id: string): void;
  /** Floating UI over the map (search, pills, FAB). */
  children?: ReactNode;
  /** Bottom padding reserved for a sheet, in px. */
  bottomInset?: number;
  /** Fit the line above a docked Sheet (layout.dockedSheet of the window). */
  reserveSheet?: boolean;
  attribution: string;
  /** Fixed height (previews); fills the parent when omitted. */
  height?: number;
  testID?: string;
}
