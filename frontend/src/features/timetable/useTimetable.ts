import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import bundled from '@/data/timetable.json';
import { config } from '@/lib/config';
import { buildRunModel, type RunModel } from '@/lib/schedule';
import type { TimetableFile } from '@/models';

import { allStationsRaw } from '../stations/useStations';

const bundledTimetable = bundled as TimetableFile;

/**
 * Bundled timetable (works offline); refreshed from GET /v1/timetable when the
 * backend is reachable. A failed fetch silently keeps the bundled copy.
 */
export function useTimetable(): TimetableFile {
  const q = useQuery({
    queryKey: ['timetable'],
    queryFn: async (): Promise<TimetableFile> => {
      const res = await fetch(`${config.apiBase}/timetable`);
      if (!res.ok) throw new Error(`timetable ${res.status}`);
      return (await res.json()) as TimetableFile;
    },
    staleTime: 6 * 3600 * 1000,
    retry: 1,
  });
  return q.data ?? bundledTimetable;
}

export function useRunModel(): RunModel {
  const tt = useTimetable();
  return useMemo(() => buildRunModel(allStationsRaw, tt.endToEndMin, tt.dwellSec), [tt.endToEndMin, tt.dwellSec]);
}

export { bundledTimetable };
