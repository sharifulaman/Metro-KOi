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
  /** set when the first (lead) coach is the women's compartment: the text of its tag, e.g. "Women" */
  women?: string;
  /** 3D view: a card beside the train, e.g. "Platform 1 · SB-0630" with "Leaves in / 0:14" rows (design "live 3") */
  callout?: { title: string; rows: [string, string][] };
  /** standing at a station: the departure countdown shown in the tag */
  dwell?: {
    /** "0:14", already formatted */
    timer: string;
    /** 0..1 share of the stop still left */
    progress: number;
  };
}

/** A station gate drawn as a lettered pin with its landmark. */
export interface MapGate {
  id: string;
  letter: string;
  /** landmark under the pin */
  label: string;
  lat: number;
  lng: number;
}

/** Hint cards along the track around a station for one train (3D): entered, braking, stopped, left, full speed. */
export interface MapHints {
  stationId: string;
  trainId: string;
  dir: Direction;
  items: {
    /** metres from the station along the train's travel (negative = before it) */
    off: number;
    title: string;
    /** pill style when there are no rows */
    time?: string;
    rows?: [string, string][];
    /** already happened */
    past?: boolean;
  }[];
}

/** The rider's own position (blue dot + accuracy ring). */
export interface MapUser {
  lat: number;
  lng: number;
  /** metres */
  accuracy?: number;
  /** compass heading of the phone (0 = north): draws a light cone the way the rider faces */
  heading?: number | null;
  /** GPS speed (m/s) and direction of travel (degrees): on the move the course is truer than the compass */
  speed?: number | null;
  course?: number | null;
}

export interface GoogleMapViewProps {
  stations: MapStation[];
  trains: MapTrain[];
  selectedStation?: string;
  selectedTrain?: string;
  onStationPress?(id: string): void;
  onTrainPress?(id: string): void;
  /** Gate pins (station page); tapping one reports its id. */
  gates?: MapGate[];
  /** 3D: the train hint cards (design "model 2") */
  hints?: MapHints | null;
  /** label of the women's coach zone on the platform (3D), e.g. "Women" */
  womenLabel?: string;
  /** 3D: mark the two platforms of the focused station (coloured edge + a label each) with these texts */
  platformSigns?: { SB: string; NB: string };
  /** 3D: draw the real map (OpenStreetMap buildings, streets, place names); false = the simple generated city. Default true. */
  realMap?: boolean;
  /** 3D: whether the real map data is loading / loaded / could not be fetched */
  onMapStatus?(state: 'loading' | 'ok' | 'fail'): void;
  selectedGate?: string;
  onGatePress?(id: string): void;
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
  /** Highlight the trip from one point of the line to another (0..1 each), with arrows in the travel direction; the whole-line view frames it. */
  route?: { from: number; to: number } | null;
  /** Show the rider's position on the map. */
  user?: MapUser | null;
  /** Dotted walking line from the rider to this point (the chosen gate). */
  walkTo?: { lat: number; lng: number } | null;
  /** 2D: frame these points (e.g. the rider and the gate) instead of `focus`; framed again only when `fitKey` changes */
  fitPoints?: { lat: number; lng: number }[] | null;
  fitKey?: string;
  /** 2D: turn the map with the phone (heading-up) and keep the rider centred; needs `user.heading`. */
  headingUp?: boolean;
  /** Round compass button (top right): shows north, toggles heading-up. */
  compass?: { headingUp: boolean; onPress(): void; label: string };
  /** Frame this exact point (e.g. the rider) instead of `focus`; needs `zoom` > 1. */
  focusPoint?: { lat: number; lng: number };
  /** 3D: tilted vector map with buildings, turned to look along the line. 2D when omitted. */
  tilt?: boolean;
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
