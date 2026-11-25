import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import bundled from '@/data/timetable.json';
import { config } from '@/lib/config';
import { zustandStorage } from '@/lib/storage';
import { buildRunModel, type RunModel } from '@/lib/schedule';
import type { TimetableFile } from '@/models';

import { allStationsRaw } from '../stations/useStations';

const bundledTimetable = bundled as unknown as TimetableFile;

/** Versions are "YYYY-MM-DD.n": the later one wins, so an old server row or phone cache never hides a newer bundled timetable. */
function newest(a: TimetableFile | undefined, b: TimetableFile): TimetableFile {
  return a && (a.version ?? '') > (b.version ?? '') ? a : b;
}

// Last timetable fetched from Supabase, kept on the phone so an updated timetable still works offline.
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

/** The timetable row in Supabase (PostgREST). */
async function fetchTimetable(): Promise<TimetableFile> {
  if (!config.supabaseUrl || !config.supabaseAnonKey) throw new Error('supabase not configured');
  const res = await fetch(`${config.supabaseUrl}/rest/v1/timetable?id=eq.1&select=data`, {
    headers: { apikey: config.supabaseAnonKey, Authorization: `Bearer ${config.supabaseAnonKey}` },
  });
  if (!res.ok) throw new Error(`timetable ${res.status}`);
  const rows = (await res.json()) as { data: TimetableFile }[];
  if (!rows[0]?.data) throw new Error('timetable row missing');
  return rows[0].data;
}

/**
 * Timetable that works offline: the last copy saved on the phone, else the one bundled
 * in the app. Refreshed from Supabase when it is reachable; a failed fetch
 * silently keeps what we have.
 */
export function useTimetable(): TimetableFile {
  const q = useQuery({
    queryKey: ['timetable'],
    queryFn: async (): Promise<TimetableFile> => {
      const data = await fetchTimetable();
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
  return newest(q.data, bundledTimetable);
}

export function useRunModel(): RunModel {
  const tt = useTimetable();
  return useMemo(() => buildRunModel(allStationsRaw, tt.endToEndMin, tt.dwellSec, tt.dwellByStation), [tt.endToEndMin, tt.dwellSec, tt.dwellByStation]);
}

export { bundledTimetable };
