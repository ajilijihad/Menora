-- Public menu analytics, plan retention, and custom-domain verification.
-- Apply after 20261013090000_platform_admin.sql.
-- Activation does not provision DNS or a certificate. A verified domain stays
-- unverified for routing until activate_custom_domain runs.

alter table public.analytics_events
  add column device_category text not null default 'unknown',
  add column referrer_source text not null default 'direct',
  add column menu_category_id uuid,
  add column hour_bucket bigint;

alter table public.analytics_events
  add constraint analytics_events_device_values
    check (device_category in ('mobile', 'tablet', 'desktop', 'unknown')),
  add constraint analytics_events_referrer_values
    check (referrer_source in ('direct', 'search', 'social', 'other')),
  add constraint analytics_events_category_fkey
    foreign key (menu_category_id)
    references public.menu_categories (id)
    on delete set null;

create or replace function public.set_analytics_hour_bucket()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.hour_bucket := floor(extract(epoch from new.occurred_at) / 3600)::bigint;
  return new;
end;
$$;

create trigger tr_analytics_events_hour_bucket
  before insert or update of occurred_at on public.analytics_events
  for each row execute function public.set_analytics_hour_bucket();

update public.analytics_events
set occurred_at = occurred_at;

alter table public.analytics_events
  alter column hour_bucket set not null;

create index analytics_events_visitor_occurred_idx
  on public.analytics_events (visitor_hash, occurred_at desc);

create unique index analytics_events_hour_dedupe_idx
  on public.analytics_events (
    business_id,
    event_name,
    coalesce(menu_product_id, '00000000-0000-0000-0000-000000000000'::uuid),
    visitor_hash,
    hour_bucket
  );

comment on column public.analytics_events.visitor_hash is
  'Daily hash used to collapse repeated views. It is not shown to businesses.';

alter table public.custom_domains
  add column verification_token text not null default md5(random()::text || clock_timestamp()::text),
  add column verified_at timestamptz,
  add column last_checked_at timestamptz;

alter table public.custom_domains
  drop constraint custom_domains_status_values;

alter table public.custom_domains
  add constraint custom_domains_status_values
    check (status in ('pending', 'verified', 'active', 'disabled')),
  add constraint custom_domains_active_requires_verification
    check (status <> 'active' or verified_at is not null),
  add constraint custom_domains_token_format
    check (verification_token ~ '^[a-f0-9]{32}$');

create unique index custom_domains_one_open_idx
  on public.custom_domains (business_id)
  where status in ('pending', 'verified', 'active');

comment on column public.custom_domains.verified_at is
  'Set when the TXT ownership record matches. It does not mean the hostname is being served.';

create table public.platform_hosts (
  hostname text primary key,
  created_at timestamptz not null default now(),
  constraint platform_hosts_hostname_format check (
    hostname ~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$'
  )
);

comment on table public.platform_hosts is
  'Hostnames that belong to this deployment. Customers cannot claim them.';

alter table public.platform_hosts enable row level security;
alter table public.platform_hosts force row level security;
revoke all on table public.platform_hosts from public, anon, authenticated;
grant all on table public.platform_hosts to service_role;

drop policy if exists analytics_events_select on public.analytics_events;
drop policy if exists custom_domains_select on public.custom_domains;

create policy analytics_events_select
  on public.analytics_events
  for select
  to authenticated
  using (
    public.is_platform_admin()
    or (
      public.is_business_member(business_id)
      and occurred_at >= public.analytics_visible_from(business_id)
    )
  );

create policy custom_domains_select
  on public.custom_domains
  for select
  to anon, authenticated
  using (
    public.is_business_member(business_id)
    or public.is_platform_admin()
    or (
      status = 'active'
      and verified_at is not null
      and public.business_is_public(business_id)
    )
  );

