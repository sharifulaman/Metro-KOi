import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

/** Compass heading in degrees (0 = north) while `enabled`; null until the sensor reports or if it is unavailable. */
export function useHeading(enabled: boolean): number | null {
  const [heading, setHeading] = useState<number | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let sub: Location.LocationSubscription | null = null;
    let alive = true;
    void (async () => {
      try {
        const s = await Location.watchHeadingAsync((h) => {
          if (!alive) return;
          setHeading(h.trueHeading >= 0 ? h.trueHeading : h.magHeading);
        });
        if (alive) sub = s;
        else s.remove();
      } catch {
        // no compass on this device: the screen falls back to the distance only
      }
    })();
    return () => {
      alive = false;
      sub?.remove();
    };
  }, [enabled]);
  return heading;
}
