-- Five public menu layouts. Existing restaurant, cafe, and minimal rows
-- move to the closest new layout and receive that layout's palette.

alter table public.business_theme_settings
  drop constraint business_theme_settings_menu_theme_check;

update public.business_theme_settings
set
  menu_theme = 'modern-dark',
  primary_color = '#ff7a1a',
  accent_color = '#ffb020',
  background_color = '#0c0c0e',
  text_color = '#f5f5f4',
  font_choice = 'sans',
  radius_px = 18
where menu_theme = 'restaurant';

update public.business_theme_settings
set
  menu_theme = 'clean-light',
  primary_color = '#ff7a1a',
  accent_color = '#ff9a4a',
  background_color = '#fffaf6',
  text_color = '#1c1917',
  font_choice = 'sans',
  radius_px = 22
where menu_theme = 'cafe';

update public.business_theme_settings
set
  menu_theme = 'premium-gold',
  primary_color = '#d4af37',
  accent_color = '#f3e5ab',
  background_color = '#070707',
  text_color = '#f6f1e4',
  font_choice = 'serif',
  radius_px = 16
where menu_theme = 'minimal';

alter table public.business_theme_settings
  add constraint business_theme_settings_menu_theme_check
  check (menu_theme in ('modern-dark', 'clean-light', 'premium-gold', 'fresh-green', 'traditional-beige'));

alter table public.business_theme_settings
  alter column menu_theme set default 'modern-dark';

create or replace function public.menu_theme_rank(theme text)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case theme
    when 'modern-dark' then 1
    when 'clean-light' then 2
    when 'premium-gold' then 3
    when 'fresh-green' then 4
    when 'traditional-beige' then 5
    else null
  end;
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
    else 'modern-dark'
  end;
$$;

alter table public.subscription_plans
  drop constraint subscription_plans_max_themes_check;

alter table public.subscription_plans
  add constraint subscription_plans_max_themes_check check (max_themes between 1 and 5);

update public.subscription_plans
set max_themes = 5
where code in ('free', 'starter', 'pro');

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
    or target_themes is null or target_themes < 1 or target_themes > 5
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
