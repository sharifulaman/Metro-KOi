import { create } from 'zustand';

import { applyServerUpdate, type Kinematics } from '@/lib/interpolate';
import { useRider } from './rider';
import type { ConnectionState, Notice, ServerMessage, Train, WireTrain } from '@/models';

interface LiveState {
  connection: ConnectionState;
  /** Rider-sourced trains from the server, keyed by id. */
  trains: Record<string, Train>;
  kin: Record<string, Kinematics>;
  notice: Notice | null;
  helping: number;
  /** +1 every time a (re)connection opens: the server forgets sessions of a dropped connection */
  epoch: number;
  setConnection(c: ConnectionState): void;
  handle(msg: ServerMessage): void;
}

function toTrain(w: WireTrain, ts: number): Train {
  return {
    id: w.id,
    dir: w.dir,
    s: w.s,
    v: w.v,
    lat: w.lat ?? null,
    lng: w.lng ?? null,
    hdg: w.hdg ?? null,
    state: w.state,
    riders: w.riders,
    nextStation: w.nextStation ?? null,
    etaSec: w.etaSec ?? null,
    sched: w.sched ?? null,
    delaySec: w.delaySec ?? null,
    ts,
  };
}

export const useLive = create<LiveState>()((set) => ({
  connection: 'offline',
  trains: {},
  kin: {},
  notice: null,
  helping: 0,
  epoch: 0,
  setConnection: (connection) => set((st) => ({ connection, epoch: connection === 'live' && st.connection !== 'live' ? st.epoch + 1 : st.epoch })),
  handle: (msg) =>
    set((st) => {
      const now = Date.now();
      switch (msg.t) {
        case 'trains.snapshot': {
          const trains: Record<string, Train> = {};
          const kin: Record<string, Kinematics> = {};
          for (const w of msg.trains) {
            trains[w.id] = toTrain(w, now);
            kin[w.id] = applyServerUpdate(st.kin[w.id], w.s, w.v, now);
          }
          return { trains, kin };
        }
        case 'train.update':
          return {
            trains: { ...st.trains, [msg.train.id]: toTrain(msg.train, now) },
            kin: { ...st.kin, [msg.train.id]: applyServerUpdate(st.kin[msg.train.id], msg.train.s, msg.train.v, now) },
          };
        case 'train.remove': {
          const { [msg.id]: _t, ...trains } = st.trains;
          const { [msg.id]: _k, ...kin } = st.kin;
          return { trains, kin };
        }
        case 'notice':
          return { notice: { level: msg.level, textBn: msg.textBn, textEn: msg.textEn } };
        case 'rider.ack': {
          // the server answers rider.start (accepted) and rider.stop with an ack
          const s = useRider.getState().session;
          if (s && s.sessionId === msg.sessionId && !s.stopReason) useRider.getState().update({ acked: true });
          return { helping: msg.helping };
        }
        default:
          return {};
      }
    }),
}));
