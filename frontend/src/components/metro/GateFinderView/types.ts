import type { ReactNode } from 'react';

import type { Gate } from '@/models';

export interface GateFinderGate {
  gate: Gate;
  name: string;
  /** second line: the area or the nearby landmark */
  area?: string;
  /** small tag above the name of the selected row, e.g. "Nearest and easiest" */
  tag?: string;
  selected: boolean;
  onPress(): void;
}

export interface GateFinderViewProps {
  title: string;
  subtitle: string;
  onBack(): void;
  backLabel: string;
  /** "Getting off at" */
  stationCaption: string;
  stationName: string;
  changeLabel: string;
  onChangeStation(): void;
  /** "Nearest station: Farmgate · 2.8 km away" */
  nearestNote?: string;
  /** the real map around the station, with the gate pins (fills the map card) */
  map: ReactNode;
  /** the 3D / 2D switch on the map: `active` = 3D is showing; `label` is the accessible name */
  view3d: { active: boolean; label: string; onPress(): void };
  /** small note on the map, e.g. "Gate spots are approximate" */
  mapNote?: string;
  gates: GateFinderGate[];
  actionLabel: string;
  onAction(): void;
  footnote?: string;
  testID?: string;
}
