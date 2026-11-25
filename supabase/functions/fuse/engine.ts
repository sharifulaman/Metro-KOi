// Fusion engine: rider GPS fixes -> live train tracks (spec 6.1-6.3). Pure and serializable: all state lives in `EngineState` so the edge function can save it
// between invocations. Times are epoch milliseconds. Uses only erasable TS syntax so Node can run the tests.

export type Dir = 'SB' | 'NB';
export type TrainState = 'LIVE' | 'STALE';

export interface LineData {
  /** [lng, lat] vertices of the track, north -> south */
  coords: [number, number][];
  stationIds: string[];
  /** chainage (m) of each open station, same order as stationIds */
  chainage: number[];
  endToEndMin: number;
  dwellSec: number;
  /** longer stops at busy stations (s), by station id */
  dwellByStation?: Record<string, number>;
  /** the timetable, to name each live train after its scheduled run (SB-0810) and work out its delay */
  bands?: Record<'sun_thu' | 'fri' | 'sat', Record<Dir, [string, string, number][]>>;
  holidayAs?: 'sun_thu' | 'fri' | 'sat';
  holidays?: string[];
}

export interface WireTrain {
  id: string;
  dir: Dir;
  s: number;
  v: number;
  lat: number;
  lng: number;
  hdg: number;
  state: TrainState;
  riders: number;
  nextStation?: string;
  etaSec?: number;
  /** the scheduled run this live train is (e.g. SB-0810) and how late it runs (s, negative = early) */
  sched?: string;
  delaySec?: number;
}

export interface Fix {
  sessionId: string;
  lat: number;
  lng: number;
  acc: number;
  spd: number;
  hdg: number;
  ts: number;
}

export type Reject = 'accuracy' | 'offset' | 'stale' | 'speed' | 'rate' | 'session' | 'outlier';

export interface Config {
  maxAccuracyM: number;
  maxOffsetM: number;
  maxFixAgeMs: number;
  maxSpeedMps: number;
  minFixIntervalMs: number;
  minScore: number;
  maxSessionsPerDay: number;
  dirMinFixes: number;
  dirMinSpanM: number;
  assocM: number;
  outlierM: number;
  outlierAfterMs: number;
  processNoise: number;
  liveWindowMs: number;
  staleWindowMs: number;
  dropAfterMs: number;
  trainSpeedMps: number;
  stationRadiusM: number;
  offStationStopMs: number;
  /** a train that already stopped properly at a station may stand this long between stations (signal hold) */
  signalHoldMaxMs: number;
  maxSessionMs: number;
}

export const DEFAULT_CONFIG: Config = {
  maxAccuracyM: 30,
  maxOffsetM: 40,
  maxFixAgeMs: 10_000,
  maxSpeedMps: 100 / 3.6,
  minFixIntervalMs: 2_000,
  minScore: 3,
  maxSessionsPerDay: 3,
  dirMinFixes: 3,
  dirMinSpanM: 40,
  assocM: 150,
  outlierM: 200,
  outlierAfterMs: 5_000,
  processNoise: 0.5,
  liveWindowMs: 15_000,
  staleWindowMs: 60_000,
  dropAfterMs: 180_000,
  trainSpeedMps: 40 / 3.6,
  stationRadiusM: 80,
  offStationStopMs: 15_000,
  signalHoldMaxMs: 300_000,
  maxSessionMs: 90 * 60_000,
};

export interface Track {
  id: string;
  dir: Dir;
  s: number;
  v: number;
  p: [[number, number], [number, number]];
  lastUpdate: number;
  riders: Record<string, number>;
  created: number;
  confirmed: boolean;
  speedSeen: boolean;
  /** 0 = moving */
  stopStart: number;
  stopS: number;
  /** proper station stops seen (15-90 s within a station): it behaves like a train */
  stationStops?: number;
  suspicious: boolean;
  published: boolean;
}

export interface Session {
  sessionId: string;
  deviceId: string;
  score: number;
  startedAt: number;
  lastFixAt: number;
  trackId: string;
  direction: Dir | '';
  /** chainage of the last <= 20 accepted fixes */
  history: number[];
  trackJoined: number;
  untrusted: boolean;
  /** server time minus phone time, once a phone clock is seen to be consistently off */
  clockOffset?: number;
  /** recent (server - phone) gaps of fixes that looked stale, to tell a wrong phone clock from late fixes */
  skew?: number[];
}

