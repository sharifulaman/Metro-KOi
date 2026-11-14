import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { MapUser } from '@/components/map';
import { geoAt } from '@/lib/lineGeo';

export type LocationStatus = 'unknown' | 'granted' | 'denied';

/** Metres between two points (haversine). */
export function metresBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** The station closest to `user` (by straight line) and how far it is, given each station's fraction along the line. */
export function nearestStation(user: MapUser, fractions: number[]): { index: number; metres: number } | null {
  let best: { index: number; metres: number } | null = null;
  fractions.forEach((f, index) => {
    const g = geoAt(f);
    const metres = metresBetween(user, g);
    if (!best || metres < best.metres) best = { index, metres };
  });
  return best;
}

/**
 * The rider's position while the screen is open. Never prompts by itself: it follows the position only when
 * location is already allowed; `request()` asks (the Locate button) and returns the first fix.
 */
export function useUserLocation(): { user: MapUser | null; status: LocationStatus; request(): Promise<MapUser | null> } {
  const [user, setUser] = useState<MapUser | null>(null);
  const [status, setStatus] = useState<LocationStatus>('unknown');
  const sub = useRef<Location.LocationSubscription | null>(null);
  const alive = useRef(true);

  const follow = useCallback(async () => {
    if (sub.current) return;
    sub.current = await Location.watchPositionAsync({ accuracy: Location.Accuracy.Balanced, timeInterval: 3000, distanceInterval: 5 }, (p) => {
      if (alive.current) setUser({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy ?? undefined });
    });
  }, []);

  useEffect(() => {
    alive.current = true;
    void (async () => {
      try {
        const perm = await Location.getForegroundPermissionsAsync();
        if (!alive.current) return;
        setStatus(perm.granted ? 'granted' : perm.canAskAgain ? 'unknown' : 'denied');
        if (perm.granted) await follow();
      } catch {
        // no location service here: the map simply has no blue dot
      }
    })();
    return () => {
      alive.current = false;
      sub.current?.remove();
      sub.current = null;
    };
  }, [follow]);

  const request = useCallback(async (): Promise<MapUser | null> => {
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      setStatus(perm.granted ? 'granted' : 'denied');
      if (!perm.granted) return null;
      const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const fix = { lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy ?? undefined };
      setUser(fix);
      await follow();
      return fix;
    } catch {
      setStatus('denied');
      return null;
    }
  }, [follow]);

  return { user, status, request };
}
