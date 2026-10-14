-- Removes plan limits. Menu rows stay. Free subscriptions added by this migration are removed.

drop trigger if exists tr_custom_domains_enforce_entitlement on public.custom_domains;
drop trigger if exists tr_theme_enforce_entitlement on public.business_theme_settings;
drop trigger if exists tr_menu_products_enforce_plan_limit on public.menu_products;
drop trigger if exists tr_businesses_enforce_plan_limit on public.businesses;
drop trigger if exists tr_businesses_assign_free on public.businesses;

drop function if exists public.enforce_custom_domain_entitlement();
drop function if exists public.enforce_theme_entitlement();
drop function if exists public.enforce_product_limit();
drop function if exists public.enforce_business_limit();
drop function if exists public.assign_free_subscription();
drop function if exists public.analytics_visible_from(uuid);
drop function if exists public.custom_domains_allowed(uuid);
drop function if exists public.entitled_menu_theme(uuid, text);
drop function if exists public.theme_is_allowed(uuid, text);
drop function if exists public.owner_business_capacity(uuid);
drop function if exists public.business_product_limit(uuid);
drop function if exists public.current_plan_id(uuid);
drop function if exists public.menu_theme_rank(text);

update public.subscriptions
set requested_plan_id = null
where requested_plan_id in (
  select id from public.subscription_plans where code in ('free', 'starter', 'pro')
);

delete from public.payments
where subscription_id in (
  select subscriptions.id
  from public.subscriptions
  where subscriptions.plan_id in (
    select subscription_plans.id
    from public.subscription_plans
    where subscription_plans.code in ('free', 'starter', 'pro')
  )
);

delete from public.subscriptions
where plan_id in (
  select id from public.subscription_plans where code in ('free', 'starter', 'pro')
);

alter table public.subscriptions
  drop column if exists requested_plan_id;

delete from public.subscription_plans
where code in ('free', 'starter', 'pro');

alter table public.subscription_plans
  drop constraint if exists subscription_plans_max_businesses_check,
  drop constraint if exists subscription_plans_max_products_check,
  drop constraint if exists subscription_plans_max_themes_check,
  drop constraint if exists subscription_plans_retention_check;

alter table public.subscription_plans
  drop column if exists custom_domains,
  drop column if exists analytics_retention_days,
  drop column if exists max_themes,
  drop column if exists max_products,
  drop column if exists max_businesses;

update public.subscription_plans
set is_active = true
where code in ('dev_starter', 'dev_growth');
