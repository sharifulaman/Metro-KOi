// Line 6 as real coordinates: the OpenStreetMap track (data/line6.json) sampled by
// fraction of its length. Used to place trains and stations on the Google map.
import line from '@/data/line6.json';

type LngLat = [number, number];
const coords = line.geometry.coordinates as LngLat[];

// Equirectangular metres: accurate to well under 1 % over the 19 km line.
const midLat = (Math.min(...coords.map((c) => c[1])) + Math.max(...coords.map((c) => c[1]))) / 2;
const KX = Math.cos((midLat * Math.PI) / 180);
const dist = (a: LngLat, b: LngLat) => Math.hypot((b[0] - a[0]) * KX, b[1] - a[1]);

const cum: number[] = [0];
for (let i = 1; i < coords.length; i++) cum[i] = cum[i - 1] + dist(coords[i - 1], coords[i]);
const TOTAL = cum[cum.length - 1];

export interface GeoPoint {
  lat: number;
  lng: number;
  /** degrees clockwise from north, in the direction of increasing `f` (Uttara North → Motijheel) */
  bearing: number;
}

/** Point at fraction f ∈ [0,1] along the line (0 = Uttara North, 1 = Motijheel). */
export function geoAt(f: number): GeoPoint {
  const d = Math.max(0, Math.min(1, f)) * TOTAL;
  let i = 1;
  while (i < coords.length - 1 && cum[i] < d) i++;
  const seg = cum[i] - cum[i - 1];
  const t = seg === 0 ? 0 : (d - cum[i - 1]) / seg;
  const [ax, ay] = coords[i - 1];
  const [bx, by] = coords[i];
  const bearing = (Math.atan2((bx - ax) * KX, by - ay) * 180) / Math.PI;
  return { lng: ax + t * (bx - ax), lat: ay + t * (by - ay), bearing: (bearing + 360) % 360 };
}

/** The whole track as [lat, lng] pairs, for the polyline. */
export const LINE_PATH: [number, number][] = coords.map(([lng, lat]) => [lat, lng]);
