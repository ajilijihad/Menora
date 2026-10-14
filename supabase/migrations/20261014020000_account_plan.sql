-- One account subscription covers every business that owner adds.
-- Feature checks read the owner's best current plan.
-- A new business still receives its own Free row. That row does not
-- limit the business while a higher plan on the account is current.

create or replace function public.current_plan_id(target_business_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select subscriptions.plan_id
  from public.businesses as target
  join public.businesses as owned
    on owned.owner_id = target.owner_id
  join public.subscriptions
    on subscriptions.business_id = owned.id
  join public.subscription_plans
    on subscription_plans.id = subscriptions.plan_id
  where target.id = target_business_id
    and subscriptions.status = 'active'
    and subscription_plans.is_active
    and (
      subscriptions.current_period_end is null
      or subscriptions.current_period_end > now()
    )
  order by subscription_plans.amount_cents desc,
           subscriptions.current_period_start desc nulls last
  limit 1;
$$;

create or replace function public.account_subscription(target_business_id uuid)
returns table (
  subscription_id uuid,
  business_id uuid,
  plan_id uuid,
  status text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  requested_plan_id uuid
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    subscriptions.id,
    subscriptions.business_id,
    subscriptions.plan_id,
    subscriptions.status,
    subscriptions.current_period_start,
    subscriptions.current_period_end,
    subscriptions.requested_plan_id
  from public.businesses as target
  join public.businesses as owned
    on owned.owner_id = target.owner_id
  join public.subscriptions
    on subscriptions.business_id = owned.id
  join public.subscription_plans
    on subscription_plans.id = subscriptions.plan_id
  where target.id = target_business_id
    and (public.is_business_member(target.id) or public.is_platform_admin())
    and subscriptions.status = 'active'
    and subscription_plans.is_active
    and (
      subscriptions.current_period_end is null
      or subscriptions.current_period_end > now()
    )
  order by subscription_plans.amount_cents desc,
           subscriptions.current_period_start desc nulls last
  limit 1;
$$;

revoke all on function public.account_subscription(uuid) from public, anon;
grant execute on function public.account_subscription(uuid) to authenticated, service_role;

update public.subscription_plans
set description = 'One business on your account, a short analytics window, and the restaurant layout. No payment.'
where code = 'free';

update public.subscription_plans
set description = 'One subscription for your account. Every business you add, up to the plan limit, gets the same Starter features.'
where code = 'starter';

update public.subscription_plans
set description = 'One subscription for your account. One payment covers every business you add, up to the plan limit. Each business gets the same Pro features. When the subscription ends, every business returns to Free.'
where code = 'pro';
