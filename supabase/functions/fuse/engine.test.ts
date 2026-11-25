// Run: node --test supabase/functions/fuse/engine.test.ts
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { LINE_DATA } from './data.ts';
import { Engine } from './engine.ts';

/**
 * A time when a scheduled train of direction `dir` is at chainage `at` (Sunday 2026-11-22, morning peak), so the timetable backs
 * up a test rider there: the server now needs such evidence (or a station stop, or a second rider) to publish.
 */
function when(dir: 'SB' | 'NB', at: number): number {
  const run = new Engine(LINE_DATA).run;
  const dep = Date.UTC(2026, 10, 22, 2, dir === 'SB' ? 15 : 46, 0); // SB-0815 / NB-0846
  for (let el = 0; el <= run.endToEndSec; el++) {
    const p = run.schedS(dir, el);
    if (p != null && Math.abs(p - at) < 15) return dep + el * 1000;
  }
  throw new Error('no time');
}
const T0 = when('SB', 3000);

/** a fix on the line at chainage s */
function fixAt(e: Engine, id: string, s: number, spd: number, t: number, acc = 5) {
  const p = e.line.pointAt(s);
  return { sessionId: id, lat: p.lat, lng: p.lng, acc, spd, hdg: 0, ts: t };
}

test('line snap round-trips chainage', () => {
  const e = new Engine(LINE_DATA);
  const { chainage, offset } = e.line.snap(e.line.pointAt(5000).lat, e.line.pointAt(5000).lng);
  assert.ok(Math.abs(chainage - 5000) < 1, `chainage ${chainage}`);
  assert.ok(offset < 1);
});

test('one rider moving at train speed becomes a published LIVE train', () => {
  const e = new Engine(LINE_DATA);
  assert.equal(e.startSession('a', 'dev', 4, T0), 'ok');
  let pub = [] as ReturnType<Engine['tick']>['updated'];
  for (let i = 0; i < 12; i++) {
    const t = T0 + i * 3000;
    e.ingest(fixAt(e, 'a', 3000 + i * 3 * 16, 16, t), t);
    pub = e.tick(t).updated;
  }
  assert.equal(pub.length, 1);
  assert.equal(pub[0].dir, 'SB');
  assert.equal(pub[0].state, 'LIVE');
  assert.ok(pub[0].v > 10 && pub[0].v < 22, `v ${pub[0].v}`);
  assert.ok(pub[0].nextStation);
});

test('northbound rider gets direction NB and negative velocity', () => {
  const e = new Engine(LINE_DATA);
  const TN = when('NB', 9000);
  e.startSession('n', 'dev', 4, TN);
  let pub = [] as ReturnType<Engine['tick']>['updated'];
  for (let i = 0; i < 12; i++) {
    const t = TN + i * 3000;
    e.ingest(fixAt(e, 'n', 9000 - i * 3 * 16, 16, t), t);
    pub = e.tick(t).updated;
  }
  assert.equal(pub[0].dir, 'NB');
  assert.ok(pub[0].v < 0);
});

test('two riders on the same train share one track', () => {
  const e = new Engine(LINE_DATA);
  e.startSession('a', 'd1', 4, T0);
  e.startSession('b', 'd2', 4, T0);
  let pub = [] as ReturnType<Engine['tick']>['updated'];
  for (let i = 0; i < 12; i++) {
    const t = T0 + i * 3000;
    e.ingest(fixAt(e, 'a', 3000 + i * 48, 16, t), t);
    e.ingest(fixAt(e, 'b', 3010 + i * 48, 16, t + 1), t + 1500);
    pub = e.tick(t + 1500).updated;
  }
  assert.equal(pub.length, 1);
  assert.equal(pub[0].riders, 2);
});

test('rejections: low accuracy, off the line, stale, too fast, rate', () => {
  const e = new Engine(LINE_DATA);
  e.startSession('a', 'd', 4, T0);
  const ok = fixAt(e, 'a', 3000, 15, T0);
  assert.equal(e.ingest({ ...ok, acc: 80 }, T0).reason, 'accuracy');
  assert.equal(e.ingest({ ...ok, lat: ok.lat + 0.01 }, T0).reason, 'offset');
  assert.equal(e.ingest({ ...ok, ts: T0 - 30_000 }, T0).reason, 'stale');
  assert.equal(e.ingest({ ...ok, spd: 40 }, T0).reason, 'speed');
  assert.equal(e.ingest(ok, T0).ok, true);
  assert.equal(e.ingest(ok, T0 + 500).reason, 'rate');
  assert.equal(e.ingest({ ...ok, sessionId: 'nope' }, T0).reason, 'session');
});

test('score gate and 3 sessions per device per day', () => {
  const e = new Engine(LINE_DATA);
  assert.equal(e.startSession('a', 'd', 2, T0), 'low_score');
  assert.equal(e.startSession('s1', 'd', 4, T0), 'ok');
  assert.equal(e.startSession('s1', 'd', 4, T0 + 1), 'ok'); // idempotent restart after a reconnect
  assert.equal(e.startSession('s2', 'd', 4, T0), 'ok');
  assert.equal(e.startSession('s3', 'd', 4, T0), 'ok');
  assert.equal(e.startSession('s4', 'd', 4, T0), 'too_many');
});

