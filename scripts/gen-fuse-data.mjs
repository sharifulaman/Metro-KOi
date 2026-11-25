// Generates supabase/functions/fuse/data.ts (line geometry + station chainage) from supabase/data.
//   node scripts/gen-fuse-data.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const read = (p) => JSON.parse(readFileSync(new URL(`../supabase/data/${p}`, import.meta.url), 'utf8'));
const stations = read('stations.json')
  .stations.filter((s) => s.status === 'open')
  .sort((a, b) => a.order - b.order);
const tt = read('timetable.json');
const coords = read('line6.json').geometry.coordinates;
if (stations.some((s) => s.chainageM == null)) throw new Error('station chainage missing');

const data = {
  coords,
  stationIds: stations.map((s) => s.id),
  chainage: stations.map((s) => s.chainageM),
  endToEndMin: tt.endToEndMin,
  dwellSec: tt.dwellSec,
  dwellByStation: tt.dwellByStation ?? {},
  bands: tt.bands,
  holidayAs: tt.holidayAs,
  holidays: tt.holidays ?? [],
};
const out =
  '// Generated from supabase/data by scripts/gen-fuse-data.mjs. Do not edit.\n' +
  'import type { LineData } from "./engine.ts";\n\n' +
  `export const LINE_DATA: LineData = ${JSON.stringify(data)};\n`;
writeFileSync(new URL('../supabase/functions/fuse/data.ts', import.meta.url), out);
console.log(`stations=${data.stationIds.length} vertices=${coords.length} last chainage=${data.chainage.at(-1)}`);
