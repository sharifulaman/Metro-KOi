import * as Location from 'expo-location';
import { useIsFocused } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

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

export interface LocationOptions {
  /** 1-second, high-accuracy updates (the live map, the station page). Default: every 3 s / 5 m, balanced accuracy: far lighter on the battery. */
  fast?: boolean;
  /** a coarse fix every 15 s / 50 m (background-style checks such as the near-station alert) */
  slow?: boolean;
  /** false = do not track at all (default true) */
  enabled?: boolean;
}

type Located = { user: MapUser | null; status: LocationStatus; request(): Promise<MapUser | null> };

const NORMAL = { accuracy: Location.Accuracy.Balanced, timeInterval: 3000, distanceInterval: 5 };
const SLOW = { accuracy: Location.Accuracy.Low, timeInterval: 15000, distanceInterval: 50 };
const FAST = { accuracy: Location.Accuracy.High, timeInterval: 1000, distanceInterval: 0 };

function useLocationCore(opts: LocationOptions, focused: boolean): Located {
  const fast = !!opts.fast;
  const slow = !!opts.slow;
  const enabled = opts.enabled !== false;
  const [user, setUser] = useState<MapUser | null>(null);
  const [status, setStatus] = useState<LocationStatus>('unknown');
  const [granted, setGranted] = useState(false);
  const [foreground, setForeground] = useState(AppState.currentState === 'active');

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => setForeground(s === 'active'));
    return () => sub.remove();
  }, []);

  // never prompts by itself: it only follows the position when location is already allowed
  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const perm = await Location.getForegroundPermissionsAsync();
        if (!alive) return;
        setStatus(perm.granted ? 'granted' : perm.canAskAgain ? 'unknown' : 'denied');
        setGranted(perm.granted);
      } catch {
        // no location service here: the map simply has no blue dot
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // the GPS runs only while this screen is in front AND the app is open: a hidden tab or a backgrounded app costs nothing
  const on = enabled && focused && foreground && granted;
  useEffect(() => {
    if (!on) return undefined;
    let cancelled = false;
    let sub: Location.LocationSubscription | null = null;
    void Location.watchPositionAsync(fast ? FAST : slow ? SLOW : NORMAL, (p) => {
      if (!cancelled) setUser({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy ?? undefined });
    })
      .then((s) => {
        if (cancelled) s.remove();
        else sub = s;
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [on, fast, slow]);

  const request = useCallback(async (): Promise<MapUser | null> => {
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      setStatus(perm.granted ? 'granted' : 'denied');
      if (!perm.granted) return null;
      setGranted(true);
      const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const fix = { lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy ?? undefined };
      setUser(fix);
      return fix;
    } catch {
      setStatus('denied');
      return null;
    }
  }, []);

  return { user, status, request };
}

/** The rider's position for a screen: tracking pauses while the screen is not in front (tabs stay mounted behind each other). */
export function useScreenLocation(opts: LocationOptions = {}): Located {
  return useLocationCore(opts, useIsFocused());
}

/** The rider's position outside any screen (the root layout's near-station alert): tracks while the app is open. */
export function useUserLocation(opts: LocationOptions = {}): Located {
  return useLocationCore(opts, true);
}
