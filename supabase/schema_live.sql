-- Step 2 (live trains). Run in Supabase: SQL Editor -> New query -> paste -> Run. Safe to re-run.
-- The live-train server: the app inserts rider events here and listens on the Realtime
-- channel "live"; the edge function "fuse" (supabase/functions/fuse) turns events into train positions.

-- What the phones send (rider.start / rider.fix / rider.stop / report.station). Insert-only for the app.
create table if not exists public.rider_events (
  id bigint generated always as identity primary key,
  kind text not null check (kind in ('start', 'fix', 'stop', 'report')),
  session_id text not null check (char_length(session_id) between 1 and 64),
  device_id text check (char_length(device_id) <= 64),
  payload jsonb not null default '{}'::jsonb check (pg_column_size(payload) < 1024),
  created_at timestamptz not null default now()
);
alter table public.rider_events enable row level security;
drop policy if exists "app can send rider events" on public.rider_events;
create policy "app can send rider events" on public.rider_events
  for insert to anon, authenticated with check (true);
-- no select policy: the app can never read other riders' fixes.

-- Current published trains: the snapshot a phone loads when it connects. Read-only for the app.
create table if not exists public.trains (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.trains enable row level security;
drop policy if exists "trains are public read" on public.trains;
create policy "trains are public read" on public.trains for select to anon, authenticated using (true);

-- Fusion engine state between edge-function runs. No policies: only the service role can touch it.
create table if not exists public.fusion_state (
  id int primary key check (id = 1),
  state jsonb not null default '{}'::jsonb,
  last_event_id bigint not null default 0,
  lock_until timestamptz not null default to_timestamp(0)
);
alter table public.fusion_state enable row level security;
insert into public.fusion_state (id) values (1) on conflict do nothing;

-- Drop events older than a day (hourly).
create extension if not exists pg_cron;
select cron.unschedule('purge-rider-events') where exists (select 1 from cron.job where jobname = 'purge-rider-events');
select cron.schedule('purge-rider-events', '17 * * * *', $$delete from public.rider_events where created_at < now() - interval '1 day'$$);
