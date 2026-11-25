import { geoAt } from '@/lib/lineGeo';
import type { Palette } from '@/theme/tokens';

import { STATION_SIZE_M } from './stationSprite';
import type { GoogleMapViewProps } from './types';

/** `zoom` that frames a station and its neighbours (street level on Google's scale). */
export const ZOOM_NEAR = 5.4;

/** Everything the Google Maps page needs to draw one frame; sent to it as JSON on every change. */
export interface MapPayload {
  dark: boolean;
  errorText: string;
  theme: Pick<Palette, 'bg' | 'surface' | 'ink' | 'inkMuted' | 'brand' | 'brandDeep' | 'onBrand' | 'live' | 'liveTint' | 'onLiveTint' | 'estimated' | 'trainSB' | 'trainNB' | 'mapGround' | 'mapRoad'>;
  stations: { id: string; label: string; lat: number; lng: number; terminal: boolean; bearing: number; gated: boolean }[];
  trains: { id: string; dir: 'SB' | 'NB'; state: string; f: number; lat: number; lng: number; heading: number; label?: string; women?: string; callout?: { title: string; rows: [string, string][] }; timer?: string; progress?: number }[];
  hints: GoogleMapViewProps['hints'] | null;
  womenLabel: string | null;
  platformSigns: { SB: string; NB: string } | null;
  /** 2D: the selected station's platform signs, one each side of the track (the 3D scene draws its own) */
  platforms: { id: 'SB' | 'NB'; label: string; color: string; lat: number; lng: number }[];
  realMap: boolean;
  /** app language: names on the 3D map (streets, landmarks) follow it */
  lang?: string;
  gates: { id: string; letter: string; label: string; lat: number; lng: number }[];
  selectedGate?: string;
  user: { lat: number; lng: number; accuracy: number; heading: number | null } | null;
  walk: { lat: number; lng: number } | null;
  /** the trip, sampled along the track in travel order */
  route: { lat: number; lng: number }[] | null;
  selectedStation?: string;
  selectedTrain?: string;
  view: {
    /** tilted 3D view */
    tilt: boolean;
    /** top-down, north-up (the offline stand-in for the Google 2D map) */
    flat?: boolean;
    /** compass heading for the 3D view (looks along the line) */
    heading: number;
    /** 2D heading-up: turn the map with the phone */
    rotate: boolean;
    mode: 'fit' | 'focus';
    lat: number;
    lng: number;
    /** points the whole-line view frames instead of the entire line (the trip) */
    fit: { lat: number; lng: number }[] | null;
    /** Google zoom level (focus mode) */
    zoom: number;
    /** px covered by floating UI at the top / by the sheet at the bottom */
    top: number;
    bottom: number;
    /** px to the right of centre for the focused point */
    shiftX: number;
    key: string;
  };
}

/**
 * When a station's gates are on the map, its model sits in the middle of them and runs along their long
 * axis, so the gates land on the model's corners (the OSM track point can be metres off the building).
 * Gate ids are `<stationId>:<letter>`; needs at least 3 gates, otherwise the track point is kept.
 */
function gateFrame(stationId: string, gates: GoogleMapViewProps['gates'], along: { lat: number; lng: number; bearing: number }) {
  const pts = (gates ?? []).filter((g) => g.id.startsWith(stationId + ':'));
  if (pts.length < 3) return along;
  const lat = pts.reduce((a, g) => a + g.lat, 0) / pts.length;
  const lng = pts.reduce((a, g) => a + g.lng, 0) / pts.length;
  // principal axis of the gate points, in local metres (x east, y north)
  const kx = Math.cos((lat * Math.PI) / 180);
  let sxx = 0, syy = 0, sxy = 0;
  for (const g of pts) {
    const x = (g.lng - lng) * kx, y = g.lat - lat;
    sxx += x * x; syy += y * y; sxy += x * y;
  }
  let bearing = along.bearing;
  if (sxx + syy > 0) {
    const theta = 0.5 * Math.atan2(2 * sxy, sxx - syy); // angle of the long axis from east, counter-clockwise
    const axis = (90 - (theta * 180) / Math.PI + 360) % 180; // as a compass bearing, 0..180
    // of the two directions along the axis, keep the one nearest the track's direction
    const diff = ((axis - along.bearing) % 360 + 540) % 360 - 180;
    bearing = Math.abs(diff) <= 90 ? axis : (axis + 180) % 360;
  }
  return { lat, lng, bearing, fromGates: true as const };
}

