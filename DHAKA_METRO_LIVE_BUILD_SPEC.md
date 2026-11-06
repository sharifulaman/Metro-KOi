# Dhaka MRT Line-6 Live Tracker — Build Spec (for AI-assisted development)

> **How to use this file:** give it to an AI coding assistant as the single source of truth. Build in the order of **§15 Build Tasks**. **UI rule: build each component once (§9, Task 2) and assemble every screen from that catalog; never rebuild or restyle a component inside a screen.** Every task has acceptance criteria. Do not invent data that is marked `TO FETCH` or `UNVERIFIED`.

---

## 0. TL;DR

- **App:** React Native (Expo, TypeScript) for Android + iPhone.
- **Backend:** Go + PostgreSQL/PostGIS + Redis (WebSocket for live updates).
- **Map:** MapLibre + OpenStreetMap data. **No paid map API, no Google, no Mapbox.**
- **Core idea:** Train position comes from **riders who opt in to share GPS** (crowdsourced). The **timetable is only a fallback**, always labelled "Estimated".
- **Languages:** Bangla (default) + English.
- **3D:** 3D city (extruded buildings, pitched map) + an interactive 3D **station scene** (§19). Make **own** art; do **not** copy dhakametro.live assets, name or branding.
- **UI:** one reusable component kit (tokens → `ui` → `metro` → screens, §9). Screens only assemble components; no raw colours/sizes in screens.
- **Also in scope:** gates A/B/C/D at every station + inside-route (§18), NFC card balance + local trip history (feasibility-gated, §18.4).

---

## 1. Source analysis (what the provided sources say)

Sources analysed: `metro.pdf` (Bangla timetable print of the rapidpass page), `rapidpass.com.bd/metro-schedule`, `rapidpass.com.bd/station-location`, `dhakametrorail.org/schedule`.

### 1.1 Trust ranking

| Source | Contains | Trust | Verdict |
|---|---|---|---|
| `metro.pdf` + `rapidpass.com.bd/metro-schedule` | Headway bands (time range → minutes between trains) for Sun–Thu, Friday, Saturday, both directions | **High** (identical to each other; run by DTCA/Rapid Pass) | **Use as the primary timetable** |
| `dhakametrorail.org/schedule` | Ordered list of 16 stations + per-station first/last times, weekday windows | **Low–Medium** (self-described *unofficial*) | Use **only** the station order/names. **Do not** use its per-station times |
| `rapidpass.com.bd/station-location` (bn and `/en/`) | Nothing: page says "no stations found for this route" | n/a | No station data; get from OSM |

### 1.2 Problems found in `dhakametrorail.org` (why its times are rejected)

1. Last northbound train at Uttara Center is 22:55, but the last train leaves Motijheel at 22:10 and the trip takes about 40 min. A train cannot be listed after that.
2. Per-station times are evenly spaced (about 3 min apart, 06:30 → 07:18) and look generated rather than measured.
3. Lists "Kamalapur" with planned times although it is under construction.
4. Peak windows (08:11–09:53 at ~6 min) conflict with the DTCA page (08:11–10:00 at 5 min).
5. Friday ticket-closing time given two ways (21:20 and 21:40).
6. No fares, no coordinates, no run times.

### 1.3 Facts the app can rely on (from DTCA/Rapid Pass)

- Terminals: **Uttara North (উত্তরা উত্তর)** and **Motijheel (মতিঝিল)**. Direction labels: `NB→SB` = Uttara North → Motijheel ("southbound"), `SB→NB` = Motijheel → Uttara North.
- Three day types: **Sun–Thu**, **Friday** (afternoon service only), **Saturday**.
- **No public-holiday timetable is published.** Default: treat public holidays as Friday (configurable, `UNVERIFIED`).
- The page gives **departure bands from the terminals only**, not per-station times. Per-station times must be computed (see §6.3).
- Last departure is **not** stated exactly; the last band ends 21:50 from Uttara North and 22:30 from Motijheel. Treat these as the last band end.
- Fares are **not published** on these pages. Only: Rapid Pass users get **10% off**. Fare matrix = `TO FETCH` from the official fare chart (see §13).
- Run time between stations is **not published**. End-to-end ride is about **40 minutes** for the 21.26 km line (Daily Star / BSRM infographic; calibrate from live data).
- Station coordinates and track geometry: **not in the sources** → get from OpenStreetMap (§4.3).

### 1.4 Station order (16 open stations, north → south)

Names from dhakametrorail.org (order is consistent with the real line). Bangla names are the standard ones; verify spellings against signage.

| # | ID | English | বাংলা |
|---|---|---|---|
| 1 | `uttara-north` | Uttara North | উত্তরা উত্তর |
| 2 | `uttara-center` | Uttara Center | উত্তরা সেন্টার |
| 3 | `uttara-south` | Uttara South | উত্তরা দক্ষিণ |
| 4 | `pallabi` | Pallabi | পল্লবী |
| 5 | `mirpur-11` | Mirpur-11 | মিরপুর-১১ |
| 6 | `mirpur-10` | Mirpur-10 | মিরপুর-১০ |
| 7 | `kazipara` | Kazipara | কাজীপাড়া |
| 8 | `shewrapara` | Shewrapara | শেওড়াপাড়া |
| 9 | `agargaon` | Agargaon | আগারগাঁও |
| 10 | `bijoy-sarani` | Bijoy Sarani | বিজয় সরণি |
| 11 | `farmgate` | Farmgate | ফার্মগেট |
| 12 | `karwan-bazar` | Karwan Bazar | কারওয়ান বাজার |
| 13 | `shahbagh` | Shahbagh | শাহবাগ |
| 14 | `dhaka-university` | Dhaka University | ঢাকা বিশ্ববিদ্যালয় |
| 15 | `bangladesh-secretariat` | Bangladesh Secretariat | বাংলাদেশ সচিবালয় |
| 16 | `motijheel` | Motijheel | মতিঝিল |

Future: `kamalapur` (under construction). Model it with `status: "planned"` and hide it from users until open. Stations must be **data-driven** so adding one needs no code change.

### 1.5 Platform labels seen in the demo video (for the station view UI)

Platform 1 → towards Motijheel (মতিঝিলের দিকে); Platform 2 → towards Uttara North (উত্তরার দিকে). Confirm per station.

---

## 2. Product scope

### 2.1 MVP (must have)

1. 3D/pitched map of Line 6 with 16 stations, line drawn along real track geometry.
2. Live train markers (`LIVE` from riders, `ESTIMATED` from timetable), smooth animation.
3. Station sheet: next trains each direction with countdown, platform, status badge.
4. Full timetable screen (by day type, direction, band).
5. Rider mode: "I'm on the metro" → share location anonymously → shows contribution.
6. Journey: pick From/To → next train, travel time, arrival time, fare (when fare data loaded).
7. Bangla/English, light/dark theme.
8. Privacy-first consent flow.
9. Gates A/B/C/D per station and gate → platform route (§18).
10. Station 3D scene with live/estimated trains and gate routes (§19).
11. NFC card balance and local trip history (only if §18.4 feasibility passes; history-only otherwise).

### 2.2 Later

Delay/disruption alerts (push), favourites with "notify me N min before", coach crowd levels, offline timetable, rider leaderboard/badges, Kamalapur extension, Rapid Pass links.

### 2.3 Non-goals

No ticket purchase, no Google/Mapbox APIs, no user accounts in MVP, no storing personal location history.

---

## 3. Tech stack (final)

### 3.1 Mobile (React Native)