export interface EngineState {
  seq: number;
  sessions: Record<string, Session>;
  devices: Record<string, number[]>;
  tracks: Record<string, Track>;
}

export const emptyState = (): EngineState => ({ seq: 0, sessions: {}, devices: {}, tracks: {} });

// ---------------------------------------------------------------- geometry

const A = 6378137.0;
const F = 1 / 298.257223563;
const K0 = 0.9996;
const ZONE46 = 93.0;

/** WGS84 -> UTM zone 46N (EPSG:32646), metres. */
export function toUTM46(lat: number, lng: number): [number, number] {
  const e2 = F * (2 - F);
  const ep2 = e2 / (1 - e2);
  const phi = (lat * Math.PI) / 180;
  const lam = ((lng - ZONE46) * Math.PI) / 180;
  const sin = Math.sin(phi), cos = Math.cos(phi), tan = Math.tan(phi);
  const n = A / Math.sqrt(1 - e2 * sin * sin);
  const t = tan * tan;
  const c = ep2 * cos * cos;
  const a = cos * lam;
  const e4 = e2 * e2, e6 = e2 * e2 * e2;
  const m =
    A *
    ((1 - e2 / 4 - (3 * e4) / 64 - (5 * e6) / 256) * phi -
      ((3 * e2) / 8 + (3 * e4) / 32 + (45 * e6) / 1024) * Math.sin(2 * phi) +
      ((15 * e4) / 256 + (45 * e6) / 1024) * Math.sin(4 * phi) -
      ((35 * e6) / 3072) * Math.sin(6 * phi));
  const x = K0 * n * (a + ((1 - t + c) * a ** 3) / 6 + ((5 - 18 * t + t * t + 72 * c - 58 * ep2) * a ** 5) / 120) + 500000;
  const y =
    K0 *
    (m +
      n * tan * ((a * a) / 2 + ((5 - t + 9 * c + 4 * c * c) * a ** 4) / 24 + ((61 - 58 * t + t * t + 600 * c - 330 * ep2) * a ** 6) / 720));
  return [x, y];
}

function bearingDeg(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const rad = Math.PI / 180;
  const y = Math.sin((lng2 - lng1) * rad) * Math.cos(lat2 * rad);
  const x = Math.cos(lat1 * rad) * Math.sin(lat2 * rad) - Math.sin(lat1 * rad) * Math.cos(lat2 * rad) * Math.cos((lng2 - lng1) * rad);
  return (((Math.atan2(y, x) / rad) % 360) + 360) % 360;
}

export class Line {
  latLng: [number, number][] = [];
  xy: [number, number][] = [];
  cum: number[] = [];
  constructor(coords: [number, number][]) {
    coords.forEach((c, i) => {
      this.latLng.push([c[1], c[0]]);
      const p = toUTM46(c[1], c[0]);
      this.xy.push(p);
      if (i === 0) this.cum.push(0);
      else {
        const q = this.xy[i - 1];
        this.cum.push(this.cum[i - 1] + Math.hypot(p[0] - q[0], p[1] - q[1]));
      }
    });
  }
  length(): number {
    return this.cum.length ? this.cum[this.cum.length - 1] : 0;
  }
  /** chainage of the nearest point on the line + lateral offset (m) */
  snap(lat: number, lng: number): { chainage: number; offset: number } {
    const p = toUTM46(lat, lng);
    let best = Infinity;
    let chainage = 0;
    for (let i = 1; i < this.xy.length; i++) {
      const a = this.xy[i - 1], b = this.xy[i];
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const seg = dx * dx + dy * dy;
      let t = 0;
      if (seg > 0) t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / seg));
      const d = Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
      if (d < best) {
        best = d;
        chainage = this.cum[i - 1] + t * Math.sqrt(seg);
      }
    }
    return { chainage, offset: best };
  }
  pointAt(s: number): { lat: number; lng: number; bearing: number } {
    const n = this.cum.length;
    if (!n) return { lat: 0, lng: 0, bearing: 0 };
    s = Math.max(0, Math.min(this.length(), s));
    let i = 1;
    while (i < n - 1 && this.cum[i] < s) i++;
    const seg = this.cum[i] - this.cum[i - 1];
    const t = seg > 0 ? (s - this.cum[i - 1]) / seg : 0;
    const a = this.latLng[i - 1], b = this.latLng[i];
    return { lat: a[0] + t * (b[0] - a[0]), lng: a[1] + t * (b[1] - a[1]), bearing: bearingDeg(a[0], a[1], b[0], b[1]) };
  }
}

