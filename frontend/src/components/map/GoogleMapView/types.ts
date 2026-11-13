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
  /** floating tag above the train, e.g. "T-17 · Live" (omit for no tag) */
  label?: string;
  /** standing at a station: the departure countdown shown in the tag */
  dwell?: {
    /** "0:14", already formatted */
    timer: string;
    /** 0..1 share of the stop still left */
    progress: number;
  };
}

export interface GoogleMapViewProps {
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
  /** 1 = whole line (default); ZOOM_NEAR frames a couple of stations around `focus` */
  zoom?: number;
  /** 0..1 along the line to centre on when zoomed (a station, or a train to follow) */
  focus?: number;
  /** Change this to glide back to `focus` after the user has dragged the map away. */
  recenterKey?: number | string;
  /** px at the top covered by floating controls; the map is framed below them */
  topInset?: number;
  /** px to place the focused point right of centre, clear of controls stacked on the left */
  focusShiftX?: number;
  /** Fixed height (previews); fills the parent when omitted. */
  height?: number;
  /** Shown instead of the map when Google Maps cannot load (no key, key rejected, offline). */
  errorText: string;
  testID?: string;
}
