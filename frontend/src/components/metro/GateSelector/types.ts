import type { Corner, Gate } from '@/models';

export interface GateItem {
  gate: Gate;
  corner: Corner;
  landmark?: string;
  /** null = unknown → "info coming soon" (never guess) */
  hasLift?: boolean | null;
  hasEscalator?: boolean | null;
}

export interface GateSelectorProps {
  gates: GateItem[];
  selected?: Gate;
  recommended?: Gate;
  variant: 'chips' | 'cards' | 'pins';
  onSelect(g: Gate): void;
  labels: {
    gate: (g: Gate) => string;
    corner: (c: Corner) => string;
    nearest: string;
    lift: string;
    escalator: string;
    unknown: string;
  };
  testID?: string;
}
