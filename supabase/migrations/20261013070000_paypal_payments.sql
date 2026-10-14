-- Manual PayPal checkouts. One verified capture grants one month.
-- Apply after 20261013060000_plan_entitlements.sql.
-- Existing payment rows stay pending and keep their amounts.

alter table public.payments
  add column plan_id uuid references public.subscription_plans (id) on delete restrict,
  add column granted_period_start timestamptz,
  add column granted_period_end timestamptz,
  add column provider_refund_id text,
  add column refunded_at timestamptz;

alter table public.payments
  drop constraint payments_status_values;

alter table public.payments
  add constraint payments_status_values check (
    status in ('pending', 'completed', 'failed', 'refunded', 'canceled')
  );

alter table public.payments
  add constraint payments_refunded_requires_refund_id check (
    status <> 'refunded' or provider_refund_id is not null
  );

create unique index payments_provider_capture_key
  on public.payments (provider, provider_capture_id)
  where provider_capture_id is not null;

create unique index payments_provider_refund_key
  on public.payments (provider, provider_refund_id)
  where provider_refund_id is not null;

create table public.paypal_events (
  id text primary key,
  event_type text not null,
  payment_id uuid references public.payments (id) on delete set null,
  received_at timestamptz not null default now(),
  constraint paypal_events_id_length check (char_length(id) between 8 and 80),
  constraint paypal_events_type_length check (char_length(event_type) between 1 and 80)
);

alter table public.paypal_events enable row level security;
alter table public.paypal_events force row level security;
revoke all on table public.paypal_events from public, anon, authenticated;
grant all on table public.paypal_events to service_role;

comment on table public.paypal_events is
  'Verified PayPal webhook ids. Unverified notifications are not stored here.';

create or replace function public.complete_paypal_payment(
  target_payment_id uuid,
  order_id text,
  capture_id text,
  captured_amount_cents integer,
  captured_currency text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  payment public.payments%rowtype;
  subscription public.subscriptions%rowtype;
  period_start timestamptz;
  period_end timestamptz;
begin
  if order_id is null or capture_id is null or char_length(capture_id) < 4 then
    return 'rejected';
  end if;

  select *
  into payment
  from public.payments
  where payments.id = target_payment_id
  for update;

  if not found then
    return 'rejected';
  end if;

  if payment.provider <> 'paypal'
    or payment.provider_order_id is distinct from order_id
    or payment.plan_id is null
    or payment.amount_cents is distinct from captured_amount_cents
    or payment.currency is distinct from captured_currency
  then
    return 'rejected';
  end if;

  if payment.status = 'completed' and payment.provider_capture_id = capture_id then
    return 'already_completed';
  end if;

  if payment.status <> 'pending' then
    return 'rejected';
  end if;

  if exists (
    select 1
    from public.payments as other
    where other.provider = 'paypal'
      and other.provider_capture_id = capture_id
      and other.id <> payment.id
  ) then
    return 'rejected';
  end if;

  select *
  into subscription
  from public.subscriptions
  where subscriptions.id = payment.subscription_id
  for update;

  if not found or subscription.business_id <> payment.business_id then
    return 'rejected';
  end if;

  period_start := case
    when subscription.status = 'active'
      and subscription.current_period_end is not null
      and subscription.current_period_end > now()
    then subscription.current_period_end
    else now()
  end;
  period_end := period_start + interval '1 month';

  update public.payments
  set
    status = 'completed',
    provider_capture_id = capture_id,
    paid_at = now(),
    granted_period_start = period_start,
    granted_period_end = period_end
  where payments.id = payment.id;

  update public.subscriptions
  set
    plan_id = payment.plan_id,
    status = 'active',
    current_period_start = period_start,
    current_period_end = period_end,
    requested_plan_id = null
  where subscriptions.id = subscription.id;

  return 'completed';
end;
$$;

create or replace function public.refund_paypal_payment(
  target_payment_id uuid,
  refund_id text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  payment public.payments%rowtype;
  subscription public.subscriptions%rowtype;
  new_end timestamptz;
begin
  if refund_id is null or char_length(refund_id) < 4 then
    return 'rejected';
  end if;

  select *
  into payment
  from public.payments
  where payments.id = target_payment_id
  for update;

  if not found or payment.provider <> 'paypal' then
    return 'rejected';
  end if;

  if payment.status = 'refunded' and payment.provider_refund_id = refund_id then
    return 'already_refunded';
  end if;

  if payment.status <> 'completed'
    or payment.granted_period_start is null
    or payment.granted_period_end is null
  then
    return 'rejected';
  end if;

  select *
  into subscription
  from public.subscriptions
  where subscriptions.id = payment.subscription_id
  for update;

  if not found then
    return 'rejected';
  end if;

  update public.payments
  set
    status = 'refunded',
    provider_refund_id = refund_id,
    refunded_at = now()
  where payments.id = payment.id;

  if subscription.current_period_end is not null then
    new_end := subscription.current_period_end
      - (payment.granted_period_end - payment.granted_period_start);
    update public.subscriptions
    set
      current_period_end = new_end,
      status = case when new_end <= now() then 'expired' else status end
    where subscriptions.id = subscription.id;
  end if;

  return 'refunded';
end;
$$;

create or replace function public.record_paypal_event(
  event_id text,
  event_type text,
  target_payment uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.paypal_events (id, event_type, payment_id)
  values (event_id, event_type, target_payment)
  on conflict (id) do nothing;
  return found;
end;
$$;

revoke all on function public.complete_paypal_payment(uuid, text, text, integer, text) from public, anon, authenticated;
revoke all on function public.refund_paypal_payment(uuid, text) from public, anon, authenticated;
grant execute on function public.complete_paypal_payment(uuid, text, text, integer, text) to service_role;
grant execute on function public.refund_paypal_payment(uuid, text) to service_role;
revoke all on function public.record_paypal_event(text, text, uuid) from public, anon, authenticated;
grant execute on function public.record_paypal_event(text, text, uuid) to service_role;
