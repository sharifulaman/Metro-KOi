import { create } from 'zustand';

import type { RiderPhase, RiderSession, StopReason } from '@/models';

interface RiderState {
  phase: RiderPhase;
  session: RiderSession | null;
  permissionDenied: boolean;
  setPhase(p: RiderPhase): void;
  begin(session: RiderSession): void;
  update(patch: Partial<RiderSession>): void;
  end(reason: StopReason): void;
  setPermissionDenied(v: boolean): void;
  reset(): void;
}

export const useRider = create<RiderState>()((set) => ({
  phase: 'idle',
  session: null,
  permissionDenied: false,
  setPhase: (phase) => set({ phase }),
  begin: (session) => set({ session, phase: 'active' }),
  update: (patch) => set((s) => (s.session ? { session: { ...s.session, ...patch } } : {})),
  end: (stopReason) => set((s) => ({ phase: 'ended', session: s.session ? { ...s.session, stopReason } : null })),
  setPermissionDenied: (permissionDenied) => set({ permissionDenied }),
  reset: () => set({ phase: 'idle', session: null }),
}));
