import type { ReactNode } from 'react';

import type { IconName } from '../../ui/Icon/types';
import type { JourneyOptionCardProps } from '../JourneyOptionCard/types';
import type { JourneyPickerProps } from '../JourneyPicker/types';

export interface JourneyViewProps {
  title: string;
  subtitle: string;
  timetableLabel: string;
  onTimetable(): void;
  picker: JourneyPickerProps;
  /** service ended: the moon note replaces the Now / Later switch */
  closedNote?: { title: string; body: string };
  /** Now / Later switch; `summary` is the right-hand "towards Motijheel · ~12 min" */
  modes?: {
    nowLabel: string;
    laterLabel: string;
    later: boolean;
    onNow(): void;
    onLater(): void;
    summary?: string;
    laterOptions: { key: string; label: string; selected: boolean; onPress(): void }[];
  };
  /** shown instead of the cards (same stations, no trains left) */
  empty?: { icon: IconName; title: string; action?: { label: string; onPress(): void } };
  best?: JourneyOptionCardProps;
  listTitle?: string;
  rows: JourneyOptionCardProps[];
  disclaimer: string;
  /** overlay, e.g. the station picker sheet */
  children?: ReactNode;
  testID?: string;
}
