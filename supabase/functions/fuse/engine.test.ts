// Run: node --test supabase/functions/fuse/engine.test.ts
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { LINE_DATA } from './data.ts';
import { Engine } from './engine.ts';

const T0 = Date.UTC(2026, 10, 20, 6, 0, 0);

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
  e.startSession('n', 'dev', 4, T0);
  let pub = [] as ReturnType<Engine['tick']>['updated'];
  for (let i = 0; i < 12; i++) {
    const t = T0 + i * 3000;
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
