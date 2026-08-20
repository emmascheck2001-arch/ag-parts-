begin;

create table if not exists catalog_staging.function_rate_limits (
  scope_name text not null,
  actor_key text not null,
  window_start timestamptz not null,
  request_count integer not null default 0,
  updated_at timestamptz not null default now(),
  constraint function_rate_limits_scope_not_blank check (btrim(scope_name) <> ''),
  constraint function_rate_limits_actor_not_blank check (btrim(actor_key) <> ''),
  constraint function_rate_limits_request_count_positive check (request_count >= 0),
  primary key (scope_name, actor_key, window_start)
);

comment on table catalog_staging.function_rate_limits is
  'Per-caller request counters for rate-limited serverless functions.';

alter table catalog_staging.function_rate_limits enable row level security;

revoke all on catalog_staging.function_rate_limits from public, anon, authenticated;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant select, insert, update on catalog_staging.function_rate_limits to service_role';
  end if;
end;
$$;

drop function if exists catalog_staging.consume_function_rate_limit(text, text, integer, integer);

create function catalog_staging.consume_function_rate_limit(
  p_scope_name text,
  p_actor_key text,
  p_window_seconds integer,
  p_request_limit integer
)
returns table (
  allowed boolean,
  used integer,
  remaining integer,
  reset_at timestamptz
)
language plpgsql
security definer
set search_path = catalog_staging, pg_temp
as $$
declare
  bucket_start timestamptz;
  next_reset timestamptz;
begin
  if coalesce(btrim(p_scope_name), '') = '' then
    raise exception 'scope_name is required';
  end if;
  if coalesce(btrim(p_actor_key), '') = '' then
    raise exception 'actor_key is required';
  end if;
  if p_window_seconds <= 0 then
    raise exception 'window_seconds must be positive';
  end if;
  if p_request_limit <= 0 then
    raise exception 'request_limit must be positive';
  end if;

  bucket_start := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  next_reset := bucket_start + make_interval(secs => p_window_seconds);

  insert into catalog_staging.function_rate_limits as current_window (
    scope_name,
    actor_key,
    window_start,
    request_count,
    updated_at
  ) values (
    p_scope_name,
    p_actor_key,
    bucket_start,
    1,
    now()
  )
  on conflict (scope_name, actor_key, window_start)
  do update
    set request_count = current_window.request_count + 1,
        updated_at = now()
  returning request_count
  into used;

  allowed := used <= p_request_limit;
  remaining := greatest(p_request_limit - used, 0);
  reset_at := next_reset;
  return next;
end;
$$;

comment on function catalog_staging.consume_function_rate_limit(text, text, integer, integer) is
  'Atomically consumes one request from a caller-specific rate-limit bucket.';

revoke all on function catalog_staging.consume_function_rate_limit(text, text, integer, integer) from public, anon, authenticated;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant execute on function catalog_staging.consume_function_rate_limit(text, text, integer, integer) to service_role';
  end if;
end;
$$;

commit;