// ---------------------------------------------------------------- run model (stations)

export class Run {
  ids: string[];
  chainage: number[];
  lengthM: number;
  endToEndSec: number;
  dwellSec: number;
  /** stop length (s) per station; 0 at the terminals */
  dwell: number[];
  data: LineData;
  constructor(d: LineData) {
    this.data = d;
    this.ids = d.stationIds;
    this.chainage = d.chainage;
    this.lengthM = d.chainage[d.chainage.length - 1] - d.chainage[0];
    this.endToEndSec = d.endToEndMin * 60;
    this.dwellSec = d.dwellSec;
    const n = d.stationIds.length;
    this.dwell = d.stationIds.map((id, i) => (i === 0 || i === n - 1 ? 0 : (d.dwellByStation?.[id] ?? d.dwellSec)));
  }
  nextStationIdx(dir: Dir, s: number): number {
    if (dir === 'SB') {
      for (let i = 0; i < this.chainage.length; i++) if (this.chainage[i] > s + 20) return i;
      return -1;
    }
    for (let i = this.chainage.length - 1; i >= 0; i--) if (this.chainage[i] < s - 20) return i;
    return -1;
  }
  etaToStation(dir: Dir, s: number, stationId: string): number | null {
    const i = this.ids.indexOf(stationId);
    if (i < 0) return null;
    const ahead = dir === 'NB' ? s - this.chainage[i] : this.chainage[i] - s;
    if (ahead < 0) return null;
    const avg = this.lengthM / (this.endToEndSec - this.dwell.reduce((a, b) => a + b, 0));
    let dwells = 0;
    for (let k = 1; k < this.chainage.length - 1; k++) {
      const d = dir === 'NB' ? s - this.chainage[k] : this.chainage[k] - s;
      if (d > 1 && d < ahead) dwells += this.dwell[k];
    }
    return Math.round(ahead / avg + dwells);
  }

  /** SB stop times (s after leaving Uttara North) with the same per-station dwell as the app's run model */
  private offsets(): { arrive: number[]; depart: number[] } {
    if (this.off) return this.off;
    const c = this.chainage;
    const n = c.length;
    const moving = this.endToEndSec - this.dwell.reduce((a, b) => a + b, 0);
    const arrive = [0];
    const depart = [0];
    for (let i = 1; i < n; i++) {
      arrive[i] = depart[i - 1] + ((c[i] - c[i - 1]) / this.lengthM) * moving;
      depart[i] = arrive[i] + this.dwell[i];
    }
    arrive[n - 1] = depart[n - 1] = this.endToEndSec;
    this.off = { arrive, depart };
    return this.off;
  }
  private off: { arrive: number[]; depart: number[] } | null = null;

  /** where a scheduled train is `elapsed` s after leaving its terminal (constant speed between stops; enough to match) */
  schedS(dir: Dir, elapsed: number): number | null {
    if (elapsed < 0 || elapsed > this.endToEndSec) return null;
    const { arrive, depart } = this.offsets();
    const c = this.chainage;
    const n = c.length;
    // NB runs the SB timings mirrored
    const tt = dir === 'SB' ? elapsed : this.endToEndSec - elapsed;
    for (let i = 0; i < n; i++) {
      if (tt >= arrive[i] && tt <= depart[i]) return c[i];
      if (i + 1 < n && tt > depart[i] && tt < arrive[i + 1]) return c[i] + ((tt - depart[i]) / (arrive[i + 1] - depart[i])) * (c[i + 1] - c[i]);
    }
    return null;
  }

  /** the nearest scheduled run in this direction (within 900 m) and how late the live train is against it */
  matchSchedule(dir: Dir, s: number, now: number): { id: string; delaySec: number } | null {
    if (!this.data.bands) return null;
    const local = new Date(now + 6 * 3600_000); // Asia/Dhaka, no DST
    const dateKey = local.toISOString().slice(0, 10);
    const wd = local.getUTCDay();
    const day = (this.data.holidays ?? []).includes(dateKey) ? (this.data.holidayAs ?? 'fri') : wd === 5 ? 'fri' : wd === 6 ? 'sat' : 'sun_thu';
    const sec = local.getUTCHours() * 3600 + local.getUTCMinutes() * 60 + local.getUTCSeconds();
    const avg = this.lengthM / (this.endToEndSec - this.dwell.reduce((a, b) => a + b, 0));
    let best: { id: string; delaySec: number; d: number } | null = null;
    for (const dep of departures(this.data.bands[day][dir])) {
      const p = this.schedS(dir, sec - dep);
      if (p == null) continue;
      const d = Math.abs(p - s);
      if (d > 900 || (best && d >= best.d)) continue;
      const behind = dir === 'SB' ? p - s : s - p; // metres the live train trails its timetable place
      const hh = String(Math.floor(dep / 3600)).padStart(2, '0');
      const mm = String(Math.floor((dep % 3600) / 60)).padStart(2, '0');
      best = { id: `${dir}-${hh}${mm}`, delaySec: Math.round(behind / avg), d };
    }
    return best ? { id: best.id, delaySec: best.delaySec } : null;
  }
}

