-- Plan limits and server-side entitlements.
-- Apply after 20261013050000_slug_redirects.sql.
-- Existing menu rows are left in place. New columns have defaults.
-- Businesses without an open subscription receive the Free plan.

alter table public.subscription_plans
  add column max_businesses integer not null default 1,
  add column max_products integer not null default 25,
  add column max_themes integer not null default 1,
  add column analytics_retention_days integer not null default 7,
  add column custom_domains boolean not null default false;

alter table public.subscription_plans
  add constraint subscription_plans_max_businesses_check check (max_businesses between 1 and 100000),
  add constraint subscription_plans_max_products_check check (max_products between 1 and 100000),
  add constraint subscription_plans_max_themes_check check (max_themes between 1 and 3),
  add constraint subscription_plans_retention_check check (analytics_retention_days between 1 and 3650);

alter table public.subscriptions
  add column requested_plan_id uuid references public.subscription_plans (id) on delete restrict;

comment on column public.subscriptions.requested_plan_id is
  'Paid plan requested by the owner. It does not grant features until a trusted server operation activates it.';

update public.subscription_plans
set is_active = false
where code in ('dev_starter', 'dev_growth');

insert into public.subscription_plans (
  id,
  code,
  name,
  description,
  amount_cents,
  currency,
  billing_interval,
  is_active,
  max_businesses,
  max_products,
  max_themes,
  analytics_retention_days,
  custom_domains
)
values
  (
    '00000000-0000-4000-8000-000000000010',
    'free',
    'Free',
    'One business, a short analytics window, and the restaurant layout. No payment.',
    0,
    'USD',
    'month',
    true,
    1,
    25,
    1,
    7,
    false
  ),
  (
    '00000000-0000-4000-8000-000000000011',
    'starter',
    'Starter',
    'More businesses and products, two layouts, and 90 days of analytics.',
    1900,
    'USD',
    'month',
    true,
    3,
    150,
    2,
    90,
    false
  ),
  (
    '00000000-0000-4000-8000-000000000012',
    'pro',
    'Pro',
    'Higher limits, every layout, a year of analytics, and custom domains.',
    4900,
    'USD',
    'month',
    true,
    10,
    1000,
    3,
    365,
    true
  )
on conflict (code) do nothing;

create or replace function public.menu_theme_rank(theme text)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case theme
    when 'restaurant' then 1
    when 'cafe' then 2
    when 'minimal' then 3
    else null
  end;
$$;

create or replace function public.current_plan_id(target_business_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select subscriptions.plan_id
  from public.subscriptions
  join public.subscription_plans on subscription_plans.id = subscriptions.plan_id
  where subscriptions.business_id = target_business_id
    and subscriptions.status = 'active'
    and subscription_plans.is_active
    and (
      subscriptions.current_period_end is null
      or subscriptions.current_period_end > now()
    )
  order by subscriptions.current_period_start desc nulls last
  limit 1;
$$;

create or replace function public.business_product_limit(target_business_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select subscription_plans.max_products
      from public.subscription_plans
      where subscription_plans.id = public.current_plan_id(target_business_id)
    ),
    (
      select subscription_plans.max_products
      from public.subscription_plans
      where subscription_plans.code = 'free'
        and subscription_plans.is_active
    ),
    25
  );
$$;

create or replace function public.owner_business_capacity(target_owner uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select max(subscription_plans.max_businesses)
      from public.businesses
      join public.subscription_plans
        on subscription_plans.id = public.current_plan_id(businesses.id)
      where businesses.owner_id = target_owner
    ),
    (
      select subscription_plans.max_businesses
      from public.subscription_plans
      where subscription_plans.code = 'free'
        and subscription_plans.is_active
    ),
    1
  );
$$;

