# Metro Koi (মেট্রো কই)

Unofficial live tracker for Dhaka MRT Line 6, built from
[`DHAKA_METRO_LIVE_BUILD_SPEC.md`](DHAKA_METRO_LIVE_BUILD_SPEC.md).
Train positions come from riders who opt in to share GPS; the timetable is the
fallback and is always labelled *Estimated*.

```
frontend/   Expo SDK 58 · React Native · TypeScript · expo-router   (the app UI)
backend/    Go 1.27 · chi · WebSocket · PostgreSQL/PostGIS · Redis  (API + fusion engine)
```

## Run it

**Backend** (runs fully in memory, with no database needed for development):

```bash
cd backend
go run ./cmd/api                                  # http://localhost:8080
go run ./cmd/simulator -trains 4 -riders 3 -decoys 1   # optional: fake live riders
```

**Frontend**:

```bash
cd frontend
npm install
npx expo start            # press w for web, or scan with Expo Go
# phone on the same Wi-Fi: EXPO_PUBLIC_API_URL=http://<your-PC-IP>:8080 npx expo start
```

The app works offline too. With no backend it shows timetable estimates and
the connection pill reads *Offline · timetable only*.

**Production stack** (PostGIS + Redis + migrations + API):

```bash
cd backend
docker compose up -d --build
docker compose run --rm admin seed
```

## Checks

| Command | What it verifies |
|---|---|
| `cd frontend && npm run verify` | TypeScript, schedule engine golden tests, UI rules (no hex/inline styles in `src/app` or `src/features`; every component has `index/types/gallery` and a gallery entry) |
| `cd backend && go test ./...` | golden schedule vectors, UTM/snap geometry, fusion engine with 30 % bus decoys over 8 random seeds (max error ≈ 17 m, target ±40 m), end-to-end REST + WebSocket ride → LIVE |

Both engines read the same golden file, `backend/testdata/schedule_cases.json`.
Its values were generated independently of either engine.

## Data provenance

| Data | Source | Status |
|---|---|---|
| Timetable bands | DTCA / Rapid Pass (`metro.pdf`), spec §4.2 | verified 2026-11-06 |
| Station coordinates, chainage, track | OpenStreetMap relation 15060935 via `go run ./cmd/fetch-osm` (© OSM contributors, ODbL) | fetched 2026-11-06 · **still needs the satellite sanity check (spec §4.3 step 5)** |
| Gates A–D | default corners (spec §18.2) | coordinates, lifts and landmarks need a field survey; 5 OSM entrance candidates in `data/gate_candidates.json` |
| Fares | — | **TO FETCH**: official DMTCL chart → `admin import-fares`; the app shows "Fare chart unavailable" until then |
| End-to-end 40 min, dwell 30 s, holiday = Friday | spec §4.4 | UNVERIFIED defaults (env `END_TO_END_MIN`, `DWELL_SEC`, `HOLIDAY_AS`) |

## Status vs. spec build tasks (§15)

| # | Task | Status |
|---|---|---|
| 1–2 | Scaffold, tokens, i18n (bn/en), light/dark, component kit + `/dev/gallery` + rule check | done |
| 3 | `fetch-osm` → stations.json, line6.geojson, gate candidates | done |
| 4 | Map | real OSM track drawn as SVG (works in Expo Go/web). The MapLibre 3D basemap (needs a dev build) drops in behind the same `MapView3D` props |
| 5 | Schedule engine TS + Go, shared golden tests | done |
| 6–7 | Timetable, Station, Journey, Gates, Inside-route screens | done (offline-capable) |
| 8 | Go REST + WS + Postgres/Redis + Docker Compose | done |
| 9–10 | Estimated trains, fusion engine + simulator | done |
| 11 | Rider mode on device | flow, permissions, streaming done; background location and battery need real-device field tests |
| 12 | Station 3D scene (three.js / r3f) | **not built**: the screen and panel exist, and the scene area uses the 2D cross-section fallback |
| 13 | NFC | balance + last ~20 trips read from MRT / Rapid Pass (FeliCa, read-only) — see `NFC_CARD_READING.md`. Needs a dev/store build (not Expo Go); decoder unit-tested, **not yet tested on a real card** |
| 14–15 | Polish, push alerts, store release | not started |
