import { useMemo } from 'react';

import faresFile from '@/data/fares.json';
import { dhakaClock, journeyOptions } from '@/lib/schedule';
import type { FaresFile, JourneyOption } from '@/models';

import { useNow } from '../common/useNow';
import { useRunModel, useTimetable } from '../timetable/useTimetable';

const fares = faresFile as FaresFile;

/**
 * Next trains From → To, offline from the timetable (spec §10.6). `laterMin` = leave that many minutes from now.
 * `closed`: no train is left today, so `options` are the first trains of the next service day.
 */
export function useJourney(fromId: string | null, toId: string | null, count = 3, laterMin = 0): { options: JourneyOption[]; faresAvailable: boolean; closed: boolean } {
  const tt = useTimetable();
  const model = useRunModel();
  const now = useNow(15000);
  return useMemo(() => {
    const faresAvailable = fares.amounts != null;
    if (!fromId || !toId) return { options: [], faresAvailable, closed: false };
    const today = journeyOptions(tt, model, fromId, toId, now + laterMin * 60000, count, fares);
    if (today.length > 0) return { options: today, faresAvailable, closed: false };
    // service has ended: show the first trains of the next day that runs
    const midnight = now - dhakaClock(now).sec * 1000;
    for (let d = 1; d <= 3; d++) {
      const next = journeyOptions(tt, model, fromId, toId, midnight + d * 86400000, count, fares);
      if (next.length > 0) return { options: next, faresAvailable, closed: true };
    }
    return { options: [], faresAvailable, closed: false };
  }, [tt, model, fromId, toId, now, count, laterMin]);
}
