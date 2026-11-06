/// <reference types="node" />
// FeliCa decoder tests with synthetic blocks (no card needed). Run with: npm test
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildReadCommand,
  bytesToHex,
  cardTypeOf,
  decodeFrame,
  decodeTimestamp,
  hexToBytes,
  parseBlock,
  readCard,
  stationIdForCode,
  type Transceive,
} from '../felica.ts';

const IDM = [0x01, 0x27, 0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff];
const BASE = 2000;

/** Build a 16-byte block the way the card stores it. */
function block(o: { header?: string; year: number; month: number; day: number; hour: number; from?: number; to?: number; balance: number }): number[] {
  const v = ((o.year - BASE) << 17) | (o.month << 13) | (o.day << 8) | (o.hour << 3);
  const h = hexToBytes(o.header ?? '08521000');
  return [...h, (v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff, 0x00, o.from ?? 0, 0x00, o.to ?? 0, o.balance & 0xff, (o.balance >> 8) & 0xff, (o.balance >> 16) & 0xff, 0, 0];
}

/** Response frame with length byte, as Android NfcF.transceive returns it. */
function frame(blocks: number[][], status: [number, number] = [0, 0]): number[] {
  const body = [0x07, ...IDM, status[0], status[1], blocks.length, ...blocks.flat()];
  return [body.length + 1, ...body];
}

const empty = new Array(16).fill(0);

test('encode: read command layout', () => {
  const cmd = buildReadCommand(IDM, 10, 10);
  assert.equal(cmd[0], 34); // 14 + 2*10
  assert.equal(cmd.length, 34);
  assert.equal(cmd[1], 0x06);
  assert.deepEqual(cmd.slice(2, 10), IDM);
  assert.deepEqual(cmd.slice(10, 14), [0x01, 0x0f, 0x22, 10]);
  assert.deepEqual(cmd.slice(14, 18), [0x80, 10, 0x80, 11]);
  assert.throws(() => buildReadCommand([1, 2, 3], 0));
});

test('decode: timestamp is Dhaka local, hour precision', () => {
  const b = block({ year: 2026, month: 11, day: 6, hour: 18, balance: 0 });
  assert.equal(decodeTimestamp(b, BASE), Date.parse('2026-11-06T12:00:00Z')); // 18:00 Dhaka
});

test('decode: block fields, balance little-endian, empty blocks dropped', () => {
  const tx = parseBlock(block({ year: 2026, month: 11, day: 6, hour: 9, from: 65, to: 40, balance: 70000 }), BASE);
  assert.ok(tx);
  assert.equal(tx.kind, 'trip');
  assert.equal(tx.balance, 70000);
  assert.equal(stationIdForCode(tx.fromCode), 'mirpur-10');
  assert.equal(stationIdForCode(tx.toCode), 'farmgate');
  assert.equal(parseBlock(empty, BASE), null);
  assert.equal(parseBlock(block({ header: '42600200', year: 2025, month: 1, day: 2, hour: 10, balance: 500 }), BASE)?.kind, 'recharge');
  assert.equal(stationIdForCode(99), undefined);
});

test('decode: frame status flags and short frames', () => {
  const ok = decodeFrame(frame([empty, empty]));
  assert.equal(ok?.blocks.length, 2);
  assert.deepEqual(decodeFrame(frame([empty], [0xa4, 0x01]))?.blocks, []);
  assert.equal(decodeFrame([0x0d, 0x07, 1, 2]), null);
  assert.equal(decodeFrame(frame([empty]).slice(0, 20)), null); // claims 1 block, too short
});

test('card type from IDm', () => {
  assert.equal(cardTypeOf(IDM), 'rapid_pass');
  assert.equal(cardTypeOf([0x01, 0x14, 0, 0, 0, 0, 0, 0]), 'mrt_pass');
  assert.equal(bytesToHex([0x01, 0xab]), '01AB');
});

test('readCard: two windows, balance, fares from balance differences', async () => {
  const newest = [
    block({ year: 2026, month: 11, day: 6, hour: 18, from: 40, to: 65, balance: 410 }),
    block({ year: 2026, month: 11, day: 6, hour: 9, from: 65, to: 40, balance: 440 }),
    block({ header: '42600200', year: 2026, month: 11, day: 5, hour: 20, balance: 470 }),
    block({ year: 2026, month: 11, day: 5, hour: 8, from: 90, to: 10, balance: 70 }),
  ];
  const win0 = [...newest, ...Array(6).fill(empty)];
  const win1 = Array(10).fill(empty);
  const seen: number[] = [];
  const tx: Transceive = async (cmd) => {
    seen.push(cmd[15]);
    return frame(cmd[15] === 0 ? win0 : win1);
  };
  const r = await readCard(tx, IDM, BASE);
  assert.deepEqual(seen, [0, 10]);
  assert.equal(r.balance, 410);
  assert.equal(r.partial, false);
  assert.equal(r.cardType, 'rapid_pass');
  assert.deepEqual(r.transactions.map((t) => t.amount), [-30, -30, 400, null]);
  assert.equal(r.transactions[2].kind, 'recharge');
});

test('readCard: card pulled away after the first window keeps a partial result', async () => {
  let calls = 0;
  const tx: Transceive = async () => {
    calls++;
    if (calls > 1) throw new Error('Tag was lost');
    return frame([block({ year: 2026, month: 11, day: 6, hour: 9, balance: 120 })]);
  };
  const r = await readCard(tx, IDM, BASE);
  assert.equal(r.partial, true);
  assert.equal(r.balance, 120);
});

test('readCard: nothing read → throws (moved the card too fast)', async () => {
  await assert.rejects(readCard(async () => { throw new Error('Tag was lost'); }, IDM, BASE), /Tag was lost/);
  await assert.rejects(readCard(async () => frame([], [0xff, 0xff]), IDM, BASE));
});