const M_PER_DEG = 111320;
/** how far in from the model's sides / ends the gate letters sit, in metres */
const GATE_INSET = { across: 13, along: 30 };

/**
 * Where a gate's pin is drawn: inside its station's model, in the corner on the gate's real side
 * (left/right of the track, front/back end). Display only; the compass and walk use the real point.
 */
function gateOnModel(g: { id: string; lat: number; lng: number }, gates: GoogleMapViewProps['gates'], stations: GoogleMapViewProps['stations']) {
  const st = stations.find((s) => g.id.startsWith(s.id + ':'));
  if (!st) return { lat: g.lat, lng: g.lng };
  const fr = gateFrame(st.id, gates, geoAt(st.f));
  if (!('fromGates' in fr)) return { lat: g.lat, lng: g.lng };
  const kx = Math.cos((fr.lat * Math.PI) / 180);
  const b = (fr.bearing * Math.PI) / 180;
  // unit vectors in metres (east, north): along the model, and across it (to its right)
  const ax = Math.sin(b), ay = Math.cos(b), rx = Math.cos(b), ry = -Math.sin(b);
  const x = (g.lng - fr.lng) * kx * M_PER_DEG, y = (g.lat - fr.lat) * M_PER_DEG;
  const along = Math.sign(x * ax + y * ay || 1) * (STATION_SIZE_M.l / 2 - GATE_INSET.along);
  const across = Math.sign(x * rx + y * ry || 1) * (STATION_SIZE_M.w / 2 - GATE_INSET.across);
  const ex = along * ax + across * rx, ny = along * ay + across * ry;
  return { lat: fr.lat + ny / M_PER_DEG, lng: fr.lng + ex / (kx * M_PER_DEG) };
}

/**
 * Where the 2D map puts the selected station's platform signs: the same spots as the 3D scene,
 * southbound on the left of the track (towards Motijheel) at the back end, northbound on the right at the front.
 */
const PLATFORM_PIN = { along: 30, across: 19 };
function platformPins(p: GoogleMapViewProps): MapPayload['platforms'] {
  const st = p.platformSigns && p.selectedStation ? p.stations.find((s) => s.id === p.selectedStation) : undefined;
  if (!p.platformSigns || !st) return [];
  const g = geoAt(st.f);
  const b = (g.bearing * Math.PI) / 180;
  const kx = Math.cos((g.lat * Math.PI) / 180);
  const at = (along: number, across: number) => {
    const east = along * Math.sin(b) + across * Math.cos(b), north = along * Math.cos(b) - across * Math.sin(b);
    return { lat: g.lat + north / M_PER_DEG, lng: g.lng + east / (kx * M_PER_DEG) };
  };
  return [
    { id: 'SB', label: p.platformSigns.SB, color: '#1F9D63', ...at(-PLATFORM_PIN.along, -PLATFORM_PIN.across) },
    { id: 'NB', label: p.platformSigns.NB, color: '#2F6FB5', ...at(PLATFORM_PIN.along, PLATFORM_PIN.across) },
  ];
}

