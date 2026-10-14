-- Removes platform administrator appointments, suspension, and audit records.

drop function if exists public.admin_note_refund(uuid, text);
drop function if exists public.admin_set_business_suspension(uuid, boolean, text);
drop function if exists public.admin_adjust_subscription(uuid, text, text);
drop function if exists public.admin_save_plan(uuid, text, text, text, integer, text, boolean, integer, integer, integer, integer, boolean, text);
drop function if exists public.admin_write_audit(uuid, text, text, uuid, text, jsonb, jsonb);
drop function if exists public.admin_require(text);

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select profiles.is_platform_admin
      from public.profiles
      where profiles.id = auth.uid()
    ),
    false
  );
$$;

create or replace function public.business_is_public(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.businesses
    where businesses.id = target_business_id
      and businesses.status = 'active'
      and businesses.is_published
  );
$$;

create or replace function public.published_business(target_slug text)
returns table (
  id uuid,
  name text,
  slug text,
  description text,
  currency text,
  business_type text,
  logo_path text,
  cover_path text,
  phone text,
  address text,
  map_url text,
  opening_hours jsonb,
  social_links jsonb,
  default_language text,
  time_zone text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    businesses.id,
    businesses.name,
    businesses.slug,
    businesses.description,
    businesses.currency,
    businesses.business_type,
    businesses.logo_path,
    businesses.cover_path,
    businesses.phone,
    businesses.address,
    businesses.map_url,
    businesses.opening_hours,
    businesses.social_links,
    businesses.default_language,
    businesses.time_zone
  from public.businesses
  where businesses.slug = target_slug
    and target_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    and char_length(target_slug) <= 60
    and businesses.status = 'active'
    and businesses.is_published;
$$;

create or replace function public.published_menu_slug(target_slug text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select matches.slug
  from (
    select businesses.slug, 0 as rank
    from public.businesses
    where businesses.slug = target_slug
      and target_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
      and char_length(target_slug) <= 60
      and businesses.status = 'active'
      and businesses.is_published
    union all
    select businesses.slug, 1 as rank
    from public.business_slug_redirects
    join public.businesses on businesses.id = business_slug_redirects.business_id
    where business_slug_redirects.slug = target_slug
      and target_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
      and char_length(target_slug) <= 60
      and businesses.status = 'active'
      and businesses.is_published
  ) as matches
  order by matches.rank
  limit 1;
$$;

create or replace view public.public_businesses
with (security_barrier = true, security_invoker = true) as
select
  id,
  name,
  slug,
  description,
  currency,
  business_type,
  logo_path,
  cover_path,
  phone,
  address,
  map_url,
  opening_hours,
  social_links,
  default_language,
  time_zone
from public.businesses
where status = 'active'
  and is_published;

drop policy if exists businesses_select_public on public.businesses;
create policy businesses_select_public
  on public.businesses
  for select
  to anon
  using (status = 'active' and is_published);

drop trigger if exists tr_businesses_protect_suspension on public.businesses;
drop function if exists public.protect_business_suspension();

alter table public.businesses
  drop column if exists suspended_at;

drop table if exists public.admin_audit_logs;
drop table if exists public.platform_admins;

comment on column public.profiles.is_platform_admin is null;
