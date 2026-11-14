import { geoAt } from '@/lib/lineGeo';
import type { Palette } from '@/theme/tokens';

import type { GoogleMapViewProps } from './types';

/** `zoom` that frames a station and its neighbours (street level on Google's scale). */
export const ZOOM_NEAR = 5.4;

/** Everything the Google Maps page needs to draw one frame; sent to it as JSON on every change. */
export interface MapPayload {
  dark: boolean;
  errorText: string;
  theme: Pick<Palette, 'bg' | 'surface' | 'ink' | 'inkMuted' | 'brand' | 'brandDeep' | 'onBrand' | 'live' | 'liveTint' | 'onLiveTint' | 'estimated' | 'trainSB' | 'trainNB' | 'mapGround' | 'mapRoad'>;
  stations: { id: string; label: string; lat: number; lng: number; terminal: boolean }[];
  trains: { id: string; dir: 'SB' | 'NB'; state: string; lat: number; lng: number; heading: number; label?: string; timer?: string; progress?: number }[];
  user: { lat: number; lng: number; accuracy: number } | null;
  /** the trip, sampled along the track in travel order */
  route: { lat: number; lng: number }[] | null;
  selectedStation?: string;
  selectedTrain?: string;
  view: {
    /** tilted 3D view */
    tilt: boolean;
    /** compass heading for the 3D view (looks along the line) */
    heading: number;
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

export function buildPayload(p: GoogleMapViewProps, c: Palette, dark: boolean, reservedBottom: number): MapPayload {
  const near = (p.zoom ?? 1) > 1 && (p.focus != null || p.focusPoint != null);
  const along = geoAt(near && p.focus != null ? p.focus : 0.5);
  const at = near && p.focusPoint ? { lat: p.focusPoint.lat, lng: p.focusPoint.lng } : along;
  const tilt = !!p.tilt && near;
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
      const g = geoAt(s.f);
      return { id: s.id, label: s.label, lat: g.lat, lng: g.lng, terminal: i === 0 || i === last };
    }),
    trains: p.trains.map((t) => {
      const g = geoAt(t.f);
      return {
        id: t.id,
        dir: t.dir,
        state: t.state,
        lat: g.lat,
        lng: g.lng,
        // SB runs towards Motijheel (increasing f), NB the other way
        heading: t.dir === 'SB' ? g.bearing : (g.bearing + 180) % 360,
        label: t.label,
        timer: t.dwell?.timer,
        progress: t.dwell?.progress,
      };
    }),
    route,
    user: p.user ? { lat: p.user.lat, lng: p.user.lng, accuracy: p.user.accuracy ?? 0 } : null,
    selectedStation: p.selectedStation,
    selectedTrain: p.selectedTrain,
    view: {
      tilt,
      heading: Math.round(along.bearing),
      mode: near ? 'focus' : 'fit',
      lat: at.lat,
      lng: at.lng,
      fit: route,
      zoom: level,
      top: p.topInset ?? 0,
      bottom: reservedBottom,
      shiftX: p.focusShiftX ?? 0,
      key: String(p.recenterKey ?? '') + (tilt ? '|3d' : '') + (route ? '|r' + route.length + ':' + route[0].lat + ',' + route[route.length - 1].lat : ''),
    },
  };
}
