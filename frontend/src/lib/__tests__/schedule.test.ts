/// <reference types="node" />
// Run with: npm test  (node --test, native TypeScript stripping)
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import type { DayType, Direction, Station, TimetableFile } from '../../models/index.ts';
import { fmtClock, fmtClockRange, fmtEta, fmtEtaAt, fmtNum } from '../fmt.ts';
import {
  buildRunModel,
  dayTypeFor,
  dhakaClock,
  estimatedTrains,
  journeyOptions,
  nextServiceStart,
  parseScheduledId,
  positionAt,
  runStops,
  secToHHMM,
  stationDepartures,
  terminalDepartures,
} from '../schedule.ts';

const here = dirname(fileURLToPath(import.meta.url));
const read = <T>(p: string): T => JSON.parse(readFileSync(join(here, p), 'utf8')) as T;
const tt = read<TimetableFile>('../../data/timetable.json');
const stations = read<{ stations: Station[] }>('../../data/stations.json').stations;
const golden = read<{
  cases: { dayType: DayType; direction: Direction; count: number; first: string; last: string; sample: string[] }[];
  mustContain: Record<string, string[]>;
  mustNotContain: Record<string, string[]>;
  peakSunThuSB: string[];
}>('../../../../backend/testdata/schedule_cases.json');

const times = (d: DayType, dir: Direction) => terminalDepartures(tt, d, dir).map((x) => secToHHMM(x.departSec));
// 2026-11-08 is a Sunday; Dhaka 08:20 = 02:20Z
const SUN_0820 = Date.parse('2026-11-08T02:20:00Z');

test('golden vectors: count, first, last, first four', () => {
  for (const c of golden.cases) {
    const got = times(c.dayType, c.direction);
    assert.equal(got.length, c.count, `${c.dayType}/${c.direction} count`);
    assert.equal(got[0], c.first);
    assert.equal(got[got.length - 1], c.last);
    assert.deepEqual(got.slice(0, 4), c.sample);
  }
});

test('golden vectors: must / must-not contain', () => {
  for (const [k, list] of Object.entries(golden.mustContain)) {
    const [d, dir] = k.split('/') as [DayType, Direction];
    for (const v of list) assert.ok(times(d, dir).includes(v), `${k} should contain ${v}`);
  }
  for (const [k, list] of Object.entries(golden.mustNotContain)) {
    const [d, dir] = k.split('/') as [DayType, Direction];
    for (const v of list) assert.ok(!times(d, dir).includes(v), `${k} should not contain ${v}`);
  }
});

test('Sun–Thu SB peak 08:11→10:00 every 5 min', () => {
  const got = times('sun_thu', 'SB');
  for (const v of golden.peakSunThuSB) assert.ok(got.includes(v), v);
});

test('day type from Dhaka local date; holiday follows Friday', () => {
  assert.equal(dayTypeFor(SUN_0820), 'sun_thu');
  assert.equal(dayTypeFor(Date.parse('2026-11-06T10:00:00Z')), 'fri');
  assert.equal(dayTypeFor(Date.parse('2026-11-07T10:00:00Z')), 'sat');
  // 23:30Z Friday = 05:30 Saturday in Dhaka
  assert.equal(dayTypeFor(Date.parse('2026-11-06T23:30:00Z')), 'sat');
  assert.equal(dayTypeFor(SUN_0820, new Set(['2026-11-08'])), 'holiday');
  assert.deepEqual(times('holiday', 'SB'), times('fri', 'SB'));
  assert.equal(Math.round(dhakaClock(SUN_0820).sec), 8 * 3600 + 20 * 60);
});

test('run model: 40 min end to end, dwell 30 s, symmetric NB', () => {
  const m = buildRunModel(stations, 40, 30);
  assert.equal(m.stationIds.length, 16, 'planned Kamalapur excluded');
  assert.equal(Math.round(m.arrive[15]), 2400);
  assert.equal(m.depart[0], 0);
  assert.ok(Math.abs(m.depart[5] - m.arrive[5] - 30) < 1e-9);
  assert.equal(positionAt(m, 'SB', 0)?.atStation, 0);
  assert.equal(positionAt(m, 'NB', 0)?.atStation, 15);
  assert.equal(positionAt(m, 'SB', 2401), null);
  const mid = positionAt(m, 'SB', 1200);
  assert.ok(mid && mid.s > 0 && mid.s < m.lengthM);
});

