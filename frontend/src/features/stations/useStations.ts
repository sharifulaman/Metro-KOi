import { useMemo } from 'react';

import stationsFile from '@/data/stations.json';
import { openStations } from '@/lib/schedule';
import type { Lang, Station, StationsFile } from '@/models';

const file = stationsFile as StationsFile;

export function stationName(s: Pick<Station, 'nameBn' | 'nameEn'>, lang: Lang): string {
  return lang === 'bn' ? s.nameBn : s.nameEn;
}

export function stationAltName(s: Pick<Station, 'nameBn' | 'nameEn'>, lang: Lang): string {
  return lang === 'bn' ? s.nameEn : s.nameBn;
}

/** Open stations only (planned ones like Kamalapur stay hidden, spec §1.4). */
export function useStations() {
  return useMemo(() => {
    const list = openStations(file.stations);
    const byId = Object.fromEntries(list.map((s) => [s.id, s])) as Record<string, Station>;
    return { list, byId, geometry: file.geometry, first: list[0], last: list[list.length - 1] };
  }, []);
}

export const allStationsRaw = file.stations;
