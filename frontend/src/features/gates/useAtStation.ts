import { useMemo } from 'react';

import { useScreenLocation } from '@/features/map/useUserLocation';
import { useStations } from '@/features/stations/useStations';
import { haversineM } from '@/lib/geo';

/** Inside this distance of a station the rider counts as "at the station" (the gate tracker's radius). */
export const NEAR_STATION_M = 300;

/** True while the rider's phone is within NEAR_STATION_M of any station. False without a location fix or permission. */
export function useAtStation(): boolean {
  const { user } = useScreenLocation();
  const { list } = useStations();
  return useMemo(() => {
    if (!user) return false;
    return list.some((s) => s.lat != null && s.lng != null && haversineM(user.lat, user.lng, s.lat as number, s.lng as number) <= NEAR_STATION_M);
  }, [user, list]);
}
