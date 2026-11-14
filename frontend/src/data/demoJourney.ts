// Sample trips for the Journey tab, as the design shows them (artboard ১৬). All times are samples.

/** First option leaves at 5:48 (live, 4 min away); the next two are timetable estimates 10 and 20 min later. */
export const DEMO_JOURNEY = {
  trainId: 'SB-0630',
  departSec: 5 * 3600 + 48 * 60,
  waitSec: 4 * 60,
  /** departure gaps of the following options, seconds */
  gaps: [10 * 60, 20 * 60],
} as const;
