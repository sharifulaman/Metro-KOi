# Supabase backend

The whole backend (the old Go server was removed). Parts:

| File | What |
|---|---|
| `schema.sql` + `seed_timetable.sql` | Step 1: timetable table the app reads |
| `schema_live.sql` | Step 2: `rider_events`, `trains`, `fusion_state` tables + RLS |
| `functions/fuse/` | Step 2: edge function = the fusion engine |
| `schedule_fuse.sql` | Calls the function every minute via pg_cron |

How live trains flow: phone inserts `rider_events` (start / fix / stop) -> `fuse` reads them, runs the Kalman
fusion, broadcasts `trains` / `ack` on Realtime channel `live` and keeps the `trains` table as the connect-time snapshot
-> phones render it exactly as they rendered the WebSocket messages.

## Deploy (once)

```
# 1. SQL Editor: run schema_live.sql
# 2. From the repo root:
npx supabase login
npx supabase link --project-ref <PROJECT-REF>
npx supabase secrets set FUSE_SECRET=<A-LONG-RANDOM-STRING>
npx supabase functions deploy fuse --no-verify-jwt
# 3. SQL Editor: edit the two placeholders in schedule_fuse.sql (same secret, project ref), run it
```

Check it: `select * from cron.job_run_details order by start_time desc limit 5;` and the function logs in the
dashboard. A healthy run answers `{"ticks":27,"events":0,"sessions":0,"tracks":0}`.

## Tests / regenerating data

```
node --test supabase/functions/fuse/engine.test.ts
node scripts/gen-fuse-data.mjs        # after changing supabase/data/stations.json, line6.json or timetable.json
```

## Limits to know (free plan)

- Rider events are written by the anon key (insert-only, RLS). Anyone with the app's key can insert junk rows; the
  engine validates every fix (accuracy, distance from the line, speed, rate), same as the Go server.
- A new ride can wait a few seconds for its `ack` while the function restarts between cron runs; the app allows 20 s.
- The function polls the database every 2 s while running (about 1.3 M tiny reads a month).
