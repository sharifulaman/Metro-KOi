import { useMemo } from 'react';

import faresFile from '@/data/fares.json';
import { journeyOptions } from '@/lib/schedule';
import type { FaresFile, JourneyOption } from '@/models';

import { useNow } from '../common/useNow';
import { useRunModel, useTimetable } from '../timetable/useTimetable';

const fares = faresFile as FaresFile;

/** Next trains From → To, offline from the timetable (spec §10.6). `laterMin` = leave that many minutes from now. */
export function useJourney(fromId: string | null, toId: string | null, count = 3, laterMin = 0): { options: JourneyOption[]; faresAvailable: boolean } {
  const tt = useTimetable();
  const model = useRunModel();
  const now = useNow(15000);
  return useMemo(() => {
    if (!fromId || !toId) return { options: [], faresAvailable: fares.amounts != null };
    return { options: journeyOptions(tt, model, fromId, toId, now + laterMin * 60000, count, fares), faresAvailable: fares.amounts != null };
  }, [tt, model, fromId, toId, now, count, laterMin]);
}
