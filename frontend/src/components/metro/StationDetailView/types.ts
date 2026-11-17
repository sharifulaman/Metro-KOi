import type { ReactNode } from 'react';

export interface StationDetailTile {
  value: string;
  caption: string;
  live: boolean;
}

export interface StationDetailDir {
  key: string;
  title: string;
  platform: string;
  tiles: StationDetailTile[];
}

export interface StationDetailViewProps {
  /** a real map for the header (replaces the pre-rendered picture and its train tag) */
  map?: ReactNode;
  /** 2D / 3D switch next to the favourite button */
  tilt?: { active: boolean; label: string; onPress(): void };
  /** gate pins drawn on the 3D station picture (no map): letter, landmark shown when selected */
  gatePins?: { letter: string; label: string; selected: boolean; onPress(): void }[];
  /** floating train tag over the map, e.g. "SB-0630 · at the station" */
  trainTag?: string;
  order: string;
  lineLine: string;
  name: string;
  dirs: StationDetailDir[];
  facts: { icon: 'pin' | 'layers' | 'locate'; value: string; label: string; onPress?: () => void; active?: boolean }[];
  journeyLabel: string;
  view3dLabel?: string;
  backLabel: string;
  favouriteLabel: string;
  favourite: boolean;
  onBack(): void;
  onFavourite(): void;
  onJourney(): void;
  onView3d?(): void;
  testID?: string;
}