| Concern | Choice |
|---|---|
| Framework | Expo SDK (latest stable) with **dev builds** (not Expo Go; native modules needed), TypeScript, `expo-router` |
| Map | `@maplibre/maplibre-react-native` |
| Map tiles | **OpenFreeMap** (free, no key) vector tiles; fallback: self-hosted `go-pmtiles serve` from a Bangladesh PMTiles extract |
| 3D city | MapLibre `fill-extrusion` layer on the `building` source layer, map pitch 55–65° |
| Train markers | MapLibre `ShapeSource` + `SymbolLayer`/`CircleLayer`, rotated by bearing; updated at 30 fps from a local interpolator |
| Station 3D view | `@react-three/fiber/native` + `expo-gl` with procedural geometry (§19); Skia 2.5D fallback on low-end devices |
| UI kit | **Own component library** in `src/components` (tokens → ui → metro, §9); styles via `StyleSheet` + `useTheme()`; no third-party UI kit |
| NFC | `react-native-nfc-manager` (Android), CoreNFC (iOS) — feasibility first (§18.4) |
| Animation/gestures | `react-native-reanimated`, `react-native-gesture-handler`, `@gorhom/bottom-sheet` |
| State | Zustand (UI + live state), TanStack Query (REST/static data) |
| Realtime | native `WebSocket` with reconnect/backoff and resume |
| Location | `expo-location` (foreground + background), `expo-task-manager`, `expo-sensors` (accelerometer) |
| Storage | `react-native-mmkv` (timetable cache, settings) |
| i18n | `i18next` + `react-i18next`, Bangla default; numerals localised (০–৯) |
| Push | `expo-notifications` (FCM/APNs) |
| Fonts | **Hind Siliguri** (Bangla) + **Plus Jakarta Sans** (Latin/digits) via `expo-font` |
| Icons | `lucide-react-native` |
| Tests | Jest + React Native Testing Library; Maestro for E2E |

### 3.2 Backend (Go)

| Concern | Choice |
|---|---|
| Language/HTTP | Go 1.22+, `chi` router |
| WebSocket | `github.com/coder/websocket` |
| DB | PostgreSQL 16 + PostGIS (`pgx`), migrations with `golang-migrate` |
| Live state | Redis 7 (`go-redis`): train state, pub/sub fan-out, rate limits |
| Config | env vars, `envconfig` |
| Logging/metrics | `slog`, Prometheus `/metrics` |
| Container | Docker Compose; deploy on a single small VPS (Hetzner / Oracle free tier) behind Caddy (auto-HTTPS) |
| Push | FCM HTTP v1 (free) |

### 3.3 Free-data rules

- Show **"© OpenStreetMap contributors"** (and OpenFreeMap/OpenMapTiles credits) on the map screen.
- Never call `tile.openstreetmap.org` from the app (policy forbids heavy use).
- Static data (stations, track, timetable) ships **inside the app** as JSON so the app works offline; backend can push updates.

---

## 4. Data

### 4.1 Conventions

- Times in **Asia/Dhaka (UTC+6)**, stored as `HH:mm` strings in config, as UTC in DB/logs.
- Day type from local date: Sun–Thu → `sun_thu`; Fri → `fri`; Sat → `sat`; public holiday → `holiday` (default = `fri`).
- Direction codes: `SB` = Uttara North → Motijheel, `NB` = Motijheel → Uttara North.
- Distances along the line ("chainage") in **metres from Uttara North**.

### 4.2 Timetable (headway bands) — from DTCA/Rapid Pass (verified against `metro.pdf`)

`from`/`to` inclusive, 24-hour. Departures from the **terminal** are generated as `from, from+h, from+2h … ≤ to`. When the next band starts, it **replaces** the previous (this resolves duplicate boundaries such as 16:44 and 20:39).

```json
{
  "source": "rapidpass.com.bd/metro-schedule + metro.pdf",
  "verifiedAt": "2026-11-06",
  "sun_thu": {
    "SB": [
      ["06:30","07:10",20],["07:11","07:30",10],["07:31","08:10",8],["08:11","10:00",5],
      ["10:01","15:20",8],["15:21","16:44",6],["16:44","20:04",5],["20:05","21:00",10],
      ["21:01","21:30",15],["21:31","21:50",20]
    ],
    "NB": [
      ["07:15","07:55",10],["07:56","08:45",8],["08:46","10:35",5],["10:36","15:55",8],
      ["15:56","17:19",6],["17:20","20:39",8],["20:39","21:40",10],["21:41","22:10",15],
      ["22:11","22:30",20]
    ]
  },
  "fri": {
    "SB": [
      ["15:00","16:36",8],["16:37","18:42",6],["18:43","20:18",8],["20:19","21:00",10],
      ["21:01","21:30",15],["21:31","21:50",20]
    ],
    "NB": [
      ["15:20","17:11",8],["17:12","19:17",6],["19:18","20:53",8],["20:54","21:40",10],
      ["21:41","22:10",15],["22:11","22:30",20]
    ]
  },
  "sat": {
    "SB": [
      ["06:30","07:25",20],["07:26","07:49",12],["07:50","08:39",10],["08:40","10:39",8],
      ["10:40","15:29",10],["15:30","16:25",8],["16:26","18:55",6],["18:56","19:51",8],
      ["19:52","21:30",15],["21:31","21:50",20]
    ],
    "NB": [
      ["07:15","08:24",12],["08:25","09:14",10],["09:15","11:14",8],["11:15","16:04",10],
      ["16:05","17:00",8],["17:01","19:30",6],["19:31","20:26",8],["20:27","21:40",10],
      ["21:41","22:10",15],["22:11","22:30",20]
    ]
  }
}
```

Admin-editable: the backend stores this in Postgres (`timetable_bands`) and serves `GET /v1/timetable` with an `ETag`; the app caches it. If DTCA changes times, update data, not code.

### 4.3 Track geometry and station coordinates — `TO FETCH` from OpenStreetMap

Not in the provided sources. Fetch once at build time with a script (`tools/fetch-osm.ts` or Go), commit the output as `data/line6.geojson` and `data/stations.json`.

