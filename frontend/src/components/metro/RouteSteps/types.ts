import type { IconName } from '../../ui/Icon/types';

export interface RouteStepItem {
  n: number;
  /** already translated */
  text: string;
  icon?: IconName;
}

export interface RouteStepsProps {
  steps: RouteStepItem[];
  /** translated estimate line, e.g. "About 4 min walk" */
  estimate?: string;
  testID?: string;
}
