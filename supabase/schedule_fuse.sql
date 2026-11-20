-- Run AFTER deploying the "fuse" edge function (see supabase/README.md). Replace the two <placeholders>.
-- Calls the function every minute; each call keeps ticking for ~55 s and a lock stops overlapping runs.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- the shared secret the function checks (same value as the FUSE_SECRET function secret)
select vault.create_secret('<A-LONG-RANDOM-STRING>', 'fuse_secret')
where not exists (select 1 from vault.secrets where name = 'fuse_secret');

select cron.unschedule('fuse-tick') where exists (select 1 from cron.job where jobname = 'fuse-tick');
select cron.schedule('fuse-tick', '* * * * *', $$
  select net.http_post(
   url := 'https://obohkkgjkjvykzerndgu.supabase.co/functions/v1/fuse',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-fuse-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'fuse_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 70000
  );
$$);