Overpass query (run from a machine with internet; adjust tags after inspecting results in https://overpass-turbo.eu):

```
[out:json][timeout:60];
(
  relation["route"~"subway|light_rail|train"]["name"~"MRT|Metro|Line ?6",i](23.70,90.34,23.89,90.43);
);
(._;>>;);
out geom;
```

Stations:

```
[out:json][timeout:60];
(
  node["railway"="station"](23.70,90.34,23.89,90.43);
  node["public_transport"="station"](23.70,90.34,23.89,90.43);
)->.s;
node.s["name"~"Uttara|Pallabi|Mirpur|Kazipara|Shewrapara|Agargaon|Bijoy|Farmgate|Karwan|Shahbag|University|Secretariat|Motijheel",i];
out;
```

Post-processing script must:

1. Match results to the 16 IDs in §1.4 (by `name`/`name:bn`); fail loudly if any is missing.
2. Merge the way segments into **one ordered LineString per direction** (use the same geometry for both; offset in rendering).
3. Project to metres (EPSG:32646 UTM 46N), compute each station's **chainage** by snapping to the line.
4. Output `stations.json`: `{id, nameBn, nameEn, lat, lng, chainageM, order}` and `line6.geojson`.
5. **Manually sanity check** against satellite imagery; fix any station snapped to the wrong place.

### 4.4 Segment run times (until calibrated)

Per-station times are **computed**, not published:

```
endToEndMin = 40              # UNVERIFIED default, config
dwellSec    = 30              # default dwell per station, config
segmentTime = (segmentLengthM / totalLengthM) * (endToEndMin*60 - dwellSec*(nStations-2))
```

Later the backend learns median segment time per `(segment, hour-of-day)` from `LIVE` data and overrides defaults once ≥ 30 samples exist.

### 4.5 Fares — `TO FETCH`

Not published on the given pages. Create `fares.json` as a station-to-station matrix from the official fare chart (DMTCL). Until loaded, the journey screen hides the fare and shows "Fare chart unavailable". Rapid Pass discount: `0.9` multiplier (source: rapidpass.com.bd/metro-schedule).

---

## 5. System architecture

```
 ┌──────────────┐  GPS (3–5s, opt-in)   ┌──────────────────────────────┐
 │ Rider phone  │ ───────────────────▶ │  Go API                      │
 │ (RN app)     │ ◀─── live trains ─── │  - /ws (WebSocket)           │
 └──────────────┘                      │  - REST (static data)        │
 ┌──────────────┐                      │  - Fusion engine (per train) │
 │ Viewer phone │ ◀─── live trains ─── │  - Timetable engine          │
 └──────────────┘                      └───────┬───────────┬──────────┘
                                               │           │
                                         Redis (state)  Postgres/PostGIS
                                         pub/sub        (static + history)
```

Flow:

1. Rider confirms "on the metro" → app opens WebSocket, sends `rider.fix` messages.
2. Server snaps each fix to the line (chainage), validates, assigns/creates a **train track**, runs the filter, publishes `train.update` through Redis pub/sub.
3. All viewers receive `trains.snapshot` on connect and `train.update` deltas afterwards.
4. If no rider data for a scheduled train, the **timetable engine** emits `ESTIMATED` positions for scheduled trains.

---

## 6. Core algorithms (implement exactly)

### 6.1 Snapping a fix to the line

1. Project lat/lng to metres (UTM 46N).
2. Find nearest point on the polyline within **40 m**; get `chainageM` and `lateralOffsetM`.
3. Reject fix if: `accuracy > 30 m`, `offset > 40 m`, timestamp older than 10 s, or speed > 100 km/h.
4. Direction: sign of chainage change over the last ≥ 3 accepted fixes (≥ 40 m total). `SB` if increasing, `NB` if decreasing. Unknown until then.

### 6.2 Is this person really on the train? (the key problem)

The viaduct runs **above busy roads** (e.g. Mirpur Rd, Pragati Sarani), so a bus below looks identical on GPS. Use a score; start sharing only when `score ≥ 3` **and** the user has confirmed.

| Signal | Points |
|---|---|
| User tapped "I'm on the metro" | required |
| Within 25 m of the line for ≥ 20 s | +1 |
| Speed 40–85 km/h at some point between stations | +1 |
| Dwell stops of 20–45 s only at station chainages (±80 m) | +1 |
| Accelerometer variance low and no stop-start pattern between stations | +1 |
| Started session inside a station geofence (100 m) | +1 |

Auto-stop sharing when: user leaves the line corridor (> 60 m for 30 s), is stationary > 3 min away from a station, user taps stop, or session > 90 min.

### 6.3 Train tracks and the fusion filter

- A **train track** = `{id, direction, chainageM, speedMps, covariance, lastUpdate, riderCount, state}`.
- **Association:** a fix joins the track with the same direction whose predicted chainage is within **150 m** (predict with `chainage + speed*dt`); otherwise create a new track.
- **Filter (1-D constant-velocity Kalman):** state `[s, v]`. Process noise `q = 0.5 m/s²`. Measurement noise `r = accuracy²` per fix. Fuse all riders on the same track (weight by `1/accuracy²`).
- **Outlier rule:** if a rider's chainage differs from the track by > 200 m after ≥ 5 s, detach that rider (probably a road user or different train).
- **States:**
  - `LIVE` — updated by ≥ 1 trusted rider within the last 15 s.
  - `STALE` — 15–60 s with no rider; keep predicting, show as dashed.
  - `ESTIMATED` — no rider data; position from timetable (below).
  - Drop a `LIVE/STALE` track after 3 min without data.
- **Merge:** if a timetable-estimated train is within 300 m of a `LIVE` track in the same direction, hide the estimate (the live train replaces it).

### 6.4 Timetable engine (fallback)

For day type `D`, direction `d`:

1. Generate terminal departure times from the bands (§4.2).
2. For a departure at time `t0`, the train position at `t` is: walk the segment/dwell schedule from §4.4 (`t - t0` seconds).
3. Active trains = departures with `0 ≤ t - t0 ≤ endToEnd`.
4. Station arrival `eta(station) = t0 + cumulativeTime(station)`.
5. Always mark `source: "schedule"`.

### 6.5 ETA for a station

`ETA = (stationChainage - trainChainage) / avgSpeed + dwellsAhead`, with `avgSpeed` from learned segment times if available, else the schedule model. Return `{etaSec, confidence: "live"|"schedule"}`. UI shows "3 min" for live and "~3 min" for schedule.

### 6.6 Smooth animation (client)

- Server sends at most 1 update per train per second.
- Client keeps `(chainage, speed, ts)` and extrapolates each frame: `s = s0 + v*(now - ts)`, clamped to the next station if a dwell is expected; blends toward the new server value over 500 ms (never teleport).
- Marker position and bearing are computed by sampling the polyline at `s` (precompute a lookup table of 5 m samples).

---

## 7. API contract

Base URL: `https://api.<yourdomain>/v1`. JSON. No auth in MVP; a random `deviceId` (UUID, generated on first launch) is used for rate limiting only.

### 7.1 REST

| Method | Path | Returns |
|---|---|---|
| GET | `/stations` | station list (§4.3 shape) |
| GET | `/stations/{id}/gates` | gates A–D `{gate, lat, lng, corner, landmarkBn, landmarkEn, hasLift, hasEscalator}` |
| GET | `/line` | GeoJSON LineString + chainage lookup |
| GET | `/timetable` | bands + day-type rules + version (`ETag`) |
| GET | `/fares` | fare matrix + discount rules (when available) |
| GET | `/stations/{id}/departures?limit=6` | next departures per direction `{trainId, etaSec, platform, source}` |
| GET | `/journey?from=&to=&at=` | next trains, ride time, arrival, fare |
| GET | `/health` | liveness |

### 7.2 WebSocket `/ws`

Client → server:

```json
{ "t":"hello", "deviceId":"uuid", "v":1, "lang":"bn" }
{ "t":"rider.start", "sessionId":"uuid", "score":4 }
{ "t":"rider.fix", "sessionId":"uuid", "lat":23.82, "lng":90.36, "acc":9, "spd":16.4, "hdg":181, "ts":1731000000123 }
{ "t":"rider.stop", "sessionId":"uuid" }
{ "t":"report.station", "stationId":"farmgate", "direction":"SB", "ts":1731000000123 }
```

Server → client:

```json
{ "t":"trains.snapshot", "ts":1731000000500, "trains":[
  { "id":"T-17", "dir":"SB", "s":12840.5, "v":15.2, "lat":23.78, "lng":90.38,
    "hdg":176, "state":"LIVE", "riders":3, "nextStation":"farmgate", "etaSec":95 } ] }
{ "t":"train.update", "train":{ "...same shape..." } }
{ "t":"train.remove", "id":"T-17" }
{ "t":"notice", "level":"info", "textBn":"…", "textEn":"…" }
```

Rules: heartbeat ping every 20 s; client reconnects with exponential backoff (1 → 2 → 4 … 30 s, jitter); on reconnect the server sends a full snapshot. Rate limits: max 1 `rider.fix` per 2 s per session, max 3 sessions per device per day-window, drop violators silently and flag.

### 7.3 Database (PostgreSQL)

```sql
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE stations (
  id TEXT PRIMARY KEY, order_no INT NOT NULL,
  name_bn TEXT NOT NULL, name_en TEXT NOT NULL,
  geom geography(Point,4326) NOT NULL, chainage_m REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'open'           -- open | planned
);
CREATE TABLE line (id INT PRIMARY KEY, geom geography(LineString,4326) NOT NULL, length_m REAL NOT NULL);
CREATE TABLE timetable_bands (
  day_type TEXT NOT NULL, direction TEXT NOT NULL,
  from_time TIME NOT NULL, to_time TIME NOT NULL, headway_min INT NOT NULL,
  PRIMARY KEY (day_type, direction, from_time)
);
CREATE TABLE segment_stats (
  from_station TEXT, to_station TEXT, hour INT, samples INT, median_sec REAL,
  PRIMARY KEY (from_station, to_station, hour)
);
CREATE TABLE fares (from_station TEXT, to_station TEXT, amount_bdt INT, PRIMARY KEY (from_station,to_station));
CREATE TABLE rider_sessions_agg (          -- aggregated only, no raw points kept > 24h
  day DATE, hour INT, sessions INT, PRIMARY KEY(day,hour)
);
CREATE TABLE raw_fixes (                   -- TTL: purge every hour where ts < now()-interval '24 hours'
  session_hash TEXT, ts TIMESTAMPTZ, chainage_m REAL, speed REAL, acc REAL
);
```

`session_hash` is a salted hash that rotates daily. Never store lat/lng of riders beyond the live in-memory/Redis state.

---

## 8. Privacy, safety, store compliance

- Location sharing is **opt-in per ride**, off by default, with a persistent "Sharing location" indicator and a one-tap stop.
- Explain in plain Bangla/English before the OS permission prompt: what is shared (anonymous position while on the metro), why, and how long it is kept.
- Ask for "While using the app" first. Request "Always"/background only when the user first starts rider mode and explain why (the screen locks during a ride). Android needs a foreground-service notification; iOS needs `UIBackgroundModes: location` and `NSLocationWhenInUseUsageDescription` / `NSLocationAlwaysAndWhenInUseUsageDescription` strings.
- No account, no phone number, no email in MVP.
- Raw points are deleted after 24 h; keep only aggregated per-segment stats.
- Publish a privacy policy URL (both stores require it).
- Abuse controls: rate limits, outlier rejection (§6.3), per-device trust score; an optional Play Integrity / App Attest check later. Never show a single unverified rider as a fully "verified" train: label by rider count.
- The app is **unofficial**. Show a footer "Unofficial. Times are for information; follow DMTCL announcements." Do not use DMTCL/MRT logos or the dhakametro.live name/artwork.

---

## 9. Design system and reusable component library

Goal: modern, calm, high-contrast, map-first. Deep ink + emerald, amber only for "live". The look is taken from the Metro Pulse design canvas (14 phone boards) and must be built **once** as a component kit, then every screen is assembled from it.

### 9.0 Reuse rules (the most important section for the AI assistant)

1. **Four layers, imports go downward only:** `tokens` → `ui` (primitives) → `metro` (domain composites) → `screens` (`app/` + `features/`). A layer never imports from a layer above it.
2. **Screens contain no styling.** In `app/**` and `features/**` there are **no** hex colours, no raw font sizes, no hard-coded radii or spacing. Only components and theme tokens (`useTheme()`, `space[3]`). Enforced by lint (§15, Task 2).
3. **Search the catalog (§9.4) before writing JSX.** If something similar exists, **add a prop or a variant**; do not create `FooCard2`. A new component is allowed only if it is used on ≥ 2 screens, or it is a feature container that is composed of catalog components.
4. **One component = one folder:** `index.tsx`, `types.ts`, `gallery.tsx` (all variants/states, light + dark, Bangla + English). The `/dev/gallery` screen lists every gallery entry; a component without a gallery entry fails review.
5. **No copy-paste of boards.** The design canvas repeats the tab bar, back button, status badge and rows on every board for illustration only. In code each appears exactly once.
6. **Text is never hard-coded.** Components take `i18n` keys or already translated strings; numbers go through `fmtNum(lang)` (Bangla digits).
7. **Every component accepts** `testID`, `accessibilityLabel` (where interactive) and works at 130 % font scale.
8. **Presentational vs data:** components in `ui/` and `metro/` receive plain props (no store, no fetch). Screens/hooks fetch and map data to props. This is what lets the same `TrainCard` appear in the Station sheet, the Train sheet and the 3D station panel.

### 9.1 Tokens (`src/theme/tokens.ts`)

Colour (semantic names only; never use the hex in components):

| Token | Light | Dark | Use |
|---|---|---|---|
| `bg` | `#F6F8F7` | `#0B1210` | App background |
| `surface` | `#FFFFFF` | `#131D1A` | Cards, sheets, tab bar |
| `surfaceAlt` | `#EDF2F0` | `#1A2723` | Chips, inputs, notes |
| `ink` | `#0E1A16` | `#EAF2EF` | Primary text |
| `inkMuted` | `#5B6B65` | `#93A59E` | Secondary text |
| `outline` | `#CBD7D2` | `#2F403A` | Outlined buttons / chips |
| `divider` | `#DCE5E1` | `#26352F` | Dividers, tab bar border |
| `brand` | `#0E9F6E` | `#2BD39A` | Metro line, accents |
| `brandDeep` | `#066B4A` | `#0E9F6E` | Primary buttons, summary cards |
| `brandTint` | `#DDF3E8` | `#173A2E` | Icon tiles, selected tab pill |
| `live` | `#F59E0B` | `#FBBF24` | LIVE dot, live train pulse |
| `liveTint` / `onLiveTint` | `#FEF3C7` / `#92400E` | `#3A2A08` / `#FCD34D` | LIVE badge |
| `estimated` | `#6B7C75` | `#8EA19A` | Estimated trains (dashed) |
| `danger` | `#E5484D` | `#FF6369` | Delay, errors, "crowded" |
| `trainSB` / `trainNB` | `#0E9F6E` / `#3B82F6` | `#2BD39A` / `#60A5FA` | Direction colours |
| `crowdLow` / `crowdMid` / `crowdHigh` | `#1F9D63` / `#B7791F` / `#D14343` | lighter variants | Coach crowd bars |

Train livery (fixed, same in both themes, used by `TrainIllustration` and the 3D scene): body `#E9EDEB`, green stripe `#1F9D63`, red band `#D42A1F`, cab `#1F7A4D`, glass `#26414A`, underframe `#2A2F2D`.

Non-colour tokens:

| Group | Values |
|---|---|
| `space` (8-pt) | 4, 8, 12, 16, 20, 24, 32 |
| `radius` | `chip 999`, `control 26`, `card 22`, `hero 24`, `note 18`, `tile 12`, `sheet 28` |
| `size` | `touch 48`, `iconBtn 46`, `button 52`, `chipH 38`, `row 56`, `rowLg 66`, `tabBar 76` |
| `shadow` | `float: 0 4 14 rgba(14,26,22,.15)`, `card: 0 2 8 rgba(14,26,22,.10)`, `sheet: 0 -8 28 rgba(14,26,22,.12)` |
| `motion` | sheet spring (damping 18, stiffness 180); LIVE pulse 1.6 s; marker glide 500 ms; all respect reduce-motion |

Map style: soft neutral basemap, buildings extruded in light neutral tones, metro line 6 px `brand` with 2 px white casing. Copy `theme.ts` tokens to the 3D scene palette (§19) so map, sheets and 3D match.

### 9.2 Typography

- Bangla **Hind Siliguri**, Latin/digits **Plus Jakarta Sans** (400/500/600/700). Bangla line-height ×1.35.
- Variants of the single `Text` primitive: `display 28/34` · `title 20/26` · `heading 22/28` · `body 16/24` · `label 13/18` · `micro 11/14` · `countdown 32/36 tabular-nums`.
- Always render times, fares and counts with tabular figures.

### 9.3 Component layers

```
tokens ─▶ ui (primitives) ─▶ metro (domain composites) ─▶ screens
                         └─▶ map (MapLibre layers)   ─▶ screens
                         └─▶ station3d (scene)       ─▶ screens
```

### 9.4 Component catalog (source of truth — extend, do not duplicate)

**`ui/` primitives (no domain knowledge)**

| Component | Variants / key props | Replaces these repeated board elements |
|---|---|---|
| `Text` | `variant`, `tone` (`ink`/`muted`/`brand`/`danger`/`inverse`), `numeric` | every label |
| `Icon` | `name` (lucide), `size`, `tone` | all inline SVG icons |
| `Button` | `variant`: `primary` `secondary` (outlined) `ghost` `dangerText`; `size`: `lg 52` `md 44`; `icon?`, `fullWidth`, `loading` | "স্টেশন ৩ডি দেখুন", "গেট A B C D", "মুছুন", Share my ride CTAs |
| `IconButton` | `shape: circle 46`; `icon`, `elevated` | back button, favourite star, locate-me |
| `Chip` | `tone`: `brand` `neutral` `live` `ink`; `selected`, `dot?`, `onPress?` | "এমআরটি লাইন ৬", "২২০ মি. দূরে", filter tabs (সব/যাত্রা/রিচার্জ) |
| `StatusBadge` | `kind`: `live` `estimated` `delayed` | লাইভ / আনুমানিক on every row |
| `Card` | `radius: card/hero`, `tone`: `surface` `brand` `alt`, `padding` | white rounded sections, green month summary |
| `ListRow` | `leading` (IconTile), `title`, `subtitle`, `trailing`, `height`, `divider` | trip history rows, settings rows, gate list rows |
| `IconTile` | `tone`: `brand` `live` `neutral`; `icon` | 38 px coloured icon squares in rows |
| `SectionLabel` | `text`, optional `colorDot`/`right` | "আজ", "গতকাল", platform group headings |
| `Segmented` | `options`, `value`, `variant`: `tabs` `pill` | Sun–Thu/Fri/Sat, Entry/Exit toggle, filter tabs |
| `InfoNote` | `icon`, `text`, `action?` | privacy notes, sample-data notes |
| `SwitchRow` | `label`, `value` | 3D view toggles, settings |
| `Sheet` | `snapPoints`, `handle` (wraps `@gorhom/bottom-sheet`) | station/train/rider sheets |
| `Divider`, `Spacer`, `Screen` (safe area + bg) | — | layout glue |
| `Stack` | `direction`, `gap`, `pad*`, `align`, `justify`, `flex`, `overlay`, `safe` | all screen layout, so `app/**` never writes a style object (added during build) |

**`metro/` composites (domain, still presentational)**

| Component | Props (summary) | Used on |
|---|---|---|
| `TabBar` | fixed 5 tabs: Live · Stations · Journey · Card · More; `active` | every tab screen (**one instance in the navigator**) |
| `ScreenHeader` | `title`, `onBack`, `right?` | Journey, History, Timetable, Gates, Route |
| `StationHeader` | `nameBn`, `nameEn`, `order`, `distance?`, `lineChip`, `onFavourite` | Station sheet, 3D panel, Gates |
| `DepartureRow` | `etaSec`, `trainId?`, `note`, `source: 'live'|'schedule'` → shows `StatusBadge` automatically | Station sheet, Journey, Train |
| `PlatformGroup` | `platform`, `towards`, `rows: DepartureRow[]` | Station sheet, 3D panel |
| `TrainCard` | `platform`, `towards`, `etaSec \| state`, `source`, `trainId`, `crowd?: number[6]`, `emptiestCoach?` | Station sheet (compact), Train sheet, 3D panel (with crowd) |
| `CoachCrowdBar` | `values: number[]`, `showLegend` | inside `TrainCard`, Train sheet |
| `LineDiagram` | `stations`, `trains`, `highlightStation?` | Train sheet, Journey, Rider active |
| `GateSelector` | `gates`, `selected`, `variant`: `chips` `cards` `pins`, `onSelect`, `recommended?` | Gates screen (cards), Inside-route and 3D panel (chips), 3D scene (pins) |
| `RouteSteps` | `steps: {n, textKey, icon?}[]`, `estMin` | Inside-route screen, 3D panel |
| `TransactionRow` | preset of `ListRow`: `kind: 'trip'|'recharge'`, `from`, `to`, `time`, `amount` | History, Card balance (recent) |
| `BalanceCard` | `balance`, `lastTapAt`, `cardTail`, `source: 'card'|'local'` | Card balance |
| `SummaryCard` | preset of `Card tone=brand`: two stats | History month summary |
| `RideBanner` | `fromTo`, `riders`, `onStop` | Rider active, Live |
| `ConnectionPill` | `state: live|reconnecting|offline` | Live, Station |
| `TrainIllustration` | `cars (default 6)`, `direction`, `crowd?`, `size` — SVG in the real livery | Train sheet header, Card tap, onboarding |
| `EmptyState` | `icon`, `title`, `body`, `action?` | offline, no service, GPS denied |

**`map/`:** `MapView3D`, `TrainMarker` (arrow, direction colour, LIVE ring, dashed when estimated), `StationPin`, `GatePin`, `LineLayer`, `WalkingPathLayer`.
**`station3d/`:** `Station3DScene` (§19), `SceneTag` (projected label), `ShotSwitcher`, `SceneToggles`.

Key prop contracts (write these first, in `types.ts`):

```ts
type Source = 'live' | 'schedule';
interface DepartureRowProps { etaSec: number; source: Source; trainId?: string; note?: string; testID?: string }
interface TrainCardProps {
  platform: 1 | 2; towards: string;
  eta?: { sec: number } | { state: 'at_station' | 'departed' };
  source: Source; trainId?: string;
  crowd?: [Lvl, Lvl, Lvl, Lvl, Lvl, Lvl]; // 0–100 per coach; omit when unknown
}
type Gate = 'A' | 'B' | 'C' | 'D';
interface GateSelectorProps {
  gates: { gate: Gate; corner: 'NW'|'NE'|'SW'|'SE'; landmark?: string; hasLift?: boolean | null }[];
  selected?: Gate; recommended?: Gate; variant: 'chips'|'cards'|'pins'; onSelect(g: Gate): void;
}
```

### 9.5 Screen → component composition (build screens by assembling only)

| Screen (canvas board) | Composed from |
|---|---|
| 1 Live map | `MapView3D`, `TrainMarker`, `StationPin`, `Chip`/`ConnectionPill`, `IconButton`, `Button` (FAB), `Sheet` + `PlatformGroup`, `TabBar` |
| 2 Station sheet | `Sheet`, `StationHeader`, `Chip`×2, `PlatformGroup`×2 (`DepartureRow`), `Button primary` + `Button secondary`, `TabBar` |
| 3 Train detail | `Sheet`, `TrainIllustration`, `TrainCard`, `LineDiagram`, `StatusBadge` |
| 4 Share my ride | `Sheet`, `Card`, `InfoNote`, `Button primary`, `Button ghost` |
| 5 Sharing active | `RideBanner`, `LineDiagram`, `Button dangerText` |
| 6 Journey | `ScreenHeader`, `Card`, `DepartureRow`, `Chip`, `Button` |
| 7 Timetable | `ScreenHeader`, `Segmented`×2, `ListRow` (band rows), `InfoNote` |
| 8 Station 3D | `Station3DScene` + panel: `StationHeader` (compact), `TrainCard`×2 (with crowd), `GateSelector chips`, `Segmented pill`, `RouteSteps`, `SwitchRow`×4, `InfoNote` |
| 9 Card tap (NFC) | `Screen`, `TrainIllustration` or card art, `Text`, `Button ghost`, `InfoNote` |
| 10 Balance | `ScreenHeader`, `BalanceCard`, `TransactionRow`×n, `Button` |
| 11 Trip history | `ScreenHeader`, `SummaryCard`, `Segmented tabs`, `SectionLabel`, `Card`+`TransactionRow`, `InfoNote` |
| 12 More | `ScreenHeader`, `ListRow`×n, `SwitchRow`, `Segmented` (language/theme) |
| 13 Gates A B C D | `ScreenHeader`, `StationHeader`, plan map (`MapView3D` + `GatePin`), `GateSelector cards`, `Button` |
| 14 Inside the station | `ScreenHeader`, side-elevation illustration (`StationSection` SVG), `Segmented pill`, `GateSelector chips`, `RouteSteps` |

The Station sheet, the 3D panel and the Inside-route screen deliberately share `TrainCard`, `GateSelector` and `RouteSteps`; **do not write a second version for the 3D view.**

---

## 10. Screens and behaviour

Screens are thin: fetch/derive data → pass props to the components in §9.5. Wireframes below show behaviour, not styling.

### 10.1 Navigation

Bottom tabs (`TabBar`): **Live** (map) · **Stations** · **Journey** · **Card** · **More**. Timetable is reachable from Journey and Stations (and More). Rider mode is a floating action on Live and a `RideBanner` while active.

### 10.2 Onboarding (first launch, 3 cards)

1. "See the metro move, live." (3D map preview)
2. "Help others by sharing your ride." (explain anonymous sharing)
3. Language + theme pick, then "Start". Location permission is requested **later**, in context.

### 10.3 Live (home)

```
┌──────────────────────────────┐
│ 🔍 Station or place     ◐ বাং │  floating search + language
│      (3D pitched map)        │
│   ● Mirpur-11   ▶ T-17 LIVE  │
│     ╲___ metro line ___      │
│                  ▶ T-21 ~    │  dashed = estimated
│                    ┌───────┐ │
│                    │ 🚆 Ride│ │  FAB: "I'm on the metro"
├──────────────────────────────┤
│ Next trains near you         │
│ Farmgate → Motijheel 2 min   │
└──────────────────────────────┘
```

Tap train → Train sheet (`TrainIllustration`, `LineDiagram`, rider count, Live/Estimated). Tap station → Station sheet. Top-right `ConnectionPill` (Live / Reconnecting / Offline = timetable only). Compass, 2D/3D tilt, locate-me.

### 10.4 Station sheet

```
Farmgate · ফার্মগেট                ☆
[এমআরটি লাইন ৬] [২২০ মি. দূরে]
Platform 1 → Motijheel
  2 min   LIVE   T-17
  ~9 min  Estimated
Platform 2 → Uttara North
  5 min   LIVE   T-12
[ স্টেশন ৩ডি দেখুন ]  [ গেট A B C D ]
Today: 06:30 – 22:30
```

Countdowns tick every second. "Today" window comes from the day-type bands (§4.2).

### 10.5 Rider mode

1. Tap 🚆 → sheet "Are you on the metro?" `[Yes, share my ride]` `[Not now]`.
2. Permission explainer (once) → OS prompt.
3. Active: `RideBanner` "Sharing • Mirpur-10 → Kazipara • helping N riders", stop button.
4. Auto-end at terminal or when leaving the corridor: "Thanks! You helped N riders." (no personal stats stored server-side).

### 10.6 Journey

From / To pickers (swap) → next 3 trains (departure, arrival, duration, fare, LIVE/EST). "Share ETA". Works offline via the timetable.

### 10.7 Timetable

`Segmented` (Sun–Thu | Fri | Sat) + direction → band rows `08:11–10:00 · every 5 min`, current band highlighted. Footer: source + last updated.

### 10.8 Gates A B C D and inside route

See §18. Gates screen = plan map + `GateSelector cards`; Inside route = side elevation + `GateSelector chips` + `RouteSteps`. Both screens and the 3D panel read the same `useStationGates(stationId)` hook.

### 10.9 Station 3D view

Full spec in §19. The page is a `Station3DScene` plus the panel built from catalog components.

### 10.10 Card (NFC), balance, trip history

- **Card tap:** "Hold your card to the back of the phone" → read → Balance screen. Feasibility gate: §18.4.
- **Balance:** `BalanceCard` (balance, last tap, card tail) + recent `TransactionRow`s.
- **Trip history:** `SummaryCard` (month trips, total spend), `Segmented tabs` (সব / যাত্রা / রিচার্জ), grouped by day. History is stored **only on the phone** (MMKV, encrypted), with a "clear" action. Amounts in the design are samples.

### 10.11 More

Language, theme, notifications, privacy & data, about/credits (OSM, OpenFreeMap, licences), report a problem, unofficial disclaimer. Built from `ListRow` + `SwitchRow`.

### 10.12 Empty/edge states (`EmptyState`)

Offline (timetable-only), GPS denied (viewer mode works), no live data (all Estimated), service not running ("First train 06:30"), Friday morning ("Service starts 15:00"), 3D not supported (fall back to the Inside-route 2D screen).

---

## 11. Repository layout

```
dhaka-metro-live/
├─ apps/
│  ├─ mobile/                       # Expo + TS
│  │  ├─ app/                       # expo-router routes: thin, assemble components only
│  │  │  ├─ (tabs)/{index,stations,journey,card,more}.tsx
│  │  │  ├─ station/[id]/{index,gates,route,3d}.tsx
│  │  │  ├─ train/[id].tsx  timetable.tsx  history.tsx  rider.tsx
│  │  │  └─ dev/gallery.tsx         # lists every component gallery (dev only)
│  │  ├─ src/
│  │  │  ├─ theme/{tokens.ts,useTheme.ts,fonts.ts}
│  │  │  ├─ components/
│  │  │  │  ├─ ui/                  # Text Icon Button IconButton Chip StatusBadge Card ListRow IconTile
│  │  │  │  │                       # SectionLabel Segmented InfoNote SwitchRow Sheet Screen
│  │  │  │  ├─ metro/               # TabBar ScreenHeader StationHeader DepartureRow PlatformGroup TrainCard
│  │  │  │  │                       # CoachCrowdBar LineDiagram GateSelector RouteSteps TransactionRow
│  │  │  │  │                       # BalanceCard SummaryCard RideBanner ConnectionPill TrainIllustration EmptyState
│  │  │  │  ├─ map/                 # MapView3D TrainMarker StationPin GatePin LineLayer WalkingPathLayer
│  │  │  │  └─ station3d/           # Station3DScene SceneTag ShotSwitcher SceneToggles + scene/ (builders)
│  │  │  ├─ features/{map,rider,timetable,journey,stations,gates,card,history}/   # hooks + mappers only
│  │  │  ├─ lib/{ws.ts,geo.ts,interpolate.ts,schedule.ts,i18n.ts,fmt.ts}
│  │  │  ├─ store/                  # zustand
│  │  │  └─ data/{stations.json,line6.geojson,timetable.json,fares.json,gates.json}
│  │  └─ app.config.ts
│  └─ server/                       # Go
│     ├─ cmd/api/main.go
│     ├─ internal/{http,ws,fusion,schedule,geo,store,config}/
│     ├─ migrations/
│     └─ Dockerfile
├─ tools/
│  ├─ fetch-osm/                    # builds stations.json + line6.geojson (+ gate candidates)
│  └─ simulator/                    # fake riders (GPX replay + noise)
├─ docker-compose.yml
└─ docs/BUILD_SPEC.md               # this file
```

Share the schedule logic between app and server by implementing it **once in Go**, mirrored in TypeScript, and cross-tested against the same golden vectors (`tools/testdata/schedule_cases.json`).

---


## 12. Mobile implementation notes

- **Map setup:** `MapLibre.Map` with the OpenFreeMap style URL; add `fill-extrusion` on source-layer `building` using `render_height` / `render_min_height`; `pitch: 60`, `bearing` following the line direction; restrict camera to a Dhaka bounding box.
- **Line:** one `ShapeSource` (GeoJSON from `line6.geojson`) with casing + stroke layers. Stations as `CircleLayer` + labels (`Hind Siliguri` glyphs: if the basemap style lacks Bangla glyphs, ship local glyph PBFs or render labels as RN views over the map).
- **Trains:** one `ShapeSource` updated at ~15–30 fps from `interpolate.ts`; `SymbolLayer` with rotation = bearing; `LIVE` gets a pulsing circle layer.
- **Background location (rider mode):**
  - Android: foreground service with a persistent notification; `accuracy: Balanced/High`, `distanceInterval: 0`, `timeInterval: 3000`.
  - iOS: `UIBackgroundModes: ["location"]`, `pausesLocationUpdatesAutomatically: false`, `activityType: AutomotiveNavigation`.
  - Batch fixes if the socket is down (max 20), drop older than 10 s.
- **Battery:** stop GPS immediately when the session ends; reduce rate to 1 fix / 8 s while dwelling at a station.
- **Offline:** timetable/stations/line are bundled; viewer mode degrades to Estimated trains computed locally with the same schedule engine.
- **i18n:** keys for every string; format numbers/time with Bangla digits when `lang = bn`; time format `h:mm` with "সকাল/দুপুর/বিকাল/সন্ধ্যা/রাত" period words.
- **Accessibility:** VoiceOver/TalkBack labels like "Farmgate station, next train to Motijheel in 2 minutes, live".

---

## 13. Backend implementation notes (Go)

- Package `fusion`: in-memory map of tracks guarded by a mutex, sharded by direction; 1 Hz tick that predicts, merges, expires, and publishes deltas to Redis channel `trains`.
- Package `geo`: polyline projection (planar UTM after `proj` transform), nearest-point with spatial index (segments in an R-tree or simple grid; the line is short, a linear scan over ~2–4 k segments is fine).
- Package `schedule`: pure functions (`Departures(dayType, dir, date)`, `Position(dep, t)`, `ETA(station, now)`); fully unit-tested with golden vectors.
- WebSocket hub: per-connection send buffer (drop oldest on overflow), 20 s ping, 64 KB read limit.
- Observability: counters for fixes accepted/rejected (by reason), active riders, tracks by state, WS clients.
- Data purge job: hourly delete from `raw_fixes`.
- Config via env: `DATABASE_URL`, `REDIS_URL`, `END_TO_END_MIN=40`, `DWELL_SEC=30`, `HOLIDAY_AS=fri`, `ALLOWED_ORIGINS`.
- Fares and station metadata loaded by an admin CLI (`cmd/admin import-fares fares.json`), not hard-coded.

---

## 14. Testing and validation

1. **Unit:** schedule generator reproduces the bands exactly (spot-check: Sun–Thu SB first departure 06:30, 07:30 is the 10-min band end, 08:11→10:00 every 5 min).
2. **Golden test:** `Departures(sun_thu, SB)` count and first/last values match §4.2.
3. **Simulator:** replay a synthetic ride along the real polyline with GPS noise (σ = 8 m), 5 s dwell jitter, plus 30% "bus below the viaduct" decoys; expect decoys to be rejected and the train track to stay within ±40 m.
4. **Field test:** 3 real rides on each phone OS; log battery % per 30 min (target < 6% for rider mode), compare marker vs. platform arrival time.
5. **Load:** 500 simulated viewers + 50 riders on one small VPS; p95 broadcast latency < 1.5 s.
6. **Components:** every component has a gallery entry and snapshot test per variant (light/dark, bn/en); lint check that `app/**` and `features/**` contain no `#RRGGBB` and no inline style objects; a CI script fails if a component is missing from the §9.4 catalog or the gallery.
7. **Edge cases:** tunnel/shadow GPS loss, app killed in background, clock skew, DST-less timezone handling, midnight rollover (service ends ~22:30), Bangla digits in the UI.


---

## 15. Build tasks (do in order; each has acceptance criteria)

The **component kit is built before any screen** (Task 2). From Task 6 on, screens are assembled only from the catalog in §9.4.

| # | Task | Acceptance |
|---|---|---|
| 1 | Repo scaffold; Expo app boots on Android + iOS dev builds; `theme/tokens.ts`, fonts, i18n (bn/en), light/dark | Empty tabs render; language + theme toggle work; tokens match §9.1 |
| 2 | **Component kit + gallery:** all `ui/` and `metro/` components in §9.4 with `types.ts` and `gallery.tsx`; `/dev/gallery` screen; lint rules | Every catalog component visible in the gallery in light + dark, bn + en, 130 % font; ESLint fails on hex colours / `StyleSheet` literals in `app/**` and `features/**` (`react-native/no-inline-styles`, `no-restricted-syntax` for `#RRGGBB`); snapshot tests per variant |
| 3 | `tools/fetch-osm`: `stations.json` + `line6.geojson` (+ gate candidate nodes) | 16 stations with chainage; one continuous line |
| 4 | Map screen: MapLibre + OpenFreeMap, 3D buildings, line, stations, attribution; `map/` components | Pitched map, line aligned to viaduct, credits visible |
| 5 | Schedule engine in TS + Go with shared golden tests | Tests pass for all 3 day types |
| 6 | Timetable + Station sheet + Journey (offline, schedule only) — **assembled from catalog** | Works in airplane mode; **zero new components** (if one is needed, extend a variant and add a gallery entry) |
| 7 | Gates A B C D + Inside-the-station route (`GateSelector`, `RouteSteps`, `station_gates` data) | Four gates per station from `gates.json`; unknown lift/escalator shown as "তথ্য শীঘ্রই" |
| 8 | Go backend: REST + WS hub + Postgres/Redis, Docker Compose | `/health`, `/stations`, `/stations/{id}/gates`, `/timetable`, `/ws` snapshot work |
| 9 | Estimated trains on the map from the schedule | Trains glide along the line at the right times |
| 10 | Fusion engine + simulator | Simulated ride appears as LIVE within 5 s; decoys rejected |
| 11 | Rider mode on device (permissions, background, scoring, banner, auto-stop) | A real ride is tracked for the whole trip; battery within target |
| 12 | **Station 3D scene** (§19) + panel from catalog; 2D fallback | 3D at ≥ 30 fps on a mid-range Android; arrival animation synced to real ETA; fallback screen when GL unavailable |
| 13 | Card (NFC) + Balance + Trip history — **only after §18.4 feasibility result** | Local-history path works even if NFC balance is not possible |
| 14 | Polish: animations, haptics, empty states, accessibility, push alerts | Meets §9; no layout break at 130 % font scale |
| 15 | Privacy policy, store listings, beta (TestFlight / Play internal), crash reporting | Both builds installable by testers |

### Prompt template for the AI assistant (per task)

> Read `docs/BUILD_SPEC.md`. Implement **Task N** only. Follow §3 (stack), §7 (API), and **§9 (tokens + component catalog)**. **Reuse components from §9.4; do not create a new component if a variant or prop can do it.** No hex colours, raw sizes or inline styles in `app/` or `features/`. If you add a component, add its `types.ts`, `gallery.tsx` entry and update §9.4. Do not use paid map APIs or copy third-party artwork. Add the tests in §14 that apply. Show the full file contents for every file you create or change. End your answer with a "Reused components" list and a "New components (justify)" list. Stop and ask if data marked `TO FETCH` or `UNVERIFIED` is needed.

---


## 16. Risks and mitigations

| Risk | Mitigation |
|---|---|
| **Cold start** — no riders sharing → no live data | Timetable fallback (clearly labelled); launch on a few stations first; one-tap "Train at station now" report; in-app invitation to share |
| Road users mistaken for train riders | Score in §6.2, direction + dwell pattern, outlier detach, "riders" count shown |
| iOS background location killed | Test early; use `AutomotiveNavigation` activity type, keep session short (≤ 90 min), clear user instructions |
| Battery drain | 3–5 s interval, stop on exit, slower rate while dwelling |
| Timetable differs from reality | Data-driven bands; backend learns real segment times; footer "Unofficial" |
| Unofficial data errors | Treat DTCA/Rapid Pass as truth; show "last verified" date; admin import |
| IP / branding | Own name, logo and art; no reuse of dhakametro.live assets or DMTCL marks |
| Free tile service limits | Self-host PMTiles with `go-pmtiles` as fallback |
| Apple/Google fees | Developer accounts: Apple $99/yr, Google Play $25 once (unavoidable) |

---

## 17. Open items (need a human decision or data)

1. `TO FETCH` — OSM track geometry and station coordinates (§4.3).
2. `TO FETCH` — official fare matrix (§4.5).
3. `UNVERIFIED` — public-holiday timetable (default Friday), end-to-end run time (40 min per the Daily Star infographic), dwell time (30 s), exact last-train departure.
4. App name, logo, domain (must not resemble "Dhaka Metro Live" or DMTCL marks).
5. Decide whether to apply for data-sharing permission from DMTCL (would enable official real-time feeds later).
6. `UNVERIFIED` — NFC balance readability (§18.4); per-station gate survey data (lifts, escalators, landmarks); station entrance design reference (to be supplied) for the 3D scene (§19.6).


---

## 18. Line facts, station gates A–D, inside route, NFC

### 18.1 Line facts (Daily Star / BSRM infographic; planning-stage figures, verify before showing as live data)

| Fact | Value |
|---|---|
| Length / type | 21.26 km, elevated |
| Full-line ride | ~40 minutes (Uttara → Kamalapur) |
| Fleet | 24 trains, 6 coaches each |
| Capacity | ~2,208 passengers per train |
| Projected headway | 3.3–4 minutes (a *target*; the timetable in §4.2 is what runs today) |
| Fares quoted | minimum Tk 20; Uttara North → Agargaon Tk 60; Uttara → Kamalapur Tk 100 |
| Accessibility on trains | reserved seats for wheelchair users, handrails |
| Route map order | Uttara (depot) → Uttara North → … → Motijheel → Kamalapur (see §1.4) |

Defaults only: `fares.json` seed (min 20, max 100) until the official matrix is loaded; `endToEndMin = 40`. Timetable headways in §4.2 always win over the 3.3–4 min target.

### 18.2 Station gates: A, B, C, D (every station)

Every station has **four entry/exit gates A, B, C, D**, one per corner of the nearest intersection (default NW = A, NE = B, SW = C, SE = D; override per station).

```sql
CREATE TABLE station_gates (
  station_id TEXT REFERENCES stations(id),
  gate CHAR(1) CHECK (gate IN ('A','B','C','D')),
  geom geography(Point,4326) NOT NULL,
  corner TEXT,                         -- 'NW' | 'NE' | 'SW' | 'SE'
  landmark_bn TEXT, landmark_en TEXT,  -- from field survey; NULL until known
  has_lift BOOLEAN, has_escalator BOOLEAN,  -- NULL = unknown (never guess)
  open_from TIME, open_to TIME,
  PRIMARY KEY (station_id, gate)
);
```

- Coordinates: OSM `railway=subway_entrance` / `entrance=*` nodes near each station; verify on site.
- Never show a lift/escalator badge unless the column is `TRUE`; show "তথ্য শীঘ্রই" when unknown.
- API: `GET /v1/stations/{id}/gates` → `[{gate, lat, lng, corner, landmarkBn, landmarkEn, hasLift, hasEscalator}]`. Also bundled as `data/gates.json` for offline.
- Behaviour: nearest gate by straight-line distance (MVP) is highlighted "কাছের গেট" (`GateSelector.recommended`); dashed walking path via `WalkingPathLayer`. Exit mode: choose the gate nearest to the user's destination.

### 18.3 Inside-the-station route (gate → platform)

Steps rendered by `RouteSteps`, in order: **Gate → stairs/lift to concourse → tap card at ticket gate → stairs/escalator to platform → platform 1 or 2 by direction** (platform 1 = towards Motijheel, platform 2 = towards Uttara North). Estimated walking time per gate is a static value until measured.

### 18.4 NFC balance feasibility (check before Task 13)

Reading a balance requires the card's data format and keys. If the MRT/Rapid Pass card is encrypted or proprietary, a third-party app cannot read it; fall back to card-number lookup via an official service, or keep history only from the user's own scans/rides stored on the phone. iOS: CoreNFC system scan sheet only. Android: `react-native-nfc-manager`. Confirm with DTCA/DMTCL or test a real card first. Balances and fares in the mockups are **samples**.

---

## 19. Station 3D scene (spec taken from the working prototype)

A working web prototype exists (`station-3d.html`, three.js r128, procedural geometry, no external models). The React Native version must reproduce the same scene logic. The scene is **our own art** — an isometric-style 3D diorama inspired by the reference video's four-shot flythrough, not a copy of its assets.

### 19.1 What the reference video does (analysis)

1. Exterior: station on the viaduct, vault roof, brick-red concourse facade.
2. Platform cutaway: roof lifts, train stands at the platform, platform labels.
3. City pull-out: pastel translucent blocks, yellow roads, pins for gates A/B/C/D.
4. Follow shot along the viaduct.
Style: pale beige ground, translucent pastel blocks, green vault roof, red-brown facade.

### 19.2 Improvements over the video (all implemented in the prototype)

| Improvement | Detail |
|---|---|
| Real data binding | Train arrival/dwell/departure is driven by the real ETA (live or schedule), not a loop |
| Live vs estimated | Every train card carries `StatusBadge` (live / estimated) |
| Coach crowding | 6 coach bars (low/mid/high) + "emptiest coach" hint; needs rider crowd reports (Phase 3), sample data in prototype and labelled as such |
| Gates | Tappable 3D pins A–D (west pair A,C; east pair B,D) synced with the panel `GateSelector`; Entry/Exit toggle |
| Walking route | Animated route tube + walker marker from the chosen gate to platform 1/2, with `RouteSteps` text |
| Roof-off switch | "ছাদ খুলে দেখুন" hides the vault roof to see inside |
| Shots | বাইরে · প্ল্যাটফর্ম · শহর · লাইন + auto tour |
| Day/night | Palette follows system theme (light/dark) |
| All stations | Station selector drives the same scene (name, direction labels, ETA) |
| Accessibility | Reduce-motion stops auto tour and camera easing; labels toggle; text panel contains everything the 3D shows; WebGL failure → fallback to Inside-route screen |

### 19.3 Scene graph and constants (keep identical in the RN port)

| Item | Value |
|---|---|
| Deck height | `DECK = 10` |
| Coach length | `CL = 19.2` ×6 coaches per train |
| Tracks | T1 southbound at `z = +5.2` moving +x (platform 1); T2 northbound at `z = −5.2` (platform 2) |
| Train cycle (demo) | `CYCLE = 40 s`: approach 15 s, dwell 9 s, depart remainder |
| Gate pins | A,C at `x = −68`, B,D at `x = +68`; `z = ∓17` |
| Layers | ground + roads; instanced buildings (translucent, 3 height classes); viaduct deck + piers + rails + overhead wires; station box (brick facade with window rows); vault roof (half cylinder, hidden by toggle); platforms; lifts; 2 trains (box-built 6 coaches in the livery colours); gate pins; route tube + walker; HTML/RN overlay tags |
| Camera shots | `exterior`, `platform` (roof cut), `city`, `line` — each `{position, target, cut}`; eased transitions ≈ 1.2 s |
| Controls | orbit (drag), pinch zoom, tap a pin to select a gate |
| Palettes | `PAL.day` / `PAL.night` mirror the app tokens (§9.1) |

### 19.4 Data in / out

```ts
interface Station3DProps {
  station: { id: string; nameBn: string; nameEn: string };
  trains: { platform: 1 | 2; etaSec?: number; state?: 'at_station' | 'departed'; source: 'live' | 'schedule'; trainId?: string; crowd?: number[] }[];
  gates: GateSelectorProps['gates'];
  selectedGate?: Gate; mode: 'entry' | 'exit';
  shot: 'exterior' | 'platform' | 'city' | 'line'; roofOpen: boolean; showCrowd: boolean; showLabels: boolean;
  onSelectGate(g: Gate): void; onShotChange(s: string): void;
}
```

The scene component is **controlled** by these props. The surrounding panel (`StationHeader`, `TrainCard`, `GateSelector`, `RouteSteps`, `SwitchRow`) is the same catalog used on 2D screens.

### 19.5 React Native implementation

- Preferred: `@react-three/fiber/native` + `expo-gl`, scene built in code (no `.glb` needed); use `InstancedMesh` for buildings/windows.
- Lighter option: React Native Skia 2.5D isometric version of the same layers, selected automatically on low-end devices.
- Overlay tags: project 3D anchor points to screen each frame and render RN `SceneTag` views (they stay crisp and accessible).
- Performance budget: ≤ 150 draw calls, ≤ 60 k triangles, 30 fps target, pixel ratio capped at 2, pause rendering when the screen is not focused or the app is backgrounded.
- Fallback: if GL context creation fails or reduce-motion + low-end, route to the Inside-route 2D screen (§10.8).
- Tests: scene logic (train position from ETA, gate → route curve) is pure TypeScript and unit-tested without GL.

### 19.6 Open items for the scene

1. Real per-station layout (number of entrances, concourse position, lifts) needs a survey; until then every station uses the same template with the correct name and gate corners.
2. Coach crowd data source (rider "how crowded?" tap, 3 levels, aggregated per coach) — not built in MVP; hide the crowd bars unless data exists.
3. Final art direction once the "entrance metro station design" reference is supplied.
