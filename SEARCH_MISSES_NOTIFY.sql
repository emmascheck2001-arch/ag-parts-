-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: demand capture on search_misses
--
-- Adds contact + machine columns so an unanswered search can become a
-- contactable lead ("Notify me when a dealer lists this"), and grants the
-- anon role the UPDATE needed for the notify upsert (lib/index-store.logMiss
-- does upsert ... on conflict (query) do update when an email is provided).
--
-- Idempotent — safe to run more than once. Run in the Supabase SQL editor.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. New columns (no-op if they already exist).
alter table search_misses add column if not exists notify_email text;
alter table search_misses add column if not exists machine      text;
alter table search_misses add column if not exists notified_at  timestamptz; -- set when we email them

-- 2. The notify path upserts on conflict (query) DO UPDATE, which needs an
--    UPDATE policy in addition to the existing "anon insert misses" insert
--    policy. Bare misses (insert ... on conflict do nothing) already work.
do $$ begin
  create policy "anon update misses" on search_misses
    for update using (true) with check (true);
exception when duplicate_object then null; end $$;

-- 3. Find leads fast (rows where a farmer asked to be notified).
create index if not exists idx_search_misses_notify
  on search_misses (last_seen desc)
  where notify_email is not null;
