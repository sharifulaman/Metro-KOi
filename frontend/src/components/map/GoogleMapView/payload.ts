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
  selectedStation?: string;
  selectedTrain?: string;
  view: {
    mode: 'fit' | 'focus';
    lat: number;
    lng: number;
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
  const near = (p.zoom ?? 1) > 1 && p.focus != null;
  const at = geoAt(near ? (p.focus as number) : 0.5);
  const level = Math.max(11, Math.min(18, 13 + Math.log2(p.zoom ?? 1)));
  const last = p.stations.length - 1;
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
    selectedStation: p.selectedStation,
    selectedTrain: p.selectedTrain,
    view: {
      mode: near ? 'focus' : 'fit',
      lat: at.lat,
      lng: at.lng,
      zoom: level,
      top: p.topInset ?? 0,
      bottom: reservedBottom,
      shiftX: p.focusShiftX ?? 0,
      key: String(p.recenterKey ?? ''),
    },
  };
}
