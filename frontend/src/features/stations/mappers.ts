// Data → component props for station screens. No JSX here.
import type { DepartureRowProps } from '@/components/metro';
import type { Departure, Direction, Lang, Station } from '@/models';

import { stationName } from './useStations';

type T = (key: string, opts?: Record<string, unknown>) => string;

export function platformTitle(dir: Direction, first: Station, last: Station, lang: Lang, t: T): string {
  const towards = stationName(dir === 'SB' ? last : first, lang);
  return `${t('common.platform', { n: lang === 'bn' ? (dir === 'SB' ? '১' : '২') : dir === 'SB' ? 1 : 2 })} ${t('common.towardsShort', { name: towards })}`;
}

export function toDepartureRows(deps: Departure[], onPress?: (trainId: string) => void): (DepartureRowProps & { key: string })[] {
  return deps.map((d) => ({
    key: `${d.trainId ?? 'x'}-${d.atSec}-${d.source}`,
    etaSec: d.etaSec,
    source: d.source,
    trainId: d.source === 'live' ? d.trainId : undefined,
    onPress: d.trainId && onPress ? () => onPress(d.trainId as string) : undefined,
  }));
}
