import type { Gate, GateMode, Platform } from '@/models';

export interface StationSectionProps {
  /** platform to highlight at the end of the route */
  platform?: Platform;
  gate?: Gate;
  mode?: GateMode;
  /** show the train at the platform */
  trainAt?: Platform | null;
  /** hide the roof (3D "roof off" fallback) */
  roofOpen?: boolean;
  labels: { concourse: string; platform1: string; platform2: string; street: string };
  testID?: string;
}
