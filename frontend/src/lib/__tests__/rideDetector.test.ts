/// <reference types="node" />
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { initialRide, stepRide, type RideContext, type RideFix, type RideState } from '../rideDetector.ts';

const here = dirname(fileURLToPath(import.meta.url));
const stations = (JSON.parse(readFileSync(join(here, '../../data/stations.json'), 'utf8')) as { stations: { status: string; chainageM: number | null }[] }).stations;
const stationM = stations.filter((s) => s.status === 'open').map((s) => s.chainageM as number);
const T0 = Date.UTC(2026, 10, 22, 3, 0, 0);

class Sim {
  st: RideState = initialRide(T0);
  t = T0;
  s: number;
  ctx: RideContext;
  /** +1 southbound (chainage up), -1 northbound */
  sign: number;
  constructor(start: number, ctx: RideContext, sign = 1) {
    this.s = start;
    this.ctx = ctx;
    this.sign = sign;
  }
  fix(speed: number, offsetM = 5) {
    this.st = stepRide(this.st, { ts: this.t, s: this.s, offsetM, speed } as RideFix, this.ctx);
    this.t += 3000;
    this.s += this.sign * speed * 3;
  }
  stand(ms: number) {
    for (let k = 0; k < ms / 3000; k++) this.fix(0);
  }
  /** accelerate, cruise and brake into chainage `to` */
  runTo(to: number, cruise = 18) {
    for (const v of [4, 9, 14]) this.fix(v);
    while (Math.abs(to - this.s) > cruise * 3 + 40) this.fix(cruise);
    this.fix(10);
    this.s = to;
  }
}

test('train ride: station, two segments with a proper stop → ON_TRAIN, then ends with a trip', () => {
  const sim = new Sim(stationM[3], { stationM });
  sim.stand(70_000);
  assert.equal(sim.st.phase, 'AT_STATION');
  sim.runTo(stationM[4]);
  sim.stand(30_000);
  sim.runTo(stationM[5]);
  assert.equal(sim.st.phase, 'ON_TRAIN');
  assert.equal(sim.st.dir, 'SB');
  assert.ok(sim.st.seen.speed && sim.st.seen.dwell && sim.st.seen.fromStation);
  // walks off the viaduct
  for (let k = 0; k < 12; k++) sim.fix(1.2, 260);
  assert.equal(sim.st.phase, 'IDLE');
  assert.equal(sim.st.finished?.dir, 'SB');
  assert.equal(sim.st.finished?.fromIdx, 3);
  assert.equal(sim.st.finished?.toIdx, 5);
});

test('the timetable names the train', () => {
  const sim = new Sim(stationM[6], { stationM, match: (dir) => (dir === 'NB' ? 'NB-0815' : null) }, -1);
  sim.stand(70_000);
  sim.runTo(stationM[5]);
  sim.stand(30_000);
  sim.runTo(stationM[4]);
  assert.equal(sim.st.dir, 'NB');
  assert.equal(sim.st.trainId, 'NB-0815');
  assert.equal(sim.st.phase, 'ON_TRAIN');
});

test('a bus on the road below: stop between stations before it is sure → REJECTED', () => {
  const sim = new Sim(stationM[2] - 100, { stationM });
  sim.fix(0);
  for (let k = 0; k < 12; k++) sim.fix(9);
  assert.equal(sim.st.phase, 'CANDIDATE');
  sim.stand(21_000);
  assert.equal(sim.st.phase, 'REJECTED');
});
