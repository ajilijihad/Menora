-- Let a platform administrator activate a plan without recording a payment.

create or replace function public.admin_grant_plan(
  target_business uuid,
  target_plan uuid,
  target_reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid;
  plan_row public.subscription_plans%rowtype;
  current_row public.subscriptions%rowtype;
  before_data jsonb;
  after_data jsonb;
begin
  actor := public.admin_require(target_reason);

  perform 1
  from public.businesses
  where businesses.id = target_business
  for update;

  if not found then
    raise exception 'business was not found'
      using errcode = '23514';
  end if;

  select * into plan_row
  from public.subscription_plans
  where subscription_plans.id = target_plan
    and subscription_plans.is_active;

  if not found then
    raise exception 'the plan is not available'
      using errcode = '23514';
  end if;

  select * into current_row
  from public.subscriptions
  where subscriptions.business_id = target_business
    and subscriptions.status in ('pending', 'active', 'past_due')
  for update;

  if found then
    before_data := jsonb_build_object(
      'status', current_row.status,
      'plan_id', current_row.plan_id,
      'requested_plan_id', current_row.requested_plan_id,
      'current_period_start', current_row.current_period_start,
      'current_period_end', current_row.current_period_end
    );
    update public.subscriptions
    set
      plan_id = plan_row.id,
      status = 'active',
      current_period_start = now(),
      current_period_end = case
        when plan_row.amount_cents > 0 then now() + interval '1 month'
        else null
      end,
      requested_plan_id = null
    where subscriptions.id = current_row.id;
  else
    insert into public.subscriptions (
      business_id,
      plan_id,
      status,
      current_period_start,
      current_period_end
    )
    values (
      target_business,
      plan_row.id,
      'active',
      now(),
      case
        when plan_row.amount_cents > 0 then now() + interval '1 month'
        else null
      end
    )
    returning * into current_row;
  end if;

  select jsonb_build_object(
    'status', subscriptions.status,
    'plan_id', subscriptions.plan_id,
    'requested_plan_id', subscriptions.requested_plan_id,
    'current_period_start', subscriptions.current_period_start,
    'current_period_end', subscriptions.current_period_end
  )
  into after_data
  from public.subscriptions
  where subscriptions.id = current_row.id;

  perform public.admin_write_audit(
    actor,
    'plan_granted',
    'subscriptions',
    current_row.id,
    target_reason,
    before_data,
    after_data
  );
end;
$$;

revoke all on function public.admin_grant_plan(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.admin_grant_plan(uuid, uuid, text) to authenticated;
