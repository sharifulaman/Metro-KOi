// Geometry helpers (spec §6.1, §6.6). Pure.
import type { Corner, Gate, StationGate } from '../models';

const R = 6371008.8;
const rad = (d: number) => (d * Math.PI) / 180;

export function haversineM(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const dLat = rad(bLat - aLat);
  const dLng = rad(bLng - aLng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function bearingDeg(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const y = Math.sin(rad(bLng - aLng)) * Math.cos(rad(bLat));
  const x = Math.cos(rad(aLat)) * Math.sin(rad(bLat)) - Math.sin(rad(aLat)) * Math.cos(rad(bLat)) * Math.cos(rad(bLng - aLng));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/** Lookup table: polyline sampled every `stepM` metres (spec §6.6). */
export interface LineLookup {
  stepM: number;
  lengthM: number;
  points: { lat: number; lng: number; bearing: number }[];
}

export function buildLookup(coords: [number, number][], stepM = 5): LineLookup {
  const cum: number[] = [0];
  for (let i = 1; i < coords.length; i++) {
    cum[i] = cum[i - 1] + haversineM(coords[i - 1][1], coords[i - 1][0], coords[i][1], coords[i][0]);
  }
  const lengthM = cum[cum.length - 1];
  const points: LineLookup['points'] = [];
  let seg = 1;
  for (let s = 0; s <= lengthM; s += stepM) {
    while (seg < coords.length - 1 && cum[seg] < s) seg++;
    const f = (s - cum[seg - 1]) / Math.max(1e-6, cum[seg] - cum[seg - 1]);
    const [aLng, aLat] = coords[seg - 1];
    const [bLng, bLat] = coords[seg];
    points.push({ lat: aLat + f * (bLat - aLat), lng: aLng + f * (bLng - aLng), bearing: bearingDeg(aLat, aLng, bLat, bLng) });
  }
  return { stepM, lengthM, points };
}

export function sampleAt(lu: LineLookup, s: number): LineLookup['points'][number] {
  const i = Math.max(0, Math.min(lu.points.length - 1, Math.round(s / lu.stepM)));
  return lu.points[i];
}

/** Nearest gate by straight-line distance (MVP rule, spec §18.2). */
export function nearestGate(gates: StationGate[], lat: number, lng: number): Gate | undefined {
  let best: { g: Gate; d: number } | undefined;
  for (const g of gates) {
    if (g.lat == null || g.lng == null) continue;
    const d = haversineM(lat, lng, g.lat, g.lng);
    if (!best || d < best.d) best = { g: g.gate, d };
  }
  return best?.g;
}

/** West pair A,C / east pair B,D (spec §19.2). */
export function cornerSide(c: Corner): { ns: 'N' | 'S'; ew: 'E' | 'W' } {
  return { ns: c[0] as 'N' | 'S', ew: c[1] as 'E' | 'W' };
}