create or replace function public.theme_is_allowed(target_business_id uuid, theme text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.menu_theme_rank(theme) is not null
    and public.menu_theme_rank(theme) <= coalesce(
      (
        select subscription_plans.max_themes
        from public.subscription_plans
        where subscription_plans.id = public.current_plan_id(target_business_id)
      ),
      (
        select subscription_plans.max_themes
        from public.subscription_plans
        where subscription_plans.code = 'free'
          and subscription_plans.is_active
      ),
      1
    );
$$;

create or replace function public.entitled_menu_theme(target_business_id uuid, stored_theme text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when public.theme_is_allowed(target_business_id, stored_theme) then stored_theme
    else 'restaurant'
  end;
$$;

create or replace function public.custom_domains_allowed(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select subscription_plans.custom_domains
      from public.subscription_plans
      where subscription_plans.id = public.current_plan_id(target_business_id)
    ),
    false
  );
$$;

create or replace function public.analytics_visible_from(target_business_id uuid)
returns timestamptz
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  retention integer;
begin
  if not (public.is_business_member(target_business_id) or public.is_platform_admin()) then
    return null;
  end if;

  select coalesce(
    (
      select subscription_plans.analytics_retention_days
      from public.subscription_plans
      where subscription_plans.id = public.current_plan_id(target_business_id)
    ),
    (
      select subscription_plans.analytics_retention_days
      from public.subscription_plans
      where subscription_plans.code = 'free'
        and subscription_plans.is_active
    ),
    7
  )
  into retention;

  return now() - make_interval(days => retention);
end;
$$;

create or replace function public.assign_free_subscription()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  free_id uuid;
begin
  select subscription_plans.id
  into free_id
  from public.subscription_plans
  where subscription_plans.code = 'free'
    and subscription_plans.is_active;

  if free_id is null then
    return new;
  end if;

  if exists (
    select 1
    from public.subscriptions
    where subscriptions.business_id = new.id
      and subscriptions.status in ('pending', 'active', 'past_due')
  ) then
    return new;
  end if;

  insert into public.subscriptions (business_id, plan_id, status, current_period_start)
  values (new.id, free_id, 'active', now());

  return new;
end;
$$;

create trigger tr_businesses_assign_free
  after insert on public.businesses
  for each row execute function public.assign_free_subscription();

create or replace function public.enforce_business_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated')
    and (
      select count(*)
      from public.businesses
      where businesses.owner_id = new.owner_id
    ) >= public.owner_business_capacity(new.owner_id)
  then
    raise exception 'business_limit'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger tr_businesses_enforce_plan_limit
  before insert on public.businesses
  for each row execute function public.enforce_business_limit();

create or replace function public.enforce_product_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated')
    and (
      select count(*)
      from public.menu_products
      where menu_products.business_id = new.business_id
    ) >= public.business_product_limit(new.business_id)
  then
    raise exception 'product_limit'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger tr_menu_products_enforce_plan_limit
  before insert on public.menu_products
  for each row execute function public.enforce_product_limit();

create or replace function public.enforce_theme_entitlement()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated')
    and not public.theme_is_allowed(new.business_id, new.menu_theme)
  then
    raise exception 'theme_locked'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger tr_theme_enforce_entitlement
  before insert or update of menu_theme on public.business_theme_settings
  for each row execute function public.enforce_theme_entitlement();

create or replace function public.enforce_custom_domain_entitlement()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated')
    and not public.custom_domains_allowed(new.business_id)
  then
    raise exception 'custom_domain_locked'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger tr_custom_domains_enforce_entitlement
  before insert on public.custom_domains
  for each row execute function public.enforce_custom_domain_entitlement();

insert into public.subscriptions (business_id, plan_id, status, current_period_start)
select businesses.id, free_plan.id, 'active', now()
from public.businesses
cross join public.subscription_plans as free_plan
where free_plan.code = 'free'
  and not exists (
    select 1
    from public.subscriptions
    where subscriptions.business_id = businesses.id
      and subscriptions.status in ('pending', 'active', 'past_due')
  );

revoke all on function public.menu_theme_rank(text) from public;
revoke all on function public.current_plan_id(uuid) from public;
revoke all on function public.business_product_limit(uuid) from public;
revoke all on function public.owner_business_capacity(uuid) from public;
revoke all on function public.theme_is_allowed(uuid, text) from public;
revoke all on function public.entitled_menu_theme(uuid, text) from public;
revoke all on function public.custom_domains_allowed(uuid) from public;
revoke all on function public.analytics_visible_from(uuid) from public;
revoke all on function public.assign_free_subscription() from public;
revoke all on function public.enforce_business_limit() from public;
revoke all on function public.enforce_product_limit() from public;
revoke all on function public.enforce_theme_entitlement() from public;
revoke all on function public.enforce_custom_domain_entitlement() from public;

grant execute on function public.entitled_menu_theme(uuid, text) to anon, authenticated;
grant execute on function public.business_product_limit(uuid) to anon, authenticated;
grant execute on function public.owner_business_capacity(uuid) to anon, authenticated;
grant execute on function public.theme_is_allowed(uuid, text) to anon, authenticated;
grant execute on function public.custom_domains_allowed(uuid) to anon, authenticated;
grant execute on function public.analytics_visible_from(uuid) to authenticated;
grant execute on function public.enforce_business_limit() to anon, authenticated;
grant execute on function public.enforce_product_limit() to anon, authenticated;
grant execute on function public.enforce_theme_entitlement() to anon, authenticated;
grant execute on function public.enforce_custom_domain_entitlement() to anon, authenticated;
grant execute on function public.assign_free_subscription() to anon, authenticated;