export function buildPayload(p: GoogleMapViewProps, c: Palette, dark: boolean, reservedBottom: number): MapPayload {
  const near = (p.zoom ?? 1) > 1 && (p.focus != null || p.focusPoint != null);
  const along = geoAt(near && p.focus != null ? p.focus : 0.5);
  const at = near && p.focusPoint ? { lat: p.focusPoint.lat, lng: p.focusPoint.lng } : along;
  const tilt = !!p.tilt && near;
  // 2D: frame several points at once (the rider and the chosen gate); refits only when `fitKey` changes
  const fitPts = !tilt && p.fitPoints && p.fitPoints.length >= 2 ? p.fitPoints : null;
  const level = Math.max(tilt ? 16 : 11, Math.min(19, 13 + Math.log2(p.zoom ?? 1)));
  const last = p.stations.length - 1;
  let route: { lat: number; lng: number }[] | null = null;
  if (p.route) {
    const { from, to } = p.route;
    const n = Math.max(2, Math.ceil(Math.abs(to - from) * 240));
    route = [];
    for (let i = 0; i <= n; i++) {
      const g = geoAt(from + ((to - from) * i) / n);
      route.push({ lat: +g.lat.toFixed(6), lng: +g.lng.toFixed(6) });
    }
  }
  return {
    dark,
    errorText: p.errorText,
    theme: {
      bg: c.bg,
      surface: c.surface,
      ink: c.ink,
      inkMuted: c.inkMuted,
      brand: c.brand,
      brandDeep: c.brandDeep,
      onBrand: c.onBrand,
      live: c.live,
      liveTint: c.liveTint,
      onLiveTint: c.onLiveTint,
      estimated: c.estimated,
      trainSB: c.trainSB,
      trainNB: c.trainNB,
      mapGround: c.mapGround,
      mapRoad: c.mapRoad,
    },
    stations: p.stations.map((s, i) => {
      const g = gateFrame(s.id, p.gates, geoAt(s.f));
      return { id: s.id, label: s.label, lat: g.lat, lng: g.lng, terminal: i === 0 || i === last, bearing: Math.round(g.bearing), gated: 'fromGates' in g };
    }),
    trains: p.trains.map((t) => {
      const g = geoAt(t.f);
      return {
        id: t.id,
        dir: t.dir,
        state: t.state,
        f: t.f,
        lat: g.lat,
        lng: g.lng,
        // SB runs towards Motijheel (increasing f), NB the other way
        heading: t.dir === 'SB' ? g.bearing : (g.bearing + 180) % 360,
        label: t.label,
        women: t.women,
        callout: t.callout,
        timer: t.dwell?.timer,
        progress: t.dwell?.progress,
      };
    }),
    gates: (p.gates ?? []).map((g) => ({ id: g.id, letter: g.letter, label: g.label, ...gateOnModel(g, p.gates, p.stations) })),
    selectedGate: p.selectedGate,
    hints: p.hints ?? null,
    womenLabel: p.womenLabel ?? null,
    platformSigns: p.platformSigns ?? null,
    platforms: platformPins(p),
    realMap: p.realMap !== false,
    route,
    user: p.user ? { lat: p.user.lat, lng: p.user.lng, accuracy: p.user.accuracy ?? 0, heading: p.user.heading ?? null } : null,
    walk: p.walkTo ?? null,
    selectedStation: p.selectedStation,
    selectedTrain: p.selectedTrain,
    view: {
      tilt,
      heading: Math.round(along.bearing),
      rotate: !!p.headingUp && !tilt,
      mode: fitPts ? 'fit' : near ? 'focus' : 'fit',
      lat: at.lat,
      lng: at.lng,
      fit: fitPts ?? route,
      zoom: level,
      top: p.topInset ?? 0,
      bottom: reservedBottom,
      shiftX: p.focusShiftX ?? 0,
      key: String(p.recenterKey ?? '') + (tilt ? '|3d' : '') + (route ? '|r' + route.length + ':' + route[0].lat + ',' + route[route.length - 1].lat : '') + (fitPts ? '|fp' + (p.fitKey ?? '') : ''),
    },
  };
}
