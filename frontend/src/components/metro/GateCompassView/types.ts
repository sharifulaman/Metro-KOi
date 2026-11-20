import type { Gate } from '@/models';

export interface GateCompassRow {
  gate: Gate;
  name: string;
  /** "10.9 km away"; undefined while the position is unknown */
  distance?: string;
  selected: boolean;
  onPress(): void;
}

export interface GateCompassViewProps {
  title: string;
  subtitle: string;
  onBack(): void;
  backLabel: string;
  /** "Gate D · Motijheel" */
  caption: string;
  /** big number, e.g. "10.9 km away", or "You are here" */
  distance: string;
  /** one line under it: "Turn left", "Straight ahead", "Compass not available" */
  status: string;
  /** the gate's landmark, e.g. "Balaka Mor · Krishi Bank Head Office" */
  landmark: string;
  /** degrees to turn the arrow so it points at the gate; null = no compass, arrow dimmed */
  rotation: number | null;
  /** within a few steps of the gate: shows the gate letter instead of the arrow */
  arrived: boolean;
  /** the phone already points at the gate (within 15 degrees): the dial turns green */
  ahead: boolean;
  gate: Gate;
  rows: GateCompassRow[];
  footnote?: string;
  testID?: string;
}