/** Terminal departures (s after midnight) of one direction's bands; later bands carry on from the last train, as in the app. */
function departures(bands: [string, string, number][]): number[] {
  const sec = (h: string) => Number(h.slice(0, 2)) * 3600 + Number(h.slice(3, 5)) * 60;
  const out: number[] = [];
  let last: number | null = null;
  bands.forEach(([from, to, hw], i) => {
    const h = hw * 60;
    const nextStart = i + 1 < bands.length ? sec(bands[i + 1][0]) : Infinity;
    for (let t = Math.max(sec(from), last == null ? -Infinity : last + h); t <= sec(to) && t < nextStart; t += h) {
      out.push(t);
      last = t;
    }
  });
  return out;
}

// ---------------------------------------------------------------- engine

export type StartResult = 'ok' | 'low_score' | 'too_many';

export class Engine {
  line: Line;
  run: Run;
  cfg: Config;
  st: EngineState;
  constructor(data: LineData, state: EngineState = emptyState(), cfg: Config = DEFAULT_CONFIG) {
    this.line = new Line(data.coords);
    this.run = new Run(data);
    this.cfg = cfg;
    this.st = state;
  }

  startSession(sessionId: string, deviceId: string, score: number, now: number): StartResult {
    if (score < this.cfg.minScore) return 'low_score';
    if (this.st.sessions[sessionId]) return 'ok';
    const recent = (this.st.devices[deviceId] ?? []).filter((t) => now - t < 24 * 3600_000);
    if (recent.length >= this.cfg.maxSessionsPerDay) {
      this.st.devices[deviceId] = recent;
      return 'too_many';
    }
    this.st.devices[deviceId] = [...recent, now];
    this.st.sessions[sessionId] = {
      sessionId, deviceId, score, startedAt: now, lastFixAt: 0, trackId: '', direction: '', history: [], trackJoined: 0, untrusted: false,
    };
    return 'ok';
  }

  stopSession(id: string): void {
    const s = this.st.sessions[id];
    if (!s) return;
    const t = this.st.tracks[s.trackId];
    if (t) delete t.riders[id];
    delete this.st.sessions[id];
  }

  ingest(f: Fix, recv: number): { ok: boolean; reason?: Reject } {
    const s = this.st.sessions[f.sessionId];
    if (!s) return { ok: false, reason: 'session' };
    if (recv - s.startedAt > this.cfg.maxSessionMs) {
      this.stopSession(f.sessionId);
      return { ok: false, reason: 'session' };
    }
    if (s.lastFixAt && recv - s.lastFixAt < this.cfg.minFixIntervalMs) return { ok: false, reason: 'rate' };
    if (f.acc > this.cfg.maxAccuracyM) return { ok: false, reason: 'accuracy' };
    let ts = f.ts + (s.clockOffset ?? 0); // the fix's time on the server clock
    if (recv - ts > this.cfg.maxFixAgeMs) {
      // three fixes in a row off by the same amount: the phone's clock is wrong, not the fixes late
      s.skew = [...(s.skew ?? []), recv - f.ts].slice(-3);
      const k = s.skew;
      if (k.length < 3 || Math.max(...k) - Math.min(...k) > 3_000) return { ok: false, reason: 'stale' };
      s.clockOffset = [...k].sort((a, b) => a - b)[1];
      ts = f.ts + s.clockOffset;
    }
    s.skew = [];
    if (f.spd > this.cfg.maxSpeedMps) return { ok: false, reason: 'speed' };
    const { chainage, offset } = this.line.snap(f.lat, f.lng);
    if (offset > this.cfg.maxOffsetM) return { ok: false, reason: 'offset' };
    s.lastFixAt = recv;
    s.history.push(chainage);
    if (s.history.length > 20) s.history = s.history.slice(-20);
    if (s.direction === '') {
      s.direction = direction(s.history, this.cfg.dirMinFixes, this.cfg.dirMinSpanM);
      if (s.direction === '') return { ok: true }; // accepted, not yet on a track
    }
    if (!s.untrusted) this.associate(s, { ...f, ts }, chainage, ts);
    return { ok: true };
  }

