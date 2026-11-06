// Client-side smooth train motion (spec §6.6): extrapolate s = s0 + v·dt and
// blend toward each new server value over 500 ms — never teleport.

export const BLEND_MS = 500;

export interface Kinematics {
  /** chainage at `ts` */
  s0: number;
  /** m/s along chainage */
  v: number;
  ts: number;
  /** value displayed when the update arrived (blend origin), at blendStart */
  fromS?: number;
  blendStart?: number;
  /** clamp so extrapolation stops at the next station when a dwell is expected */
  clampS?: number;
}

function extrapolate(k: Kinematics, now: number): number {
  let s = k.s0 + (k.v * (now - k.ts)) / 1000;
  if (k.clampS != null) s = k.v >= 0 ? Math.min(s, k.clampS) : Math.max(s, k.clampS);
  return s;
}

export function displayedS(k: Kinematics, now: number): number {
  const target = extrapolate(k, now);
  if (k.fromS == null || k.blendStart == null) return target;
  const t = Math.min(1, (now - k.blendStart) / BLEND_MS);
  if (t >= 1) return target;
  const origin = k.fromS + (k.v * (now - k.blendStart)) / 1000;
  const e = t * t * (3 - 2 * t); // smoothstep
  return origin + (target - origin) * e;
}

export function applyServerUpdate(prev: Kinematics | undefined, s: number, v: number, now: number, clampS?: number): Kinematics {
  const shown = prev ? displayedS(prev, now) : undefined;
  return { s0: s, v, ts: now, fromS: shown, blendStart: shown == null ? undefined : now, clampS };
}
