-- Platform administrators, suspension, and audit records.
-- Apply after 20261013080000_email_reminders.sql.
-- profiles.is_platform_admin is no longer used for access.

create table public.platform_admins (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  appointed_at timestamptz not null default now(),
  note text,
  constraint platform_admins_note_length check (note is null or char_length(note) <= 500)
);

comment on table public.platform_admins is
  'Appointed platform administrators. Profile columns and registration metadata do not grant this access.';

comment on column public.profiles.is_platform_admin is
  'Ignored for authorization. Appoint administrators in platform_admins.';

insert into public.platform_admins (user_id)
select profiles.id
from public.profiles
where profiles.is_platform_admin
on conflict (user_id) do nothing;

create table public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.profiles (id) on delete restrict,
  action text not null,
  target_table text not null,
  target_id uuid,
  reason text not null,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now(),
  constraint admin_audit_logs_action_length check (char_length(action) between 1 and 80),
  constraint admin_audit_logs_table_length check (char_length(target_table) between 1 and 80),
  constraint admin_audit_logs_reason_length check (char_length(btrim(reason)) between 8 and 500)
);

create index admin_audit_logs_created_at_idx
  on public.admin_audit_logs (created_at desc);

comment on table public.admin_audit_logs is
  'Sensitive administrative changes, with the operator, reason, and before/after values. Timestamps are stored in UTC.';

alter table public.businesses
  add column suspended_at timestamptz;

comment on column public.businesses.suspended_at is
  'Set when a platform administrator suspends the business. A suspended business is not public.';

create or replace function public.protect_business_suspension()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if current_user in ('anon', 'authenticated') then
      new.suspended_at := null;
    end if;
  elsif current_user in ('anon', 'authenticated') then
    new.suspended_at := old.suspended_at;
  end if;

  if new.suspended_at is not null then
    new.is_published := false;
  end if;

  return new;
end;
$$;

create trigger tr_businesses_protect_suspension
  before insert or update on public.businesses
  for each row execute function public.protect_business_suspension();

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.platform_admins
    where platform_admins.user_id = auth.uid()
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
      and businesses.suspended_at is null
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
    and businesses.is_published
    and businesses.suspended_at is null;
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
      and businesses.suspended_at is null
    union all
    select businesses.slug, 1 as rank
    from public.business_slug_redirects
    join public.businesses on businesses.id = business_slug_redirects.business_id
    where business_slug_redirects.slug = target_slug
      and target_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
      and char_length(target_slug) <= 60
      and businesses.status = 'active'
      and businesses.is_published
      and businesses.suspended_at is null
  ) as matches
  order by matches.rank
  limit 1;
$$;

