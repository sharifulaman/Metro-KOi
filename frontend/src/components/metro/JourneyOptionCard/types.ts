import type { IconName } from '../../ui/Icon/types';

/** Where a time comes from: a live train, a timetable estimate, or the plain timetable (service closed). */
export type JourneyBadge = 'live' | 'estimated' | 'schedule';

export interface JourneyOptionCardProps {
  /** departure clock time, e.g. "৫:৪৮" */
  depart: string;
  /** arrival clock time */
  arrive: string;
  /** under the departure of the best card ("৪ মিনিট পরে"), or under the times of a compact row */
  waitText: string;
  badge: JourneyBadge;
  /** translated label of the badge */
  badgeLabel: string;
  /** tap opens the journey details */
  onPress?: () => void;
  testID?: string;
  /** highlighted first option with the full timeline (everything below is for it) */
  best?: boolean;
  /** chip on the best card, e.g. "Fastest" */
  bestLabel?: string;
  departCaption?: string;
  arriveCaption?: string;
  /** under the arrival: "৫টি স্টেশন" */
  arriveText?: string;
  /** pill on the line: "১২ মিনিট" */
  duration?: string;
  /** stations between the two ends (dots on the line, at most 4) */
  midStops?: number;
  /** "Platform 1 · towards Motijheel" */
  platformText?: string;
  /** "SB-0630" or "By the timetable" */
  platformMeta?: string;
  action?: { label: string; icon?: IconName; onPress(): void };
  share?: { label: string; onPress(): void };
}
