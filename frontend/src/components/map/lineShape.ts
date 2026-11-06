// Line-6 shape for the SVG map, projected from the real OpenStreetMap track
// (data/line6.json, built by backend/cmd/fetch-osm). Equirectangular with a
// cos(lat) correction — accurate to well under 1 % over the 19 km line.
import line from '@/data/line6.json';

export const VIEW_W = 400;
export const VIEW_H = 820;
const PAD = 60;

const coords = line.geometry.coordinates as [number, number][];
const lats = coords.map((c) => c[1]);
const lngs = coords.map((c) => c[0]);
const midLat = (Math.min(...lats) + Math.max(...lats)) / 2;
const kx = Math.cos((midLat * Math.PI) / 180);
const w = (Math.max(...lngs) - Math.min(...lngs)) * kx;
const h = Math.max(...lats) - Math.min(...lats);
const scale = Math.min((VIEW_W - 2 * PAD) / w, (VIEW_H - 2 * PAD) / h);
const offX = (VIEW_W - w * scale) / 2;
const offY = (VIEW_H - h * scale) / 2;

/** lng/lat → SVG viewBox coordinates (north up). */
export function project(lng: number, lat: number): [number, number] {
  return [offX + (lng - Math.min(...lngs)) * kx * scale, offY + (Math.max(...lats) - lat) * scale];
}

const PATH = coords.map(([lng, lat]) => project(lng, lat));
const cum: number[] = [0];
for (let i = 1; i < PATH.length; i++) {
  cum[i] = cum[i - 1] + Math.hypot(PATH[i][0] - PATH[i - 1][0], PATH[i][1] - PATH[i - 1][1]);
}
const TOTAL = cum[cum.length - 1];

export interface XY {
  x: number;
  y: number;
  /** bearing in degrees, 0 = up/north, clockwise */
  bearing: number;
}

/** Point at fraction f ∈ [0,1] of chainage (0 = Uttara North, 1 = Motijheel). */
export function pointAt(f: number): XY {
  const d = Math.max(0, Math.min(1, f)) * TOTAL;
  let i = 1;
  while (i < PATH.length - 1 && cum[i] < d) i++;
  const seg = cum[i] - cum[i - 1];
  const t = seg === 0 ? 0 : (d - cum[i - 1]) / seg;
  const [ax, ay] = PATH[i - 1];
  const [bx, by] = PATH[i];
  const bearing = (Math.atan2(bx - ax, -(by - ay)) * 180) / Math.PI;
  return { x: ax + t * (bx - ax), y: ay + t * (by - ay), bearing };
}

export const pathD = PATH.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
