import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import bundled from '@/data/timetable.json';
import { config } from '@/lib/config';
import { zustandStorage } from '@/lib/storage';
import { buildRunModel, type RunModel } from '@/lib/schedule';
import type { TimetableFile } from '@/models';

import { allStationsRaw } from '../stations/useStations';

const bundledTimetable = bundled as TimetableFile;

// Last timetable fetched from the backend, kept on the phone so an updated timetable still works offline.
const cache = zustandStorage('metro-cache');
function cachedTimetable(): TimetableFile | undefined {
  try {
    const raw = cache.getItem('timetable') as string | null;
    const t = raw ? (JSON.parse(raw) as TimetableFile) : null;
    return t && t.bands && typeof t.endToEndMin === 'number' ? t : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Timetable that works with no backend: the last copy saved on the phone, else the one bundled
 * in the app. Refreshed from GET /v1/timetable when the backend is reachable; a failed fetch
 * silently keeps what we have.
 */
export function useTimetable(): TimetableFile {
  const q = useQuery({
    queryKey: ['timetable'],
    queryFn: async (): Promise<TimetableFile> => {
      const res = await fetch(`${config.apiBase}/timetable`);
      if (!res.ok) throw new Error(`timetable ${res.status}`);
      const data = (await res.json()) as TimetableFile;
      try {
        cache.setItem('timetable', JSON.stringify(data));
      } catch {
        // storage full or unavailable: keep going with the in-memory copy
      }
      return data;
    },
    initialData: cachedTimetable,
    initialDataUpdatedAt: 0,
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
