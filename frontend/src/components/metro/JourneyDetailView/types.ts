import type { IconName } from '../../ui/Icon/types';
import type { JourneyBadge } from '../JourneyOptionCard/types';

export interface JourneyDetailStop {
  key: string;
  name: string;
  /** "Board here · Platform 1" on the first stop, "Get off here" on the last */
  note?: string;
  /** clock time, e.g. "৫:৪৮" */
  time: string;
  role: 'start' | 'mid' | 'end';
}

export interface JourneyDetailViewProps {
  title: string;
  backLabel: string;
  shareLabel: string;
  onBack(): void;
  onShare(): void;
  /** green summary card */
  route: string;
  badge: JourneyBadge;
  badgeLabel: string;
  /** "৫:৪৮ → ৬:০০" */
  times: string;
  /** "১২ মিনিট · ৫টি স্টেশন · SB-0630" */
  meta: string;
  stops: JourneyDetailStop[];
  /** "ট্রেন ফার্মগেট স্টেশনে আসতে ~৪ মিনিট" */
  waitNote?: string;
  action?: { label: string; icon?: IconName; onPress(): void };
  testID?: string;
}
