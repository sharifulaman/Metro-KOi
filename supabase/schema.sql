-- Run in Supabase: SQL Editor -> New query -> paste -> Run.
-- Step 1 (static data): the whole timetable is one JSON document, same shape as GET /v1/timetable.
create table if not exists public.timetable (
  id int primary key check (id = 1),
  version text not null,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.timetable enable row level security;

-- The app (anon key) may only read. Writes need the service role / SQL editor.
drop policy if exists "timetable is public read" on public.timetable;
create policy "timetable is public read" on public.timetable
  for select to anon, authenticated using (true);