  private associate(s: Session, f: Fix, ch: number, ts: number): void {
    const cur = this.st.tracks[s.trackId];
    if (cur) {
      const pred = cur.s + (cur.v * (ts - cur.lastUpdate)) / 1000;
      if (Math.abs(pred - ch) <= this.cfg.outlierM || ts - s.trackJoined < this.cfg.outlierAfterMs) {
        this.update(cur, s, f, ch, ts);
        return;
      }
      delete cur.riders[s.sessionId];
      s.trackId = '';
    }
    let best: Track | null = null;
    let bestD = this.cfg.assocM;
    for (const t of Object.values(this.st.tracks)) {
      if (t.dir !== s.direction || t.suspicious) continue;
      const pred = t.s + (t.v * (ts - t.lastUpdate)) / 1000;
      const d = Math.abs(pred - ch);
      if (d <= bestD) {
        best = t;
        bestD = d;
      }
    }
    if (!best) {
      this.st.seq++;
      const v = s.direction === 'NB' ? -f.spd : f.spd;
      best = {
        id: `T-${this.st.seq}`, dir: s.direction as Dir, s: ch, v, p: [[f.acc * f.acc, 0], [0, 25]], lastUpdate: ts, riders: {}, created: ts,
        confirmed: false, speedSeen: false, stopStart: 0, stopS: 0, suspicious: false, published: false,
      };
      this.st.tracks[best.id] = best;
      best.riders[s.sessionId] = ts;
      s.trackId = best.id;
      s.trackJoined = ts;
      this.observe(best, f, ch, ts);
      return;
    }
    s.trackId = best.id;
    s.trackJoined = ts;
    this.update(best, s, f, ch, ts);
  }

  /** one Kalman predict + update step with r = acc^2 */
  private update(t: Track, s: Session, f: Fix, ch: number, ts: number): void {
    let dt = (ts - t.lastUpdate) / 1000;
    if (dt < 0) dt = 0;
    const q = this.cfg.processNoise ** 2;
    t.s += t.v * dt;
    const p = t.p;
    const p00 = p[0][0] + dt * (p[1][0] + p[0][1]) + dt * dt * p[1][1] + (q * dt ** 4) / 4;
    const p01 = p[0][1] + dt * p[1][1] + (q * dt ** 3) / 2;
    const p11 = p[1][1] + q * dt * dt;
    const r = f.acc * f.acc;
    const others = Object.keys(t.riders).length - (t.riders[s.sessionId] !== undefined ? 1 : 0);
    if (others >= 2) {
      const inn = Math.abs(ch - t.s);
      if (inn > Math.max(40, 3 * Math.sqrt(p00 + r))) {
        t.s -= t.v * dt; // not fused; the outlier rule detaches a persistent one
        return;
      }
    }
    const k0 = p00 / (p00 + r);
    const k1 = p01 / (p00 + r);
    const y = ch - t.s;
    t.s += k0 * y;
    t.v += k1 * y;
    t.p = [[(1 - k0) * p00, (1 - k0) * p01], [(1 - k0) * p01, p11 - k1 * p01]];
    t.v = Math.max(-this.cfg.maxSpeedMps, Math.min(this.cfg.maxSpeedMps, t.v));
    if (ts > t.lastUpdate) t.lastUpdate = ts;
    t.riders[s.sessionId] = ts;
    this.observe(t, f, ch, ts);
  }

