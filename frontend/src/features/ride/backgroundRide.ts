// Background ride detection (docs/train-tracking-plan.md §5.3, opt-in "always" mode). Tasks are defined at module
// load (imported at the top of app/_layout.tsx) because a background launch mounts no components.
//
// Flow: geofences around every open station (16, under iOS's limit of 20) → entering one starts location updates
// in a foreground service → the same ride detector as the open app runs on each fix → an ON_TRAIN ride can share
// (if the rider turned sharing on) and reminds them of their stop → back to IDLE for a while: updates stop again.
// Android does not relaunch a closed app on a geofence event (iOS does): there it works while the app is in the background.
import * as Crypto from 'expo-crypto';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { AppState, Platform } from 'react-native';

import line from '@/data/line6.json';
import stationsFile from '@/data/stations.json';
import timetable from '@/data/timetable.json';
import { config } from '@/lib/config';
import { snapToLine } from '@/lib/lineGeo';
import { initialRide, nextStationIdx, stepRide, type RideState } from '@/lib/rideDetector';
import { buildRunModel, etaToStation } from '@/lib/schedule';
import type { Station, TimetableFile } from '@/models';
import { useSettings } from '@/store/settings';

import { showNotification } from '../notify/notify';

import { matchScheduled } from './matchScheduled';

export const GEOFENCE_TASK = 'metro-koi-station-geofence';
export const RIDE_TASK = 'metro-koi-ride-updates';

const LINE_M = line.properties.lengthM;
const STATIONS = (stationsFile as unknown as { stations: Station[] }).stations;
const OPEN = STATIONS.filter((s) => s.status === 'open' && s.lat != null && s.lng != null).sort((a, b) => a.order - b.order);
const TT = timetable as unknown as TimetableFile;
const MODEL = buildRunModel(STATIONS, TT.endToEndMin, TT.dwellSec, TT.dwellByStation);
/** stop the location updates after this long without a ride starting (left the station area) */
const IDLE_STOP_MS = 5 * 60_000;
const EXIT_ALERT_SEC = 120;

// state of the current background ride (module scope: lives as long as the background JS context)
let ride: RideState = initialRide(Date.now());
let idleSince: number | null = null;
let alertedFor: string | null = null;
let share: { sessionId: string; startedAt: number | null } | null = null;

