import { estimatedTrains, type RunModel } from '@/lib/schedule';
import type { TimetableFile } from '@/models';

/** a scheduled train counts as "this train" within this distance of the rider (≈ 90 s at line speed) */
const MATCH_M = 900;
/** The scheduled train nearest the rider in that direction, if it is close enough to be the one they are on. */
export function matchScheduled(tt: TimetableFile, model: RunModel, dir: 'SB' | 'NB', s: number, ts: number): string | null {
  let best: string | null = null;
  let bestD = MATCH_M;
  for (const e of estimatedTrains(tt, model, ts)) {
    if (e.dir !== dir) continue;
    const d = Math.abs(e.s - s);
    if (d <= bestD) {
      best = e.id;
      bestD = d;
    }
  }
  return best;
}
