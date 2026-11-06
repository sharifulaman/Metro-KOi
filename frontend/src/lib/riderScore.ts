// "Is this person really on the train?" (spec §6.2). Pure.
import type { RiderSignals, StopReason } from '../models';

export const SHARE_THRESHOLD = 3;

export function scoreSignals(s: RiderSignals): number {
  if (!s.confirmed) return 0;
  return [s.nearLineFor20s, s.trainSpeedSeen, s.stationDwellPattern, s.smoothMotion, s.startedInStation].filter(Boolean).length;
}

export function canShare(s: RiderSignals): boolean {
  return s.confirmed && scoreSignals(s) >= SHARE_THRESHOLD;
}

/** A fix already snapped to the line (needs OSM geometry). */
export interface SnappedSample {
  ts: number;
  chainageM: number;
  offsetM: number;
  speedMps: number;
}

export function detectSignals(
  samples: SnappedSample[],
  stationChainages: number[],
  startedInStation: boolean,
  accelVariance: number | null,
): Omit<RiderSignals, 'confirmed'> {
  const near = samples.filter((p) => p.offsetM <= 25);
  const nearLineFor20s = near.length > 1 && near[near.length - 1].ts - near[0].ts >= 20000;
  const atStation = (c: number) => stationChainages.some((x) => Math.abs(x - c) <= 80);
  const trainSpeedSeen = samples.some((p) => p.speedMps * 3.6 >= 40 && p.speedMps * 3.6 <= 85 && !atStation(p.chainageM));

  // Dwell stops of 20–45 s only at station chainages.
  let stationDwellPattern = false;
  let stopStartBetween = false;
  let runStart: SnappedSample | null = null;
  for (const p of samples) {
    if (p.speedMps < 1) {
      runStart ??= p;
    } else if (runStart) {
      const dur = (p.ts - runStart.ts) / 1000;
      if (atStation(runStart.chainageM)) {
        if (dur >= 20 && dur <= 45) stationDwellPattern = true;
      } else if (dur >= 5) {
        stopStartBetween = true;
      }
      runStart = null;
    }
  }
  if (stopStartBetween) stationDwellPattern = false;
  const smoothMotion = accelVariance != null && accelVariance < 0.6 && !stopStartBetween;
  return { nearLineFor20s, trainSpeedSeen, stationDwellPattern, smoothMotion, startedInStation };
}

/** Auto-stop rules (spec §6.2). */
export function autoStopReason(args: {
  outsideCorridorSec: number;
  stationaryAwayFromStationSec: number;
  sessionSec: number;
  atTerminal: boolean;
}): StopReason | null {
  if (args.outsideCorridorSec >= 30) return 'left_corridor';
  if (args.stationaryAwayFromStationSec > 180) return 'stationary';
  if (args.sessionSec > 90 * 60) return 'timeout';
  if (args.atTerminal) return 'terminal';
  return null;
}
