import { create } from 'zustand';

/**
 * Timetable playback: a virtual clock that runs the official schedule at a
 * chosen time and speed, so trains can be watched moving station to station
 * without location access or live riders (for example at night). Not persisted.
 */
export interface Playback {
  /** virtual time (ms epoch) at `realAnchor` */
  simAnchor: number;
  realAnchor: number;
  /** 1 = real time, 10 = ten times faster */
  rate: number;
}

export const PLAYBACK_RATES = [1, 10, 60] as const;

export function simNow(p: Playback | null, real = Date.now()): number {
  return p ? p.simAnchor + (real - p.realAnchor) * p.rate : real;
}

interface ClockState {
  playback: Playback | null;
  start(simMs: number, rate?: number): void;
  setRate(rate: number): void;
  stop(): void;
}

export const useClock = create<ClockState>((set, get) => ({
  playback: null,
  start: (simMs, rate = 10) => set({ playback: { simAnchor: simMs, realAnchor: Date.now(), rate } }),
  setRate: (rate) => {
    const p = get().playback;
    if (!p) return;
    set({ playback: { simAnchor: simNow(p), realAnchor: Date.now(), rate } });
  },
  stop: () => set({ playback: null }),
}));