  /** "moves like a train" checks; uses the phone's GPS speed, not the filter velocity */
  private observe(t: Track, f: Fix, ch: number, ts: number): void {
    const atStation = this.nearStation(ch);
    if (f.spd >= this.cfg.trainSpeedMps && !atStation) t.speedSeen = true;
    if (f.spd < 1) {
      if (!t.stopStart) {
        t.stopStart = ts;
        t.stopS = ch;
      } else if (!this.nearStation(t.stopS)) {
        // stopped between stations: road traffic, unless it already stopped at a station like a train (a signal hold)
        const limit = (t.stationStops ?? 0) > 0 ? this.cfg.signalHoldMaxMs : this.cfg.offStationStopMs;
        if (ts - t.stopStart >= limit) t.suspicious = true;
      }
    } else {
      if (t.stopStart && this.nearStation(t.stopS)) {
        const dur = ts - t.stopStart;
        if (dur >= 15_000 && dur <= 90_000) t.stationStops = (t.stationStops ?? 0) + 1;
      }
      t.stopStart = 0;
    }
    // the phone's own score is not trusted: publish only what the server itself saw move like a train, plus one
    // more piece of evidence: a proper station stop, a second rider on the same track, or a scheduled train right there
    const evidence = (t.stationStops ?? 0) > 0 || Object.keys(t.riders).length >= 2 || this.run.matchSchedule(t.dir, ch, ts) != null;
    t.confirmed = t.speedSeen && !t.suspicious && evidence;
  }

  private nearStation(s: number): boolean {
    return this.run.chainage.some((c) => Math.abs(c - s) <= this.cfg.stationRadiusM);
  }

  /** expire sessions/tracks; returns every published train (<= 1 update per train per tick) */
  tick(now: number): { updated: WireTrain[]; removed: string[] } {
    const updated: WireTrain[] = [];
    const removed: string[] = [];
    for (const [id, s] of Object.entries(this.st.sessions)) {
      if (now - s.startedAt > this.cfg.maxSessionMs || (s.lastFixAt && now - s.lastFixAt > this.cfg.dropAfterMs)) this.stopSession(id);
    }
    for (const [id, t] of Object.entries(this.st.tracks)) {
      for (const [sid, last] of Object.entries(t.riders)) if (now - last > this.cfg.staleWindowMs) delete t.riders[sid];
      if (now - t.lastUpdate > this.cfg.dropAfterMs || t.suspicious) {
        if (t.published) removed.push(id);
        for (const sid of Object.keys(t.riders)) {
          const s = this.st.sessions[sid];
          if (s) {
            s.trackId = '';
            s.untrusted = s.untrusted || t.suspicious;
          }
        }
        delete this.st.tracks[id];
        continue;
      }
      if (!t.confirmed) continue;
      t.published = true;
      updated.push(this.wire(t, now));
    }
    updated.sort((a, b) => (a.id < b.id ? -1 : 1));
    return { updated, removed };
  }

  snapshot(now: number): WireTrain[] {
    return Object.values(this.st.tracks)
      .filter((t) => t.confirmed && t.published)
      .map((t) => this.wire(t, now))
      .sort((a, b) => (a.id < b.id ? -1 : 1));
  }

  private wire(t: Track, now: number): WireTrain {
    const age = now - t.lastUpdate;
    const state: TrainState = age > this.cfg.liveWindowMs ? 'STALE' : 'LIVE';
    let s = t.s + t.v * Math.max(0, age / 1000);
    const next = this.run.nextStationIdx(t.dir, t.s);
    if (next >= 0 && state === 'STALE') {
      const c = this.run.chainage[next];
      if ((t.dir === 'SB' && s > c) || (t.dir === 'NB' && s < c)) s = c; // never run through the next station
    }
    s = Math.max(0, Math.min(this.run.chainage[this.run.chainage.length - 1], s));
    let riders = 0;
    for (const last of Object.values(t.riders)) if (now - last <= this.cfg.liveWindowMs) riders++;
    const pt = this.line.pointAt(s);
    const out: WireTrain = {
      id: t.id, dir: t.dir, s: Math.round(s * 10) / 10, v: Math.round(t.v * 10) / 10, lat: pt.lat, lng: pt.lng,
      hdg: t.dir === 'NB' ? (pt.bearing + 180) % 360 : pt.bearing, state, riders,
    };
    const n = this.run.nextStationIdx(t.dir, s);
    if (n >= 0) {
      const id = this.run.ids[n];
      out.nextStation = id;
      const eta = this.run.etaToStation(t.dir, s, id);
      if (eta !== null) out.etaSec = eta;
    }
    const m = this.run.matchSchedule(t.dir, s, now);
    if (m) {
      out.sched = m.id;
      out.delaySec = m.delaySec;
    }
    return out;
  }
}

function direction(h: number[], n: number, span: number): Dir | '' {
  if (h.length < n) return '';
  const d = h[h.length - 1] - h[h.length - n];
  if (d >= span) return 'SB';
  if (d <= -span) return 'NB';
  return '';
}