test('a dwelling train reports how long until it leaves; a moving one does not', () => {
  const m = buildRunModel(stations, 40, 30);
  const stop = positionAt(m, 'SB', m.arrive[3] + 10);
  assert.equal(stop?.atStation, 3);
  assert.ok(Math.abs((stop?.dwellLeftSec ?? NaN) - 20) < 1e-6, 'arrived 10 s ago, 30 s dwell → 20 s left');
  assert.equal(positionAt(m, 'SB', m.depart[3] + 5)?.dwellLeftSec, undefined);
  // NB mirrors it
  const nb = positionAt(m, 'NB', 0);
  assert.equal(nb?.atStation, 15);
  // the terminal stop has no "next" station, so estimatedTrains never shows a departure timer for it
  const end = estimatedTrains(tt, m, SUN_0820).filter((t) => t.dwellLeftSec != null);
  assert.ok(end.every((t) => t.nextStation != null));
});

test('estimated trains and station departures at Sun 08:20', () => {
  const m = buildRunModel(stations, 40, 30);
  const est = estimatedTrains(tt, m, SUN_0820);
  assert.ok(est.length > 5);
  assert.ok(est.every((t) => t.state === 'ESTIMATED'));
  const d = stationDepartures(tt, m, 'farmgate', SUN_0820, 3);
  assert.equal(d.SB.length, 3);
  assert.ok(d.SB.every((x) => x.platform === 1 && x.source === 'schedule'));
  assert.ok(d.SB[0].etaSec <= d.SB[1].etaSec);
  assert.deepEqual(stationDepartures(tt, m, 'motijheel', SUN_0820).SB, [], 'no SB departures at the southern terminus');
  assert.deepEqual(stationDepartures(tt, m, 'uttara-north', SUN_0820).NB, []);
});

test('journey: direction, duration, no fare until chart loaded', () => {
  const m = buildRunModel(stations, 40, 30);
  const j = journeyOptions(tt, m, 'mirpur-10', 'farmgate', SUN_0820, 3, null);
  assert.equal(j.length, 3);
  assert.ok(j.every((o) => o.direction === 'SB' && o.durationSec > 0 && o.fareBdt === null));
  const back = journeyOptions(tt, m, 'farmgate', 'mirpur-10', SUN_0820, 1, null);
  assert.equal(back[0].direction, 'NB');
  assert.equal(Math.abs(back[0].durationSec - j[0].durationSec) <= 1, true);
});

test('fmt: Bangla digits and schedule tilde', () => {
  assert.equal(fmtNum(2026, 'bn'), '২০২৬');
  assert.equal(fmtEta(180, 'live', 'en'), '3 min');
  assert.equal(fmtEta(180, 'schedule', 'en'), '~3 min');
  assert.equal(fmtEta(180, 'schedule', 'bn'), '~৩ মিনিট');
  assert.equal(fmtClock(6 * 3600 + 30 * 60, 'bn'), 'সকাল ৬:৩০');
  assert.equal(fmtClock(22 * 3600 + 30 * 60, 'en'), '10:30 PM');
});

test('playback: next service start when the line is closed', () => {
  const m = buildRunModel(stations, 40, 30);
  const satMidnight = Date.parse('2026-11-06T18:03:00Z'); // Sat 00:03 Dhaka
  assert.equal(nextServiceStart(tt, m, satMidnight), Date.parse('2026-11-07T00:30:00Z')); // Sat 06:30
  const friMorning = Date.parse('2026-11-06T04:00:00Z'); // Fri 10:00 Dhaka
  assert.equal(nextServiceStart(tt, m, friMorning), Date.parse('2026-11-06T09:00:00Z')); // Fri 15:00
  assert.equal(nextServiceStart(tt, m, SUN_0820), null); // trains are running
});

test('scheduled run: id parsing and stop times', () => {
  const m = buildRunModel(stations, 40, 30);
  assert.deepEqual(parseScheduledId('SB-0710'), { dir: 'SB', departSec: 7 * 3600 + 600 });
  assert.equal(parseScheduledId('T-17'), null);
  const sb = runStops(m, 'SB', 7 * 3600);
  assert.equal(sb[0].stationId, m.stationIds[0]);
  assert.equal(sb[0].departSec, 7 * 3600);
  assert.equal(sb[sb.length - 1].arriveSec, 7 * 3600 + 2400);
  const nb = runStops(m, 'NB', 7 * 3600);
  assert.equal(nb[0].stationId, m.stationIds[m.stationIds.length - 1]);
});

test('fmt: far-off trains show a clock time; ranges share the period word', () => {
  assert.equal(fmtEtaAt(600, 7 * 3600, 'schedule', 'en'), '~10 min');
  assert.equal(fmtEtaAt(6 * 3600, 6 * 3600 + 30 * 60, 'schedule', 'bn'), 'সকাল ৬:৩০');
  assert.equal(fmtClockRange(6 * 3600 + 1800, 7 * 3600 + 600, 'bn'), 'সকাল ৬:৩০ – ৭:১০');
  assert.equal(fmtClockRange(10 * 3600, 15 * 3600 + 1200, 'en'), '10:00 AM – 3:20 PM');
});