create or replace function public.record_public_analytics(
  target_slug text,
  target_event text,
  target_product_id uuid,
  target_device text,
  target_referrer text,
  target_visitor_hash text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  found_business uuid;
  found_category uuid;
  product_id uuid;
  device text;
  referrer text;
  bucket bigint;
begin
  if target_visitor_hash is null or target_visitor_hash !~ '^[a-f0-9]{64}$' then
    return false;
  end if;

  if target_event not in ('menu_view', 'product_view') then
    return false;
  end if;

  if target_slug is null
    or target_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    or char_length(target_slug) > 60
  then
    return false;
  end if;

  select businesses.id
  into found_business
  from public.businesses
  where businesses.slug = target_slug
    and businesses.status = 'active'
    and businesses.is_published
    and businesses.suspended_at is null;

  if found_business is null then
    return false;
  end if;

  if (
    select count(*)
    from public.analytics_events
    where analytics_events.business_id = found_business
      and analytics_events.occurred_at > now() - interval '1 minute'
  ) >= 60
  then
    return false;
  end if;

  if (
    select count(*)
    from public.analytics_events
    where analytics_events.visitor_hash = target_visitor_hash
      and analytics_events.occurred_at > now() - interval '1 hour'
  ) >= 12
  then
    return false;
  end if;

  device := case
    when target_device in ('mobile', 'tablet', 'desktop', 'unknown') then target_device
    else 'unknown'
  end;
  referrer := case
    when target_referrer in ('direct', 'search', 'social', 'other') then target_referrer
    else 'direct'
  end;

  if target_event = 'menu_view' then
    product_id := null;
    found_category := null;
  else
    if target_product_id is null or not public.product_is_public(target_product_id) then
      return false;
    end if;

    select menu_products.category_id
    into found_category
    from public.menu_products
    where menu_products.id = target_product_id
      and menu_products.business_id = found_business;

    if found_category is null then
      return false;
    end if;
    product_id := target_product_id;
  end if;

  insert into public.analytics_events (
    business_id,
    menu_product_id,
    menu_category_id,
    event_name,
    visitor_hash,
    device_category,
    referrer_source
  )
  values (
    found_business,
    product_id,
    found_category,
    target_event,
    target_visitor_hash,
    device,
    referrer
  )
  on conflict do nothing;

  return true;
end;
$$;

create or replace function public.business_analytics_summary(
  target_business_id uuid,
  range_start timestamptz,
  range_end timestamptz
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  visible_from timestamptz;
  start_at timestamptz;
  end_at timestamptz;
begin
  if not (public.is_business_member(target_business_id) or public.is_platform_admin()) then
    return null;
  end if;

  visible_from := public.analytics_visible_from(target_business_id);
  if visible_from is null then
    return null;
  end if;

  end_at := least(coalesce(range_end, now()), now() + interval '1 day');
  start_at := greatest(coalesce(range_start, visible_from), visible_from);
  if end_at - start_at > interval '367 days' then
    start_at := end_at - interval '366 days';
  end if;
  if start_at < visible_from then
    start_at := visible_from;
  end if;
  if end_at < start_at then
    end_at := start_at;
  end if;

  return jsonb_build_object(
    'from', start_at,
    'to', end_at,
    'menuViews', (
      select count(*)
      from public.analytics_events
      where business_id = target_business_id
        and event_name = 'menu_view'
        and occurred_at >= start_at
        and occurred_at < end_at
    ),
    'productViews', (
      select count(*)
      from public.analytics_events
      where business_id = target_business_id
        and event_name = 'product_view'
        and occurred_at >= start_at
        and occurred_at < end_at
    ),
    'days', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'day', ((day at time zone 'UTC')::date)::text,
        'menu', menu_count,
        'product', product_count
      ) order by day), '[]'::jsonb)
      from (
        select
          series.day,
          count(analytics_events.id) filter (where analytics_events.event_name = 'menu_view') as menu_count,
          count(analytics_events.id) filter (where analytics_events.event_name = 'product_view') as product_count
        from generate_series(
          date_trunc('day', start_at),
          greatest(date_trunc('day', start_at), date_trunc('day', end_at - interval '1 second')),
          interval '1 day'
        ) as series(day)
        left join public.analytics_events
          on analytics_events.business_id = target_business_id
          and (analytics_events.occurred_at at time zone 'UTC')::date = (series.day at time zone 'UTC')::date
          and analytics_events.occurred_at >= start_at
          and analytics_events.occurred_at < end_at
        group by series.day
      ) daily
    ),
    'devices', (
      select coalesce(jsonb_agg(jsonb_build_object('device', device_category, 'views', views) order by views desc), '[]'::jsonb)
      from (
        select device_category, count(*) as views
        from public.analytics_events
        where business_id = target_business_id
          and event_name = 'menu_view'
          and occurred_at >= start_at
          and occurred_at < end_at
        group by device_category
      ) grouped
    ),
    'referrers', (
      select coalesce(jsonb_agg(jsonb_build_object('source', referrer_source, 'views', views) order by views desc), '[]'::jsonb)
      from (
        select referrer_source, count(*) as views
        from public.analytics_events
        where business_id = target_business_id
          and event_name = 'menu_view'
          and occurred_at >= start_at
          and occurred_at < end_at
        group by referrer_source
      ) grouped
    ),
    'products', (
      select coalesce(jsonb_agg(jsonb_build_object('id', id, 'name', name, 'views', views) order by views desc, name), '[]'::jsonb)
      from (
        select menu_products.id, menu_products.name, count(*) as views
        from public.analytics_events
        join public.menu_products
          on menu_products.id = analytics_events.menu_product_id
          and menu_products.business_id = analytics_events.business_id
        where analytics_events.business_id = target_business_id
          and analytics_events.event_name = 'product_view'
          and analytics_events.occurred_at >= start_at
          and analytics_events.occurred_at < end_at
        group by menu_products.id, menu_products.name
        order by views desc, menu_products.name
        limit 20
      ) grouped
    ),
    'categories', (
      select coalesce(jsonb_agg(jsonb_build_object('id', id, 'name', name, 'views', views) order by views desc, name), '[]'::jsonb)
      from (
        select menu_categories.id, menu_categories.name, count(*) as views
        from public.analytics_events
        join public.menu_categories
          on menu_categories.id = analytics_events.menu_category_id
          and menu_categories.business_id = analytics_events.business_id
        where analytics_events.business_id = target_business_id
          and analytics_events.event_name = 'product_view'
          and analytics_events.occurred_at >= start_at
          and analytics_events.occurred_at < end_at
        group by menu_categories.id, menu_categories.name
        order by views desc, menu_categories.name
        limit 20
      ) grouped
    )
  );
