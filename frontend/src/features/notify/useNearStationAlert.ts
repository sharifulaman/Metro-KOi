import { useEffect, useMemo } from 'react';

import { useUserLocation } from '@/features/map/useUserLocation';
import { useDepartures } from '@/features/stations/useDepartures';
import { stationName, useStations } from '@/features/stations/useStations';
import { useT } from '@/i18n';
import { fmtEtaAt } from '@/lib/fmt';
import { haversineM } from '@/lib/geo';
import { useSettings } from '@/store/settings';

import { showNotification } from './notify';

/** within this many metres of a station the rider counts as "at the station" */
const NEAR_M = 300;
/** the same station is not announced again for this long */
const COOLDOWN_MS = 15 * 60 * 1000;
const last: { id: string | null; at: number } = { id: null, at: 0 };

/**
 * When Notifications are on and the rider comes within reach of a metro station, shows the next trains there
 * ("Near Farmgate: towards Motijheel ~4 min, towards Uttara North 7 min"). Works while the app is open.
 */
export function useNearStationAlert() {
  const enabled = useSettings((s) => s.notifications);
  const { user } = useUserLocation();
  const { list } = useStations();
  const { t, lang } = useT();

  const nearId = useMemo(() => {
    if (!user) return null;
    let best: { id: string; d: number } | null = null;
    for (const s of list) {
      const d = haversineM(user.lat, user.lng, s.lat as number, s.lng as number);
      if (!best || d < best.d) best = { id: s.id, d };
    }
    return best && best.d <= NEAR_M ? best.id : null;
  }, [user, list]);

  const deps = useDepartures(nearId ?? '', 1);

  useEffect(() => {
    if (!enabled || !nearId) return;
    const now = Date.now();
    if (last.id === nearId && now - last.at < COOLDOWN_MS) return;
    const st = list.find((s) => s.id === nearId);
    if (!st) return;
    const lines = (['SB', 'NB'] as const)
      .filter((dir) => !deps.isTerminusFor[dir] && deps.byDir[dir][0])
      .map((dir) => {
        const d = deps.byDir[dir][0];
        return `${t(`timetable.${dir}`)}: ${fmtEtaAt(d.etaSec, d.atSec, d.source, lang)}`;
      });
    if (lines.length === 0) return;
    last.id = nearId;
    last.at = now;
    void showNotification(t('notify.title', { name: stationName(st, lang) }), lines.join('\n'));
    // only a new station (or a switch on) should fire; the live ETAs changing every second must not
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, nearId]);
}
