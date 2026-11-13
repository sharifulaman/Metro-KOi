import { useMemo } from 'react';

import { useT } from '@/i18n';
import { fmtClock, fmtNum } from '@/lib/fmt';
import { dhakaClock, nextServiceStart } from '@/lib/schedule';
import { PLAYBACK_RATES, useClock } from '@/store/clock';

import { useRunModel, useTimetable } from '../timetable/useTimetable';

/**
 * Timetable playback for the live map: works with no location permission and
 * no riders. When the line is closed (night, Friday morning) it starts at the
 * next first train; otherwise it fast-forwards from now.
 */
export function usePlayback(now: number) {
  const { t, lang } = useT();
  const tt = useTimetable();
  const model = useRunModel();
  const playback = useClock((s) => s.playback);
  // recompute the closed/open state every 30 s of (virtual) time
  const bucket = Math.floor(now / 30000);
  const nextStart = useMemo(() => nextServiceStart(tt, model, bucket * 30000 + 1), [tt, model, bucket]);
  const timeLabel = (ms: number) => t('live.timeDay', { time: fmtClock(dhakaClock(ms).sec, lang), day: t(`days.d${dhakaClock(ms).weekday}`) });

  return {
    active: playback != null,
    rate: playback?.rate ?? 1,
    rates: PLAYBACK_RATES.map((r) => ({ value: r, label: `${fmtNum(r, lang)}×` })),
    /** epoch ms of the next first train when nothing runs right now */
    closedUntil: playback ? null : nextStart,
    timeLabel,
    start() {
      const real = Date.now();
      const next = nextServiceStart(tt, model, real);
      useClock.getState().start(next ?? real, 10);
    },
    setRate: (r: number) => useClock.getState().setRate(r),
    stop: () => useClock.getState().stop(),
  };
}