end;
$$;

create or replace function public.register_platform_host(target_hostname text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized text := lower(btrim(coalesce(target_hostname, '')));
begin
  normalized := regexp_replace(normalized, '\.$', '');
  if normalized !~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$'
    or char_length(normalized) > 253
  then
    raise exception 'hostname_invalid' using errcode = '23514';
  end if;

  insert into public.platform_hosts (hostname)
  values (normalized)
  on conflict do nothing;
end;
$$;

create or replace function public.submit_custom_domain(
  target_business_id uuid,
  target_hostname text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized text := lower(btrim(coalesce(target_hostname, '')));
  created_id uuid;
begin
  if not public.has_business_role(target_business_id, array['owner', 'manager']) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if not public.custom_domains_allowed(target_business_id) then
    raise exception 'custom_domain_locked' using errcode = '23514';
  end if;

  if not exists (select 1 from public.platform_hosts) then
    raise exception 'platform_host_unregistered' using errcode = '23514';
  end if;

  normalized := regexp_replace(normalized, '\.$', '');
  if normalized !~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$'
    or char_length(normalized) > 253
    or normalized ~ '^[0-9.]+$'
    or normalized = 'localhost'
    or normalized like '%.local'
    or normalized like '%.localhost'
    or exists (select 1 from public.platform_hosts where platform_hosts.hostname = normalized)
  then
    raise exception 'hostname_invalid' using errcode = '23514';
  end if;

  if exists (
    select 1
    from public.custom_domains
    where custom_domains.business_id = target_business_id
      and custom_domains.status in ('pending', 'verified', 'active')
  ) then
    raise exception 'domain_exists' using errcode = '23505';
  end if;

  insert into public.custom_domains (business_id, hostname, status)
  values (target_business_id, normalized, 'pending')
  returning id into created_id;

  return created_id;
exception
  when unique_violation then
    raise exception 'hostname_taken' using errcode = '23505';
end;
$$;

create or replace function public.begin_domain_check(target_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  row public.custom_domains%rowtype;
begin
  select *
  into row
  from public.custom_domains
  where custom_domains.id = target_id;

  if row.id is null or not public.has_business_role(row.business_id, array['owner', 'manager']) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if row.status not in ('pending', 'verified') then
    raise exception 'domain_not_pending' using errcode = '23514';
  end if;

  if row.last_checked_at is not null and row.last_checked_at > now() - interval '30 seconds' then
    raise exception 'rate_limited' using errcode = '23514';
  end if;

  update public.custom_domains
  set last_checked_at = now()
  where id = row.id;

  return jsonb_build_object(
    'hostname', row.hostname,
    'token', row.verification_token,
    'status', row.status
  );
end;
$$;

create or replace function public.confirm_custom_domain(target_id uuid, observed_token text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  row public.custom_domains%rowtype;
begin
  select *
  into row
  from public.custom_domains
  where custom_domains.id = target_id
  for update;

  if row.id is null
    or row.status not in ('pending', 'verified')
    or observed_token is distinct from row.verification_token
    or not public.custom_domains_allowed(row.business_id)
  then
    return 'rejected';
  end if;

  update public.custom_domains
  set
    status = 'verified',
    verified_at = coalesce(verified_at, now())
  where id = row.id;

  return 'verified';
end;
$$;

create or replace function public.activate_custom_domain(target_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  row public.custom_domains%rowtype;
begin
  select *
  into row
  from public.custom_domains
  where custom_domains.id = target_id
  for update;

  if row.id is null or row.verified_at is null or row.status <> 'verified' then
    raise exception 'domain_not_verified' using errcode = '23514';
  end if;

  if not public.custom_domains_allowed(row.business_id) then
    raise exception 'custom_domain_locked' using errcode = '23514';
  end if;

  update public.custom_domains
  set status = 'active'
  where id = row.id;
end;
$$;

create or replace function public.active_menu_host(target_host text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select businesses.slug
  from public.custom_domains
  join public.businesses on businesses.id = custom_domains.business_id
  where custom_domains.hostname = lower(btrim(coalesce(target_host, '')))
    and custom_domains.status = 'active'
    and custom_domains.verified_at is not null
    and public.custom_domains_allowed(custom_domains.business_id)
    and public.business_is_public(custom_domains.business_id)
  limit 1;
$$;

create or replace function public.sync_business_domains(target_business_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (public.is_business_member(target_business_id) or public.is_platform_admin()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  update public.custom_domains
  set status = 'disabled'
  where custom_domains.business_id = target_business_id
    and custom_domains.status in ('pending', 'verified', 'active')
    and not public.custom_domains_allowed(target_business_id);
end;
$$;

create or replace function public.maintain_public_analytics()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  purged integer := 0;
  disabled integer := 0;
begin
  with doomed as (
    select analytics_events.id
    from public.analytics_events
    where analytics_events.occurred_at < coalesce(
      (
        select now() - make_interval(days => subscription_plans.analytics_retention_days)
        from public.subscription_plans
        where subscription_plans.id = public.current_plan_id(analytics_events.business_id)
      ),
      now() - interval '7 days'
    )
    limit 2000
  )
  delete from public.analytics_events
  where id in (select doomed.id from doomed);
  get diagnostics purged = row_count;

  update public.custom_domains
  set status = 'disabled'
  where status in ('pending', 'verified', 'active')
    and not public.custom_domains_allowed(business_id);
  get diagnostics disabled = row_count;

  return jsonb_build_object('purged', purged, 'disabled', disabled);
end;
$$;

revoke all on function public.record_public_analytics(text, text, uuid, text, text, text) from public;
revoke all on function public.business_analytics_summary(uuid, timestamptz, timestamptz) from public;
revoke all on function public.register_platform_host(text) from public;
revoke all on function public.submit_custom_domain(uuid, text) from public;
revoke all on function public.begin_domain_check(uuid) from public;
revoke all on function public.confirm_custom_domain(uuid, text) from public;
revoke all on function public.activate_custom_domain(uuid) from public;
revoke all on function public.active_menu_host(text) from public;
revoke all on function public.sync_business_domains(uuid) from public;
revoke all on function public.maintain_public_analytics() from public;

grant execute on function public.record_public_analytics(text, text, uuid, text, text, text) to anon, authenticated, service_role;
grant execute on function public.business_analytics_summary(uuid, timestamptz, timestamptz) to authenticated, service_role;
grant execute on function public.register_platform_host(text) to service_role;
grant execute on function public.submit_custom_domain(uuid, text) to authenticated, service_role;
grant execute on function public.begin_domain_check(uuid) to authenticated, service_role;
grant execute on function public.confirm_custom_domain(uuid, text) to service_role;
grant execute on function public.activate_custom_domain(uuid) to service_role;
grant execute on function public.active_menu_host(text) to anon, authenticated, service_role;
grant execute on function public.sync_business_domains(uuid) to authenticated, service_role;
grant execute on function public.maintain_public_analytics() to service_role;
