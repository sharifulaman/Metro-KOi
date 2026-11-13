// Timetable engine (spec §4.2, §4.4, §6.4, §6.5). Pure functions — no React,
// no runtime imports — so it runs in node tests and mirrors backend/internal/schedule.
import type {
  DayType,
  Departure,
  Direction,
  HeadwayBand,
  JourneyOption,
  FaresFile,
  ServiceDayType,
  Station,
  TerminalDeparture,
  TimetableFile,
  Train,
} from '../models';

export const DHAKA_OFFSET_MS = 6 * 3600 * 1000; // Asia/Dhaka is UTC+6, no DST
/** Line length used only when OSM chainage is missing (spec §18.1, 21.26 km). */
export const NOMINAL_LINE_M = 21260;

// ---------- time ----------

export function hhmmToSec(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 3600 + m * 60;
}

export function secToHHMM(sec: number): string {
  const s = ((Math.floor(sec) % 86400) + 86400) % 86400;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export interface DhakaClock {
  /** YYYY-MM-DD in Dhaka */
  dateKey: string;
  /** 0 = Sunday … 6 = Saturday */
  weekday: number;
  /** seconds after local midnight (fractional) */
  sec: number;
}

export function dhakaClock(nowMs: number): DhakaClock {
  const d = new Date(nowMs + DHAKA_OFFSET_MS);
  const dateKey = d.toISOString().slice(0, 10);
  const sec = d.getUTCHours() * 3600 + d.getUTCMinutes() * 60 + d.getUTCSeconds() + d.getUTCMilliseconds() / 1000;
  return { dateKey, weekday: d.getUTCDay(), sec };
}

/** Day type from the Dhaka local date (spec §4.1). */
export function dayTypeFor(nowMs: number, holidays: ReadonlySet<string> = new Set()): DayType {
  const { dateKey, weekday } = dhakaClock(nowMs);
  if (holidays.has(dateKey)) return 'holiday';
  if (weekday === 5) return 'fri';
  if (weekday === 6) return 'sat';
  return 'sun_thu';
}

export function resolveDayType(dt: DayType, tt: TimetableFile): ServiceDayType {
  return dt === 'holiday' ? tt.holidayAs : dt;
}

// ---------- bands → terminal departures ----------

export function bandsFor(tt: TimetableFile, dt: DayType, dir: Direction): HeadwayBand[] {
  return tt.bands[resolveDayType(dt, tt)][dir].map(([from, to, headwayMin]) => ({ from, to, headwayMin }));
}

/**
 * Departures from the terminal: `from, from+h, … ≤ to`. When the next band
 * starts it replaces the previous one (spec §4.2), so a band never emits a
 * time at or after the next band's start.
 */
export function terminalDepartures(tt: TimetableFile, dt: DayType, dir: Direction): TerminalDeparture[] {
  const bands = bandsFor(tt, dt, dir);
  const out: TerminalDeparture[] = [];
  bands.forEach((b, i) => {
    const start = hhmmToSec(b.from);
    const end = hhmmToSec(b.to);
    const nextStart = i + 1 < bands.length ? hhmmToSec(bands[i + 1].from) : Infinity;
    for (let t = start; t <= end && t < nextStart; t += b.headwayMin * 60) {
      out.push({ direction: dir, departSec: t, trainId: `${dir}-${secToHHMM(t).replace(':', '')}` });
    }
  });
  return out;
}

export function serviceWindow(tt: TimetableFile, dt: DayType): { firstSec: number; lastSec: number } {
  const all = (['SB', 'NB'] as const).flatMap((d) => bandsFor(tt, dt, d));
  return {
    firstSec: Math.min(...all.map((b) => hhmmToSec(b.from))),
    lastSec: Math.max(...all.map((b) => hhmmToSec(b.to))),
  };
}

/** Index of the band containing `sec`, honouring replacement; -1 if none. */
export function currentBandIndex(bands: HeadwayBand[], sec: number): number {
  for (let i = bands.length - 1; i >= 0; i--) {
    if (sec >= hhmmToSec(bands[i].from) && sec <= hhmmToSec(bands[i].to) + 59) return i;
  }
  return -1;
}

// ---------- run model (spec §4.4) ----------

export interface RunModel {
  stationIds: string[];
  /** chainage per station, metres from Uttara North */
  chainage: number[];
  lengthM: number;
  /** SB offsets (s) from the terminal departure */
  arrive: number[];
  depart: number[];
  endToEndSec: number;
  dwellSec: number;
  /** true when OSM chainage is missing and stations are evenly spaced */
  approxGeometry: boolean;
}

export function openStations(stations: Station[]): Station[] {
  return stations.filter((s) => s.status === 'open').sort((a, b) => a.order - b.order);
}

export function buildRunModel(stations: Station[], endToEndMin: number, dwellSec: number): RunModel {
  const open = openStations(stations);
  const n = open.length;
  const haveChainage = open.every((s) => typeof s.chainageM === 'number');
  const chainage = haveChainage
    ? open.map((s) => s.chainageM as number)
    : open.map((_, i) => (i * NOMINAL_LINE_M) / (n - 1));
  const lengthM = chainage[n - 1] - chainage[0];
  const endToEndSec = endToEndMin * 60;
  const moving = endToEndSec - dwellSec * (n - 2);
  const arrive: number[] = [0];
  const depart: number[] = [0];
  for (let i = 1; i < n; i++) {
    const seg = ((chainage[i] - chainage[i - 1]) / lengthM) * moving;
    arrive[i] = depart[i - 1] + seg;
    depart[i] = i === n - 1 ? arrive[i] : arrive[i] + dwellSec;
  }
  // Pin the terminus exactly: summed float segments drift by ~1e-12 s, which
  // would make the NB train at elapsed 0 miss its own starting station.
  arrive[n - 1] = depart[n - 1] = endToEndSec;
  return { stationIds: open.map((s) => s.id), chainage, lengthM, arrive, depart, endToEndSec, dwellSec, approxGeometry: !haveChainage };
}

/** Offsets for station index `i` (always in SB/north→south index order). */
export function offsetsFor(m: RunModel, dir: Direction, i: number): { arrive: number; depart: number } {
  if (dir === 'SB') return { arrive: m.arrive[i], depart: m.depart[i] };
  return { arrive: m.endToEndSec - m.depart[i], depart: m.endToEndSec - m.arrive[i] };
}

export interface SchedulePosition {
  s: number;
  /** station index if dwelling */
  atStation: number | null;
  /** index of the next station ahead (null at the end) */
  nextIdx: number | null;
  /** seconds until arriving at nextIdx */
  etaNextSec: number | null;
  /** signed m/s along chainage */
  v: number;
  /** seconds until it leaves, when dwelling at a station */
  dwellLeftSec?: number;
}

/** Train position `elapsed` seconds after leaving its terminal (spec §6.4 step 2). */
export function positionAt(m: RunModel, dir: Direction, elapsed: number): SchedulePosition | null {
  if (elapsed < 0 || elapsed > m.endToEndSec) return null;
  const n = m.stationIds.length;
  const order = dir === 'SB' ? [...Array(n).keys()] : [...Array(n).keys()].reverse();
  const sign = dir === 'SB' ? 1 : -1;
  for (let k = 0; k < n; k++) {
    const i = order[k];
    const { arrive, depart } = offsetsFor(m, dir, i);
    if (elapsed >= arrive && elapsed <= depart) {
      const next = k + 1 < n ? order[k + 1] : null;
      return {
        s: m.chainage[i],
        atStation: i,
        nextIdx: next,
        etaNextSec: next == null ? null : offsetsFor(m, dir, next).arrive - elapsed,
        v: 0,
        dwellLeftSec: depart - elapsed,
      };
    }
    if (k + 1 < n) {
      const j = order[k + 1];
      const nextArrive = offsetsFor(m, dir, j).arrive;
      if (elapsed > depart && elapsed < nextArrive) {
        const f = (elapsed - depart) / (nextArrive - depart);
        const ds = m.chainage[j] - m.chainage[i];
        return {
          s: m.chainage[i] + f * ds,
          atStation: null,
          nextIdx: j,
          etaNextSec: nextArrive - elapsed,
          v: (sign * Math.abs(ds)) / (nextArrive - depart),
        };
      }
    }
  }
  return null;
}

// ---------- trains, departures, journey ----------

/** Active scheduled trains right now (spec §6.4 step 3), marked ESTIMATED. */
export function estimatedTrains(tt: TimetableFile, m: RunModel, nowMs: number, holidays?: ReadonlySet<string>): Train[] {
  const dt = dayTypeFor(nowMs, holidays);
  const { sec } = dhakaClock(nowMs);
  const out: Train[] = [];
  for (const dir of ['SB', 'NB'] as const) {
    for (const dep of terminalDepartures(tt, dt, dir)) {
      const p = positionAt(m, dir, sec - dep.departSec);
      if (!p) continue;
      out.push({
        id: dep.trainId,
        dir,
        s: p.s,
        v: p.v,
        lat: null,
        lng: null,
        hdg: null,
        state: 'ESTIMATED',
        riders: 0,
        nextStation: p.nextIdx == null ? null : m.stationIds[p.nextIdx],
        etaSec: p.etaNextSec == null ? null : Math.round(p.etaNextSec),
        ts: nowMs,
        ...(p.dwellLeftSec != null && p.nextIdx != null ? { dwellLeftSec: p.dwellLeftSec } : {}),
      });
    }
  }
  return out;
}

/** Next scheduled trains at a station for each direction (spec §7.1 departures). */
export function stationDepartures(
  tt: TimetableFile,
  m: RunModel,
  stationId: string,
  nowMs: number,
  limit = 3,
  holidays?: ReadonlySet<string>,
): Record<Direction, Departure[]> {
  const i = m.stationIds.indexOf(stationId);
  const res: Record<Direction, Departure[]> = { SB: [], NB: [] };
  if (i < 0) return res;
  const dt = dayTypeFor(nowMs, holidays);
  const { sec } = dhakaClock(nowMs);
  const last = m.stationIds.length - 1;
  for (const dir of ['SB', 'NB'] as const) {
    // Trains terminate at the far end: no SB departures at Motijheel, no NB at Uttara North.
    if ((dir === 'SB' && i === last) || (dir === 'NB' && i === 0)) continue;
    const { arrive, depart } = offsetsFor(m, dir, i);
    for (const dep of terminalDepartures(tt, dt, dir)) {
      const arr = dep.departSec + arrive;
      const leave = dep.departSec + depart;
      if (leave < sec) continue;
      res[dir].push({
        trainId: dep.trainId,
        direction: dir,
        platform: dir === 'SB' ? 1 : 2,
        etaSec: Math.max(0, Math.round(arr - sec)),
        source: 'schedule',
        atSec: Math.round(arr),
      });
      if (res[dir].length >= limit) break;
    }
  }
  return res;
}

export function fareFor(fares: FaresFile | null, fromId: string, toId: string): number | null {
  if (!fares?.amounts) return null;
  return fares.amounts[`${fromId}|${toId}`] ?? fares.amounts[`${toId}|${fromId}`] ?? null;
}

/** Next trains for From → To (spec §10.6). Works offline. */
export function journeyOptions(
  tt: TimetableFile,
  m: RunModel,
  fromId: string,
  toId: string,
  nowMs: number,
  count = 3,
  fares: FaresFile | null = null,
  holidays?: ReadonlySet<string>,
): JourneyOption[] {
  const a = m.stationIds.indexOf(fromId);
  const b = m.stationIds.indexOf(toId);
  if (a < 0 || b < 0 || a === b) return [];
  const dir: Direction = b > a ? 'SB' : 'NB';
  const dt = dayTypeFor(nowMs, holidays);
  const { sec } = dhakaClock(nowMs);
  const fromOff = offsetsFor(m, dir, a);
  const toOff = offsetsFor(m, dir, b);
  const fare = fareFor(fares, fromId, toId);
  const out: JourneyOption[] = [];
  for (const dep of terminalDepartures(tt, dt, dir)) {
    const leave = dep.departSec + fromOff.depart;
    if (leave < sec) continue;
    const arriveSec = dep.departSec + toOff.arrive;
    out.push({
      trainId: dep.trainId,
      direction: dir,
      departSec: Math.round(leave),
      arriveSec: Math.round(arriveSec),
      durationSec: Math.round(arriveSec - leave),
      waitSec: Math.round(leave - sec),
      fareBdt: fare,
      fareRapidPassBdt: fare == null || !fares ? null : Math.round(fare * fares.rapidPassMultiplier),
      source: 'schedule',
    });
    if (out.length >= count) break;
  }
  return out;
}

/** ETA of a moving train to a station (spec §6.5). */
export function etaToStation(m: RunModel, train: Pick<Train, 's' | 'dir'>, stationId: string): number | null {
  const i = m.stationIds.indexOf(stationId);
  if (i < 0) return null;
  const target = m.chainage[i];
  const ahead = train.dir === 'SB' ? target - train.s : train.s - target;
  if (ahead < 0) return null;
  const avgSpeed = m.lengthM / (m.endToEndSec - m.dwellSec * (m.stationIds.length - 2));
  const dwellsAhead = m.chainage.filter((c, k) => {
    const d = train.dir === 'SB' ? c - train.s : train.s - c;
    return d > 1 && d < ahead && k > 0 && k < m.chainage.length - 1;
  }).length;
  return Math.round(ahead / avgSpeed + dwellsAhead * m.dwellSec);
}

// ---------- scheduled runs (train detail, playback) ----------

/** Epoch ms of `sec` on the next day (today included) that runs `type`'s timetable. */
export function nextDateOfType(tt: TimetableFile, nowMs: number, type: ServiceDayType, sec: number, holidays?: ReadonlySet<string>): number {
  const dayStart = nowMs - dhakaClock(nowMs).sec * 1000;
  for (let d = 0; d < 8; d++) {
    const midnight = dayStart + d * 86400000;
    if (resolveDayType(dayTypeFor(midnight + 12 * 3600000, holidays), tt) === type) return midnight + sec * 1000;
  }
  return dayStart + sec * 1000;
}

/** Scheduled train ids are `SB-0710` (direction + terminal departure HHMM). */
export function parseScheduledId(id: string): { dir: Direction; departSec: number } | null {
  const m = /^(SB|NB)-(\d{2})(\d{2})$/.exec(id);
  if (!m) return null;
  return { dir: m[1] as Direction, departSec: Number(m[2]) * 3600 + Number(m[3]) * 60 };
}

export interface StopTime {
  /** station index in SB (north → south) order */
  idx: number;
  stationId: string;
  /** seconds after local midnight */
  arriveSec: number;
  departSec: number;
}

/** Every stop of one scheduled run, in travel order. */
export function runStops(m: RunModel, dir: Direction, terminalDepartSec: number): StopTime[] {
  const n = m.stationIds.length;
  const order = dir === 'SB' ? [...Array(n).keys()] : [...Array(n).keys()].reverse();
  return order.map((i) => {
    const o = offsetsFor(m, dir, i);
    return { idx: i, stationId: m.stationIds[i], arriveSec: terminalDepartSec + o.arrive, departSec: terminalDepartSec + o.depart };
  });
}

/**
 * When no scheduled train is running at `nowMs`, the epoch ms of the next
 * terminal departure (today or one of the next days). Null while trains run.
 */
export function nextServiceStart(tt: TimetableFile, m: RunModel, nowMs: number, holidays?: ReadonlySet<string>): number | null {
  if (estimatedTrains(tt, m, nowMs, holidays).length > 0) return null;
  const dayStart = nowMs - dhakaClock(nowMs).sec * 1000;
  for (let d = 0; d < 4; d++) {
    const midnight = dayStart + d * 86400000;
    const dt = dayTypeFor(midnight + 12 * 3600000, holidays);
    const next = (['SB', 'NB'] as const)
      .flatMap((dir) => terminalDepartures(tt, dt, dir))
      .map((x) => midnight + x.departSec * 1000)
      .filter((ms) => ms > nowMs);
    if (next.length) return Math.min(...next);
  }
  return null;
}
