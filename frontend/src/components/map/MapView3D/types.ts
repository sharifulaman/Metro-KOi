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
  /** tag shown above the train when it is selected */
  label?: string;
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
  /** 1 = whole line (default); >1 zooms in around `focus` */
  zoom?: number;
  /** 0..1 along the line to centre on when zoomed (a station, or a train to follow) */
  focus?: number;
  /** px at the top covered by floating controls; the line is framed below them */
  topInset?: number;
  /** Fixed height (previews); fills the parent when omitted. */
  height?: number;
  testID?: string;
}