test('a track with no data for 3 minutes is removed', () => {
  const e = new Engine(LINE_DATA);
  e.startSession('a', 'd', 4, T0);
  for (let i = 0; i < 12; i++) {
    const t = T0 + i * 3000;
    e.ingest(fixAt(e, 'a', 3000 + i * 48, 16, t), t);
    e.tick(t);
  }
  assert.equal(e.snapshot(T0 + 40_000).length, 1);
  const d = e.tick(T0 + 36_000 + 200_000);
  assert.deepEqual(d.removed, ['T-1']);
  assert.equal(e.snapshot(T0 + 300_000).length, 0);
});

test('state survives a JSON round trip (the edge function saves it between runs)', () => {
  const e = new Engine(LINE_DATA);
  e.startSession('a', 'd', 4, T0);
  for (let i = 0; i < 6; i++) {
    const t = T0 + i * 3000;
    e.ingest(fixAt(e, 'a', 3000 + i * 48, 16, t), t);
    e.tick(t);
  }
  const e2 = new Engine(LINE_DATA, JSON.parse(JSON.stringify(e.st)));
  const t = T0 + 6 * 3000;
  e2.ingest(fixAt(e2, 'a', 3000 + 6 * 48, 16, t), t);
  assert.equal(e2.tick(t).updated.length, 1);
});

test("a phone whose clock is a minute behind still gets through after three fixes", () => {
  const e = new Engine(LINE_DATA);
  e.startSession('a', 'd', 4, T0);
  const reasons: (string | undefined)[] = [];
  let pub = [] as ReturnType<Engine['tick']>['updated'];
  for (let i = 0; i < 14; i++) {
    const t = T0 + i * 3000;
    reasons.push(e.ingest(fixAt(e, 'a', 3000 + i * 3 * 16, 16, t - 60_000), t).reason);
    pub = e.tick(t).updated;
  }
  assert.deepEqual(reasons.slice(0, 2), ['stale', 'stale']);
  assert.equal(reasons[2], undefined, 'third consistent fix adopts the offset');
  assert.equal(pub.length, 1);
});

/** ride from chainage `from` at 16 m/s for `n` fixes, 3 s apart, starting at `t0`; returns the next time and position */
function ride(e: Engine, from: number, n: number, t0: number, spd = 16): { t: number; s: number } {
  let s = from;
  let t = t0;
  for (let i = 0; i < n; i++) {
    e.ingest(fixAt(e, 'a', s, spd, t), t);
    e.tick(t);
    s += spd * 3;
    t += 3000;
  }
  return { t, s };
}
function stand(e: Engine, s: number, ms: number, t0: number): number {
  let t = t0;
  for (; t < t0 + ms; t += 3000) {
    e.ingest(fixAt(e, 'a', s, 0, t), t);
    e.tick(t);
  }
  return t;
}

test('a train that stopped at a station may wait at a signal; a stop-start vehicle is dropped', () => {
  const station = LINE_DATA.chainage[3];
  // train: runs into a station, stands 30 s, leaves, then holds 60 s between stations
  const e = new Engine(LINE_DATA);
  e.startSession('a', 'd', 4, T0);
  let r = ride(e, station - 16 * 3 * 10, 10, T0);
  let t = stand(e, station, 30_000, r.t);
  r = ride(e, station + 20, 8, t);
  t = stand(e, r.s, 60_000, r.t);
  assert.equal(e.snapshot(t).length, 1, 'signal hold keeps the train');
  // vehicle: never stopped at a station, stands 20 s between stations
  const v = new Engine(LINE_DATA);
  v.startSession('a', 'd', 4, T0);
  r = ride(v, 5100, 8, T0);
  t = stand(v, r.s, 20_000, r.t);
  assert.equal(v.snapshot(t).length, 0, 'off-station stop without a station stop: road traffic');
});

test('a live train is named after its scheduled run, with its delay', () => {
  const e = new Engine(LINE_DATA);
  // Sunday 2026-11-22 08:20 Dhaka; SB-0815 left 5 min ago
  const now = Date.UTC(2026, 10, 22, 2, 20, 0);
  const at = e.run.schedS('SB', 5 * 60);
  assert.ok(at != null);
  const onTime = e.run.matchSchedule('SB', at!, now);
  assert.equal(onTime?.id, 'SB-0815');
  assert.equal(onTime?.delaySec, 0);
  const late = e.run.matchSchedule('SB', at! - 300, now);
  assert.equal(late?.id, 'SB-0815');
  assert.ok((late?.delaySec ?? 0) > 20, 'trails its timetable place → late');
});

test("a lone rider at train speed with nothing to back it up (no timetable train, no station stop) is not published", () => {
  const e = new Engine(LINE_DATA);
  const fridayNoon = Date.UTC(2026, 10, 20, 6, 0, 0); // no service before 15:00 on Fridays
  e.startSession('a', 'dev', 4, fridayNoon);
  let pub = [] as ReturnType<Engine['tick']>['updated'];
  for (let i = 0; i < 12; i++) {
    const t = fridayNoon + i * 3000;
    e.ingest(fixAt(e, 'a', 3000 + i * 48, 16, t), t);
    pub = e.tick(t).updated;
  }
  assert.equal(pub.length, 0);
});