/** Insert one rider event through Supabase REST (no realtime connection in the background). */
async function postEvent(kind: 'start' | 'fix' | 'stop', sessionId: string, payload: Record<string, unknown>): Promise<void> {
  if (!config.supabaseUrl || !config.supabaseAnonKey) return;
  try {
    await fetch(`${config.supabaseUrl}/rest/v1/rider_events`, {
      method: 'POST',
      headers: { apikey: config.supabaseAnonKey, Authorization: `Bearer ${config.supabaseAnonKey}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ kind, session_id: sessionId, device_id: useSettings.getState().deviceId, payload }),
    });
  } catch {
    // offline: this fix is lost, the next one may get through
  }
}

async function settings() {
  // a background launch starts with an empty store: load the saved settings first
  if (!useSettings.persist.hasHydrated()) await useSettings.persist.rehydrate();
  return useSettings.getState();
}

async function stopUpdates(): Promise<void> {
  if (share) void postEvent('stop', share.sessionId, {});
  share = null;
  ride = initialRide(Date.now());
  idleSince = null;
  if (await Location.hasStartedLocationUpdatesAsync(RIDE_TASK).catch(() => false)) await Location.stopLocationUpdatesAsync(RIDE_TASK).catch(() => undefined);
}

async function startUpdates(): Promise<void> {
  if (await Location.hasStartedLocationUpdatesAsync(RIDE_TASK).catch(() => false)) return;
  const bn = (await settings()).lang === 'bn';
  await Location.startLocationUpdatesAsync(RIDE_TASK, {
    accuracy: Location.Accuracy.High,
    timeInterval: 3000,
    distanceInterval: 0,
    activityType: Location.ActivityType.OtherNavigation,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: bn ? 'মেট্রো কই: যাত্রা খোঁজা হচ্ছে' : 'Metro Koi: looking for your train',
      notificationBody: bn ? 'স্টেশনের কাছে আছেন, তাই আপনার ট্রেন চেনার চেষ্টা চলছে।' : 'You are at a station, so the app is looking for your train.',
      killServiceOnDestroy: true,
    },
  }).catch(() => undefined);
}

async function onFix(loc: Location.LocationObject): Promise<void> {
  const snap = snapToLine(loc.coords.latitude, loc.coords.longitude);
  const s = MODEL.chainage[0] + snap.f * LINE_M;
  ride = stepRide(ride, { ts: loc.timestamp, s, offsetM: snap.metres, speed: Math.max(0, loc.coords.speed ?? 0) }, { stationM: MODEL.chainage, match: (dir, ss, ts) => matchScheduled(TT, MODEL, dir, ss, ts) });

  if (ride.phase === 'IDLE' || ride.phase === 'REJECTED') {
    if (share) {
      void postEvent('stop', share.sessionId, {});
      share = null;
    }
    idleSince ??= loc.timestamp;
    if (loc.timestamp - idleSince >= IDLE_STOP_MS) await stopUpdates();
    return;
  }
  idleSince = null;
  if (ride.phase !== 'ON_TRAIN' || !ride.dir) return;

  const st = await settings();
  const nextIdx = nextStationIdx({ stationM: MODEL.chainage }, ride.dir, s);
  const nextId = nextIdx != null ? MODEL.stationIds[nextIdx] : null;
  const eta = nextId ? etaToStation(MODEL, { s, dir: ride.dir }, nextId) : null;
  if (st.notifications && nextId && nextId === st.tripTo && eta != null && eta <= EXIT_ALERT_SEC && alertedFor !== nextId) {
    alertedFor = nextId;
    const stn = OPEN.find((x) => x.id === nextId);
    const name = stn ? (st.lang === 'bn' ? stn.nameBn : stn.nameEn) : nextId;
    void showNotification(st.lang === 'bn' ? 'পরের স্টেশনে নামুন' : 'Get off at the next stop', st.lang === 'bn' ? `${name} আসছে, নামার প্রস্তুতি নিন।` : `${name} is next. Get ready to get off.`);
  }
  if (st.shareRides) {
    if (!share || share.startedAt !== ride.startedAt) {
      share = { sessionId: Crypto.randomUUID(), startedAt: ride.startedAt };
      // the detector already saw train speed, a station stop or the timetable: that is the score the server asks for
      void postEvent('start', share.sessionId, { score: Math.max(3, ride.score) });
    }
    void postEvent('fix', share.sessionId, {
      lat: loc.coords.latitude,
      lng: loc.coords.longitude,
      acc: loc.coords.accuracy ?? 99,
      spd: Math.max(0, loc.coords.speed ?? 0),
      hdg: loc.coords.heading ?? 0,
      ts: loc.timestamp,
    });
  }
}

// no background tasks on the web build; never let a missing native module break app start
const canDefine = (name: string): boolean => {
  if (Platform.OS === 'web') return false;
  try {
    return !TaskManager.isTaskDefined(name);
  } catch {
    return false;
  }
};

if (canDefine(GEOFENCE_TASK)) {
  TaskManager.defineTask<{ eventType: Location.GeofencingEventType; region: Location.LocationRegion }>(GEOFENCE_TASK, async ({ data, error }) => {
    if (error || !data) return;
    if (!(await settings()).autoRideBackground) return;
    // entering a station area wakes the detector; leaving is handled by the detector itself (it goes IDLE, then stops)
    if (data.eventType === Location.GeofencingEventType.Enter) await startUpdates();
  });
}

if (canDefine(RIDE_TASK)) {
  TaskManager.defineTask<{ locations: Location.LocationObject[] }>(RIDE_TASK, async ({ data, error }) => {
    if (error || !data?.locations?.length) return;
    if (!(await settings()).autoRideBackground) {
      await stopUpdates();
      return;
    }
    // with the app open, the foreground detector does this work (and shares through the live connection)
    if (AppState.currentState === 'active') return;
    for (const loc of [...data.locations].sort((a, b) => a.timestamp - b.timestamp)) await onFix(loc);
  });
}

/**
 * Turn background detection on: needs "Always" location. Returns false when the permission is not given
 * (the caller explains and offers the settings page).
 */
export async function enableBackgroundRide(): Promise<boolean> {
  try {
    const fg = await Location.requestForegroundPermissionsAsync();
    if (!fg.granted) return false;
    const bg = await Location.requestBackgroundPermissionsAsync();
    if (!bg.granted) return false;
    if (!(await TaskManager.isAvailableAsync())) return false;
    await Location.startGeofencingAsync(
      GEOFENCE_TASK,
      OPEN.map((s) => ({ identifier: s.id, latitude: s.lat as number, longitude: s.lng as number, radius: 200, notifyOnEnter: true, notifyOnExit: true })),
    );
    return true;
  } catch {
    return false;
  }
}

/** Turn it off: no geofences, no location updates. */
export async function disableBackgroundRide(): Promise<void> {
  await stopUpdates().catch(() => undefined);
  if (await Location.hasStartedGeofencingAsync(GEOFENCE_TASK).catch(() => false)) await Location.stopGeofencingAsync(GEOFENCE_TASK).catch(() => undefined);
}
