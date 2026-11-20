// Edge function "fuse": the live-train server (realtime hub + fusion tick).
//
// pg_cron calls it every minute. Each invocation takes a lock, loads the engine state, then loops for ~55 s:
//   read new rows from rider_events -> feed the fusion engine -> tick -> broadcast on the Realtime channel "live".
// The state is saved to fusion_state periodically and at the end, so the next invocation continues seamlessly.
// Clients (the app) only ever insert into rider_events and listen to the "live" channel / read `trains`.

import { LINE_DATA } from './data.ts';
import { Engine, emptyState, type EngineState, type WireTrain } from './engine.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const FUSE_SECRET = Deno.env.get('FUSE_SECRET') ?? '';

const RUN_MS = 55_000; // how long one invocation keeps ticking
const LOCK_MS = 75_000; // a crashed invocation frees the lock after this
const TICK_MS = 2_000;
const SYNC_MS = 10_000; // save state + refresh the `trains` snapshot table

const H = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' };

async function rest(path: string, init: RequestInit = {}): Promise<Response> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...init, headers: { ...H, ...(init.headers as Record<string, string>) } });
  if (!res.ok) throw new Error(`${init.method ?? 'GET'} ${path} -> ${res.status} ${await res.text()}`);
  return res;
}

async function broadcast(messages: { event: string; payload: unknown }[]): Promise<void> {
  if (!messages.length) return;
  const res = await fetch(`${SUPABASE_URL}/realtime/v1/api/broadcast`, {
    method: 'POST',
    headers: H,
    body: JSON.stringify({ messages: messages.map((m) => ({ topic: 'live', event: m.event, payload: m.payload, private: false })) }),
  });
  if (!res.ok) console.error('broadcast failed', res.status, await res.text());
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const num = (v: unknown, fallback = NaN) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);

interface EventRow {
  id: number;
  kind: 'start' | 'fix' | 'stop' | 'report';
  session_id: string;
  device_id: string | null;
  payload: Record<string, unknown>;
  created_at: string;
}

async function syncTrains(snapshot: WireTrain[]): Promise<void> {
  if (snapshot.length) {
    await rest('trains?on_conflict=id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(snapshot.map((t) => ({ id: t.id, data: t, updated_at: new Date().toISOString() }))),
    });
    const ids = snapshot.map((t) => `"${t.id}"`).join(',');
    await rest(`trains?id=not.in.(${ids})`, { method: 'DELETE' });
  } else {
    await rest('trains?id=not.is.null', { method: 'DELETE' });
  }
}

async function saveState(state: EngineState, lastEventId: number): Promise<void> {
  await rest('fusion_state?id=eq.1', {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ state, last_event_id: lastEventId }),
  });
}

async function run(): Promise<Record<string, unknown>> {
  const begin = Date.now();
  // take the lock; if another invocation holds it, do nothing
  const lock = await rest(`fusion_state?id=eq.1&lock_until=lt.${encodeURIComponent(new Date().toISOString())}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ lock_until: new Date(begin + LOCK_MS).toISOString() }),
  });
  const rows = (await lock.json()) as { state: EngineState; last_event_id: number }[];
  if (!rows.length) return { skipped: 'locked' };

  const engine = new Engine(LINE_DATA, rows[0].state && rows[0].state.sessions ? rows[0].state : emptyState());
  let lastId = Number(rows[0].last_event_id) || 0;
  let lastSync = 0;
  let ticks = 0;
  let events = 0;

  try {
    while (Date.now() - begin < RUN_MS) {
      const evRes = await rest(`rider_events?id=gt.${lastId}&order=id.asc&limit=500`);
      const evs = (await evRes.json()) as EventRow[];
      const out: { event: string; payload: unknown }[] = [];
      for (const ev of evs) {
        lastId = ev.id;
        events++;
        const recv = Date.parse(ev.created_at);
        const p = ev.payload ?? {};
        if (ev.kind === 'start') {
          const r = engine.startSession(ev.session_id, ev.device_id ?? '', num(p.score, 0), recv);
          out.push({ event: 'ack', payload: { sessionId: ev.session_id, ok: r === 'ok' } });
        } else if (ev.kind === 'fix') {
          const f = { sessionId: ev.session_id, lat: num(p.lat), lng: num(p.lng), acc: num(p.acc, 99), spd: num(p.spd, 0), hdg: num(p.hdg, 0), ts: num(p.ts, recv) };
          if (Number.isFinite(f.lat) && Number.isFinite(f.lng)) engine.ingest(f, recv);
        } else if (ev.kind === 'stop') {
          engine.stopSession(ev.session_id);
        }
      }
      const now = Date.now();
      const d = engine.tick(now);
      ticks++;
      if (d.updated.length || d.removed.length) out.push({ event: 'trains', payload: { ts: now, updated: d.updated, removed: d.removed } });
      await broadcast(out);
      if (d.removed.length && !d.updated.length) await syncTrains(engine.snapshot(now));
      if (now - lastSync >= SYNC_MS) {
        lastSync = now;
        await syncTrains(engine.snapshot(now));
        await saveState(engine.st, lastId);
      }
      await sleep(TICK_MS);
    }
  } finally {
    // always persist and release the lock, even after an error
    try {
      await saveState(engine.st, lastId);
      await syncTrains(engine.snapshot(Date.now()));
    } catch (e) {
      console.error('final save failed', e);
    }
    await rest('fusion_state?id=eq.1', { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ lock_until: new Date(0).toISOString() }) }).catch(() => {});
  }
  return { ticks, events, sessions: Object.keys(engine.st.sessions).length, tracks: Object.keys(engine.st.tracks).length };
}

Deno.serve(async (req) => {
  if (FUSE_SECRET && req.headers.get('x-fuse-secret') !== FUSE_SECRET) return new Response('unauthorized', { status: 401 });
  try {
    return Response.json(await run());
  } catch (e) {
    console.error(e);
    return Response.json({ error: String(e) }, { status: 500 });
  }
});
