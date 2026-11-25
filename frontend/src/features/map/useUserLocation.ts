import * as Location from 'expo-location';
import { useIsFocused } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import type { MapUser } from '@/components/map';
import gatesFile from '@/data/gates.json';
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

const GATES = (gatesFile as { gates: { stationId: string; lat: number | null; lng: number | null }[] }).gates;

/**
 * The station closest to `user` and how far it is, given each station's fraction along the line. With the
 * station ids, the distance is to the station's nearest gate (where people actually go in and out), not to
 * the middle of a ~200 m station.
 */
export function nearestStation(user: MapUser, fractions: number[], ids?: string[]): { index: number; metres: number } | null {
  let best: { index: number; metres: number } | null = null;
  fractions.forEach((f, index) => {
    const g = geoAt(f);
    const gates = ids ? GATES.filter((x) => x.stationId === ids[index] && x.lat != null && x.lng != null) : [];
    const metres = gates.length ? Math.min(...gates.map((x) => metresBetween(user, { lat: x.lat as number, lng: x.lng as number }))) : metresBetween(user, g);
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

/** How the rider is moving, from the GPS speed: on foot, or in a vehicle (bus, rickshaw, car, bike). */
export type TravelMode = 'walk' | 'vehicle';

type Located = { user: MapUser | null; status: LocationStatus; travel: TravelMode; request(): Promise<MapUser | null> };

/** above ~11 km/h it is a vehicle; it is walking again only below ~6.5 km/h, so traffic stop-and-go does not flicker */
const VEHICLE_MPS = 3;
const WALK_MPS = 1.8;
/** walking pace ~80 m/min; Dhaka road traffic averages ~15 km/h (250 m/min) */
const WALK_M_PER_MIN = 80;
const VEHICLE_M_PER_MIN = 250;

/** Minutes to cover `metres` the way the rider is moving now (at least 1). */
export function travelMinutes(metres: number, travel: TravelMode): number {
  return Math.max(1, Math.ceil(metres / (travel === 'vehicle' ? VEHICLE_M_PER_MIN : WALK_M_PER_MIN)));
}

const NORMAL = { accuracy: Location.Accuracy.Balanced, timeInterval: 3000, distanceInterval: 5 };
const SLOW = { accuracy: Location.Accuracy.Low, timeInterval: 15000, distanceInterval: 50 };
const FAST = { accuracy: Location.Accuracy.High, timeInterval: 1000, distanceInterval: 0 };

function useLocationCore(opts: LocationOptions, focused: boolean): Located {
  const fast = !!opts.fast;
  const slow = !!opts.slow;
  const enabled = opts.enabled !== false;
  const [user, setUser] = useState<MapUser | null>(null);
  const [travel, setTravel] = useState<TravelMode>('walk');
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
      if (cancelled) return;
      setUser({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy ?? undefined, speed: p.coords.speed, course: p.coords.heading != null && p.coords.heading >= 0 ? p.coords.heading : null });
      // speed in m/s from the GPS; null / negative when the phone cannot tell, then the last mode stands
      const v = p.coords.speed;
      if (v != null && v >= 0) setTravel((cur) => (v >= VEHICLE_MPS ? 'vehicle' : v < WALK_MPS ? 'walk' : cur));
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
    } catch {
      setStatus('denied');
      return null;
    }
    // allowed: a fresh fix, else the phone's last known one (GPS switched off, indoors, or slow to lock on)
    try {
      const p = (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })) ?? (await Location.getLastKnownPositionAsync());
      if (!p) return null;
      const fix = { lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy ?? undefined };
      setUser(fix);
      return fix;
    } catch {
      const last = await Location.getLastKnownPositionAsync().catch(() => null);
      if (!last) return null;
      const fix = { lat: last.coords.latitude, lng: last.coords.longitude, accuracy: last.coords.accuracy ?? undefined };
      setUser(fix);
      return fix;
    }
  }, []);

  return { user, status, travel, request };
}

/** Whether the phone's location service (GPS) is switched on; false when it cannot be read. */
export async function locationServicesOn(): Promise<boolean> {
  try {
    return await Location.hasServicesEnabledAsync();
  } catch {
    return false;
  }
}

/** The rider's position for a screen: tracking pauses while the screen is not in front (tabs stay mounted behind each other). */
export function useScreenLocation(opts: LocationOptions = {}): Located {
  return useLocationCore(opts, useIsFocused());
}

/** The rider's position outside any screen (the root layout's near-station alert): tracks while the app is open. */
export function useUserLocation(opts: LocationOptions = {}): Located {
  return useLocationCore(opts, true);
}
