// Realtime client on Supabase (see supabase/README.md).
//   server -> phone: Realtime Broadcast channel "live" ("trains" deltas, "ack" for rider.start) + the `trains`
//                    table for the snapshot a phone loads when it connects.
//   phone -> server: rows inserted into `rider_events` (rider.start / rider.fix / rider.stop / report.station).
// It speaks the same ClientMessage / ServerMessage protocol as LiveClient, so the stores and screens do not change.
import 'react-native-url-polyfill/auto';

import { createClient, type RealtimeChannel, type SupabaseClient } from '@supabase/supabase-js';

import type { ClientMessage, ConnectionState, Lang, ServerMessage, WireTrain } from '../models';

/** What the app needs from a realtime connection. */
export interface LiveTransport {
  start(): void;
  stop(): void;
  setLang(lang: Lang): void;
  send(msg: ClientMessage): void;
}

export interface LiveClientOptions {
  deviceId: string;
  lang: Lang;
  onMessage(msg: ServerMessage): void;
  onState(state: ConnectionState): void;
}

export interface SupabaseLiveOptions extends LiveClientOptions {
  supabaseUrl: string;
  anonKey: string;
}

interface TrainsPayload {
  ts: number;
  updated: WireTrain[];
  removed: string[];
}

export class SupabaseLiveClient implements LiveTransport {
  private sb: SupabaseClient | null = null;
  private ch: RealtimeChannel | null = null;
  private live = false;
  private stopped = true;
  private viewers = 1;
  /** sessions this phone opened: acks for other riders' sessions are ignored */
  private mine = new Set<string>();

  constructor(private opts: SupabaseLiveOptions) {}

  start(): void {
    if (!this.stopped) return;
    this.stopped = false;
    this.opts.onState('offline');
    const sb = createClient(this.opts.supabaseUrl, this.opts.anonKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      realtime: { params: { eventsPerSecond: 10 } },
    });
    this.sb = sb;
    const ch = sb.channel('live', { config: { broadcast: { self: false }, presence: { key: this.opts.deviceId } } });
    this.ch = ch;

    ch.on('broadcast', { event: 'trains' }, ({ payload }) => {
      const p = payload as TrainsPayload;
      for (const train of p.updated ?? []) this.opts.onMessage({ t: 'train.update', train });
      for (const id of p.removed ?? []) this.opts.onMessage({ t: 'train.remove', id });
    });
    ch.on('broadcast', { event: 'ack' }, ({ payload }) => {
      const p = payload as { sessionId: string; ok: boolean };
      if (p?.ok && this.mine.has(p.sessionId)) {
        this.opts.onMessage({ t: 'rider.ack', sessionId: p.sessionId, helping: Math.max(0, this.viewers - 1) });
      }
    });
    ch.on('presence', { event: 'sync' }, () => {
      this.viewers = Math.max(1, Object.keys(ch.presenceState()).length);
    });

    ch.subscribe((status) => {
      if (this.stopped || this.ch !== ch) return;
      if (status === 'SUBSCRIBED') {
        this.live = true;
        this.opts.onState('live'); // the store bumps `epoch`, which makes an active ride re-send rider.start
        void ch.track({ at: Date.now() });
        void this.loadSnapshot();
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        this.live = false;
        this.opts.onState('reconnecting'); // supabase-js rejoins by itself and reports SUBSCRIBED again
      }
    });
  }

  stop(): void {
    this.stopped = true;
    this.live = false;
    const sb = this.sb;
    this.ch = null;
    this.sb = null;
    void sb?.removeAllChannels();
    this.opts.onState('offline');
  }

  setLang(lang: LiveClientOptions['lang']): void {
    this.opts.lang = lang;
  }

  send(msg: ClientMessage): void {
    if (!this.sb || !this.live) return; // the ride keeps running locally; sharing resumes once we are live again
    switch (msg.t) {
      case 'hello':
        return;
      case 'rider.start':
        this.mine.add(msg.sessionId);
        return this.insert('start', msg.sessionId, { score: msg.score });
      case 'rider.fix':
        return this.insert('fix', msg.sessionId, { lat: msg.lat, lng: msg.lng, acc: msg.acc, spd: msg.spd, hdg: msg.hdg, ts: msg.ts });
      case 'rider.stop':
        this.mine.delete(msg.sessionId);
        return this.insert('stop', msg.sessionId, {});
      case 'report.station':
        return this.insert('report', this.opts.deviceId, { stationId: msg.stationId, direction: msg.direction, ts: msg.ts });
    }
  }

  private insert(kind: 'start' | 'fix' | 'stop' | 'report', sessionId: string, payload: Record<string, unknown>): void {
    void this.sb
      ?.from('rider_events')
      .insert({ kind, session_id: sessionId, device_id: this.opts.deviceId, payload })
      .then(({ error }) => {
        if (error && __DEV__) console.warn('[live] rider_events insert failed:', error.message);
      });
  }

  private async loadSnapshot(): Promise<void> {
    try {
      const { data, error } = await this.sb!.from('trains').select('data');
      if (error || !data || this.stopped) return;
      const msg: ServerMessage = { t: 'trains.snapshot', ts: Date.now(), trains: data.map((r) => r.data as WireTrain) };
      this.opts.onMessage(msg);
    } catch {
      // the next broadcast fills the map in anyway
    }
  }
}