create or replace function public.admin_require(target_reason text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'platform administrator required'
      using errcode = '42501';
  end if;

  if target_reason is null
    or char_length(btrim(target_reason)) < 8
    or char_length(target_reason) > 500
  then
    raise exception 'an administrative reason is required'
      using errcode = '23514';
  end if;

  return auth.uid();
end;
$$;

create or replace function public.admin_write_audit(
  target_actor uuid,
  target_action text,
  target_table text,
  target_row uuid,
  target_reason text,
  target_before jsonb,
  target_after jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.admin_audit_logs (
    actor_id,
    action,
    target_table,
    target_id,
    reason,
    before_data,
    after_data
  )
  values (
    target_actor,
    target_action,
    target_table,
    target_row,
    btrim(target_reason),
    target_before,
    target_after
  );
end;
$$;

create or replace function public.admin_save_plan(
  target_id uuid,
  target_code text,
  target_name text,
  target_description text,
  target_amount integer,
  target_currency text,
  target_active boolean,
  target_businesses integer,
  target_products integer,
  target_themes integer,
  target_retention integer,
  target_domains boolean,
  target_reason text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid;
  existing public.subscription_plans%rowtype;
  saved_id uuid;
  after_row jsonb;
begin
  actor := public.admin_require(target_reason);

  if target_name is null or char_length(btrim(target_name)) < 1 or char_length(btrim(target_name)) > 120
    or (target_description is not null and char_length(target_description) > 2000)
    or target_amount is null or target_amount < 0 or target_amount > 2000000000
    or target_currency is null or target_currency !~ '^[A-Z]{3}$'
    or target_businesses is null or target_businesses < 1 or target_businesses > 100000
    or target_products is null or target_products < 1 or target_products > 100000
    or target_themes is null or target_themes < 1 or target_themes > 3
    or target_retention is null or target_retention < 1 or target_retention > 3650
    or target_active is null or target_domains is null
  then
    raise exception 'plan details are not valid'
      using errcode = '23514';
  end if;

  if target_id is null then
    if target_code is null or target_code !~ '^[a-z0-9_]+$' or char_length(target_code) > 40 then
      raise exception 'plan code is not valid'
        using errcode = '23514';
    end if;
    if target_code = 'free' and target_amount <> 0 then
      raise exception 'the free plan has no price'
        using errcode = '23514';
    end if;

    insert into public.subscription_plans (
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
    values (
      target_code,
      btrim(target_name),
      nullif(btrim(coalesce(target_description, '')), ''),
      target_amount,
      target_currency,
      'month',
      target_active,
      target_businesses,
      target_products,
      target_themes,
      target_retention,
      target_domains
    )
    returning id into saved_id;

    select to_jsonb(subscription_plans.*) into after_row
    from public.subscription_plans
    where subscription_plans.id = saved_id;

    perform public.admin_write_audit(
      actor,
      'plan_created',
      'subscription_plans',
      saved_id,
      target_reason,
      null,
      after_row
    );
    return saved_id;
  end if;

  select * into existing
  from public.subscription_plans
  where subscription_plans.id = target_id
  for update;

  if not found then
    raise exception 'plan was not found'
      using errcode = '23514';
  end if;
  if existing.code = 'free' and target_amount <> 0 then
    raise exception 'the free plan has no price'
      using errcode = '23514';
  end if;

  update public.subscription_plans
  set
    name = btrim(target_name),
    description = nullif(btrim(coalesce(target_description, '')), ''),
    amount_cents = target_amount,
    currency = target_currency,
    is_active = target_active,
    max_businesses = target_businesses,
    max_products = target_products,
    max_themes = target_themes,
    analytics_retention_days = target_retention,
    custom_domains = target_domains
  where subscription_plans.id = existing.id;

  select to_jsonb(subscription_plans.*) into after_row
  from public.subscription_plans
  where subscription_plans.id = existing.id;

  perform public.admin_write_audit(
    actor,
    'plan_updated',
    'subscription_plans',
    existing.id,
    target_reason,
    to_jsonb(existing),
    after_row
  );
  return existing.id;
end;
$$;

create or replace function public.admin_adjust_subscription(
  target_id uuid,
  target_operation text,
  target_reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid;
  current_row public.subscriptions%rowtype;
  requested public.subscription_plans%rowtype;
  current_plan public.subscription_plans%rowtype;
  free_plan uuid;
  opened_id uuid;
  before_data jsonb;
  after_data jsonb;
begin
  actor := public.admin_require(target_reason);
  if target_operation not in ('activate', 'renew', 'expire', 'cancel') then
    raise exception 'subscription operation is not available'
      using errcode = '23514';
  end if;

  select * into current_row
  from public.subscriptions
  where subscriptions.id = target_id
  for update;

  if not found then
    raise exception 'subscription was not found'
      using errcode = '23514';
  end if;

  before_data := jsonb_build_object(
    'status', current_row.status,
    'plan_id', current_row.plan_id,
    'requested_plan_id', current_row.requested_plan_id,
    'current_period_start', current_row.current_period_start,
    'current_period_end', current_row.current_period_end
  );

  if target_operation = 'activate' then
    if current_row.requested_plan_id is null then
      raise exception 'there is no requested plan to activate'
        using errcode = '23514';
    end if;
    select * into requested
    from public.subscription_plans
    where subscription_plans.id = current_row.requested_plan_id;
    if not found or requested.is_active is not true then
      raise exception 'the requested plan is not available'
        using errcode = '23514';
    end if;
    update public.subscriptions
    set
      plan_id = requested.id,
      status = 'active',
      current_period_start = now(),
      current_period_end = case
        when requested.amount_cents > 0 then now() + interval '1 month'
        else null
      end,
      requested_plan_id = null
    where subscriptions.id = current_row.id;
  elsif target_operation = 'renew' then
    select * into current_plan
    from public.subscription_plans
    where subscription_plans.id = current_row.plan_id;
    if not found
      or current_plan.amount_cents = 0
      or current_row.status in ('pending', 'canceled')
    then
      raise exception 'this subscription cannot be renewed manually'
        using errcode = '23514';
    end if;
    update public.subscriptions
    set
      status = 'active',
      current_period_start = now(),
      current_period_end = now() + interval '1 month'
    where subscriptions.id = current_row.id;
  elsif target_operation = 'expire' then
    if current_row.status not in ('active', 'past_due', 'pending') then
      raise exception 'this subscription cannot be marked expired'
        using errcode = '23514';
    end if;
    update public.subscriptions
    set status = 'expired'
    where subscriptions.id = current_row.id;
  else
    select subscription_plans.id into free_plan
    from public.subscription_plans
    where subscription_plans.code = 'free'
      and subscription_plans.is_active;
    if free_plan is null or current_row.status not in ('pending', 'active', 'past_due') then
      raise exception 'this subscription cannot be canceled'
        using errcode = '23514';
    end if;
    if current_row.plan_id = free_plan then
      update public.subscriptions
      set
        requested_plan_id = null,
        status = 'active',
        current_period_end = null
      where subscriptions.id = current_row.id;
    else
      update public.subscriptions
      set status = 'canceled', requested_plan_id = null
      where subscriptions.id = current_row.id;
      insert into public.subscriptions (
        business_id,
        plan_id,
        status,
        current_period_start,
        current_period_end
      )
      values (
        current_row.business_id,
        free_plan,
        'active',
        now(),
        null
      )
      returning subscriptions.id into opened_id;
    end if;
  end if;

  select jsonb_build_object(
    'status', subscriptions.status,
    'plan_id', subscriptions.plan_id,
    'requested_plan_id', subscriptions.requested_plan_id,
    'current_period_start', subscriptions.current_period_start,
    'current_period_end', subscriptions.current_period_end,
    'opened_subscription_id', opened_id
  )
  into after_data
  from public.subscriptions
  where subscriptions.id = current_row.id;

  perform public.admin_write_audit(
    actor,
    'subscription_' || target_operation,
    'subscriptions',
    current_row.id,
    target_reason,
    before_data,
    after_data
  );
end;
$$;

create or replace function public.admin_set_business_suspension(
  target_id uuid,
  target_suspended boolean,
  target_reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid;
  current_row public.businesses%rowtype;
  before_data jsonb;
  after_data jsonb;
begin
  actor := public.admin_require(target_reason);
  if target_suspended is null then
    raise exception 'suspension choice is required'
      using errcode = '23514';
  end if;

  select * into current_row
  from public.businesses
  where businesses.id = target_id
  for update;

  if not found then
    raise exception 'business was not found'
      using errcode = '23514';
  end if;

  before_data := jsonb_build_object(
    'status', current_row.status,
    'is_published', current_row.is_published,
    'suspended_at', current_row.suspended_at
  );

  if target_suspended then
    update public.businesses
    set suspended_at = coalesce(businesses.suspended_at, now())
    where businesses.id = current_row.id;
  else
    update public.businesses
    set suspended_at = null
    where businesses.id = current_row.id;
  end if;

  select jsonb_build_object(
    'status', businesses.status,
    'is_published', businesses.is_published,
    'suspended_at', businesses.suspended_at
  )
  into after_data
  from public.businesses
  where businesses.id = current_row.id;

  perform public.admin_write_audit(
    actor,
    case when target_suspended then 'business_suspended' else 'business_reactivated' end,
    'businesses',
    current_row.id,
    target_reason,
    before_data,
    after_data
  );
end;
$$;

create or replace function public.admin_note_refund(
  target_payment uuid,
  target_reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid;
  current_row public.payments%rowtype;
begin
  actor := public.admin_require(target_reason);

  select * into current_row
  from public.payments
  where payments.id = target_payment;

  if not found or current_row.status <> 'refunded' or current_row.provider_refund_id is null then
    raise exception 'only a verified refund can be recorded'
      using errcode = '23514';
  end if;

  perform public.admin_write_audit(
    actor,
    'payment_refund',
    'payments',
    current_row.id,
    target_reason,
    null,
    jsonb_build_object(
      'status', current_row.status,
      'amount_cents', current_row.amount_cents,
      'currency', current_row.currency,
      'provider_order_id', current_row.provider_order_id,
      'provider_capture_id', current_row.provider_capture_id,
      'provider_refund_id', current_row.provider_refund_id,
      'refunded_at', current_row.refunded_at
    )
  );
end;
$$;

alter table public.platform_admins enable row level security;
alter table public.platform_admins force row level security;
alter table public.admin_audit_logs enable row level security;
alter table public.admin_audit_logs force row level security;

revoke all on table public.platform_admins from public, anon, authenticated;
revoke all on table public.admin_audit_logs from public, anon, authenticated;

grant select on table public.platform_admins to authenticated;
grant select on table public.admin_audit_logs to authenticated;
grant all on table public.platform_admins to service_role;
grant all on table public.admin_audit_logs to service_role;

create policy platform_admins_select
  on public.platform_admins
  for select
  to authenticated
  using (user_id = auth.uid() or public.is_platform_admin());

create policy admin_audit_logs_select
  on public.admin_audit_logs
  for select
  to authenticated
  using (public.is_platform_admin());

revoke all on function public.admin_require(text) from public, anon, authenticated;
revoke all on function public.admin_write_audit(uuid, text, text, uuid, text, jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.admin_save_plan(uuid, text, text, text, integer, text, boolean, integer, integer, integer, integer, boolean, text) from public, anon, authenticated;
revoke all on function public.admin_adjust_subscription(uuid, text, text) from public, anon, authenticated;
revoke all on function public.admin_set_business_suspension(uuid, boolean, text) from public, anon, authenticated;
revoke all on function public.admin_note_refund(uuid, text) from public, anon, authenticated;

grant execute on function public.admin_require(text) to authenticated;
grant execute on function public.admin_save_plan(uuid, text, text, text, integer, text, boolean, integer, integer, integer, integer, boolean, text) to authenticated;
grant execute on function public.admin_adjust_subscription(uuid, text, text) to authenticated;
grant execute on function public.admin_set_business_suspension(uuid, boolean, text) to authenticated;
grant execute on function public.admin_note_refund(uuid, text) to authenticated;
