// Merges a gate survey (exported from the app: More → Field tools → Gate survey → Share) into both gates.json copies.
//   node scripts/apply-gate-survey.mjs path/to/gates-survey.json
// Each point replaces that gate's lat/lng and marks it surveyed (approx: false, accuracyM, surveyedAt).
import { readFileSync, writeFileSync } from 'node:fs';

const file = process.argv[2];
if (!file) {
  console.error('usage: node scripts/apply-gate-survey.mjs <gates-survey.json>');
  process.exit(1);
}
const points = JSON.parse(readFileSync(file, 'utf8'));
if (!Array.isArray(points)) throw new Error('expected an array of survey points');

for (const rel of ['../frontend/src/data/gates.json', '../supabase/data/gates.json']) {
  const url = new URL(rel, import.meta.url);
  const data = JSON.parse(readFileSync(url, 'utf8'));
  let changed = 0;
  for (const p of points) {
    if (typeof p.lat !== 'number' || typeof p.lng !== 'number' || !p.stationId || !p.gate) continue;
    const g = data.gates.find((x) => x.stationId === p.stationId && x.gate === p.gate);
    if (!g) {
      console.warn(`${rel}: no gate ${p.stationId} ${p.gate}, skipped`);
      continue;
    }
    Object.assign(g, { lat: p.lat, lng: p.lng, approx: false, accuracyM: p.accuracyM ?? null, surveyedAt: p.surveyedAt ?? null });
    changed++;
  }
  writeFileSync(url, JSON.stringify(data, null, 2) + '\n');
  console.log(`${rel}: ${changed} gate(s) updated`);
}
