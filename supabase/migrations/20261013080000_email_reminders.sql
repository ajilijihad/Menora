-- Transactional email delivery and one reminder per subscription period.
-- Apply after 20261013070000_paypal_payments.sql.
-- Existing email_logs rows stay. New columns are nullable.

alter table public.email_logs
  add column idempotency_key text,
  add column subscription_id uuid references public.subscriptions (id) on delete set null,
  add column payment_id uuid references public.payments (id) on delete set null;

alter table public.email_logs
  add constraint email_logs_idempotency_key_length check (
    idempotency_key is null or char_length(idempotency_key) between 8 and 160
  );

create unique index email_logs_idempotency_key_idx
  on public.email_logs (idempotency_key)
  where idempotency_key is not null;

create table public.subscription_reminders (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions (id) on delete cascade,
  period_end timestamptz not null,
  reminder_type text not null,
  status text not null,
  email_log_id uuid references public.email_logs (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscription_reminders_type_values check (
    reminder_type in ('reminder_7', 'reminder_3', 'reminder_1', 'expired')
  ),
  constraint subscription_reminders_status_values check (
    status in ('queued', 'sent', 'failed')
  ),
  constraint subscription_reminders_period_key unique (subscription_id, period_end, reminder_type)
);

create index subscription_reminders_status_idx
  on public.subscription_reminders (status, updated_at);

create trigger tr_subscription_reminders_set_updated_at
  before update on public.subscription_reminders
  for each row execute function public.set_updated_at();

alter table public.subscription_reminders enable row level security;
alter table public.subscription_reminders force row level security;
revoke all on table public.subscription_reminders from public, anon, authenticated;
grant all on table public.subscription_reminders to service_role;

comment on table public.subscription_reminders is
  'One reminder claim per subscription period and reminder type. Timestamps are stored in UTC.';

create or replace function public.claim_email_delivery(
  target_key text,
  target_email text,
  target_template text,
  target_business uuid,
  target_subscription uuid,
  target_payment uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  claimed uuid;
begin
  if target_key is null or char_length(target_key) < 8 or char_length(target_key) > 160 then
    return null;
  end if;

  insert into public.email_logs (
    idempotency_key,
    to_email,
    template,
    status,
    business_id,
    subscription_id,
    payment_id
  )
  values (
    target_key,
    target_email,
    target_template,
    'queued',
    target_business,
    target_subscription,
    target_payment
  )
  on conflict (idempotency_key) where idempotency_key is not null do nothing
  returning id into claimed;

  if claimed is not null then
    return claimed;
  end if;

  update public.email_logs
  set status = 'queued', error_message = null
  where id = (
    select logs.id
    from public.email_logs as logs
    where logs.idempotency_key = target_key
      and (
        logs.status = 'failed'
        or (logs.status = 'queued' and logs.updated_at < now() - interval '15 minutes')
      )
    for update skip locked
  )
  returning public.email_logs.id into claimed;

  return claimed;
end;
$$;

create or replace function public.finish_email_delivery(
  target_id uuid,
  target_status text,
  target_provider_id text,
  target_error text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if target_status = 'sent' and (target_provider_id is null or char_length(target_provider_id) < 1) then
    raise exception 'sent email requires a provider message id'
      using errcode = '23514';
  end if;

  if target_status not in ('sent', 'failed') then
    raise exception 'email delivery status must be sent or failed'
      using errcode = '23514';
  end if;

  update public.email_logs
  set
    status = target_status,
    provider_message_id = case when target_status = 'sent' then target_provider_id else email_logs.provider_message_id end,
    error_message = case
      when target_status = 'sent' then null
      else left(coalesce(nullif(target_error, ''), 'Email delivery failed'), 2000)
    end
  where email_logs.id = target_id
    and email_logs.status = 'queued';
end;
$$;

create or replace function public.claim_subscription_reminder(
  target_subscription uuid,
  target_period_end timestamptz,
  target_type text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  claimed uuid;
begin
  if target_period_end is null or target_type not in ('reminder_7', 'reminder_3', 'reminder_1', 'expired') then
    return null;
  end if;

  insert into public.subscription_reminders (subscription_id, period_end, reminder_type, status)
  values (target_subscription, target_period_end, target_type, 'queued')
  on conflict (subscription_id, period_end, reminder_type) do nothing
  returning id into claimed;

  if claimed is not null then
    return claimed;
  end if;

  update public.subscription_reminders
  set status = 'queued'
  where id = (
    select reminders.id
    from public.subscription_reminders as reminders
    where reminders.subscription_id = target_subscription
      and reminders.period_end = target_period_end
      and reminders.reminder_type = target_type
      and (
        reminders.status = 'failed'
        or (reminders.status = 'queued' and reminders.updated_at < now() - interval '15 minutes')
      )
    for update skip locked
  )
  returning public.subscription_reminders.id into claimed;

  return claimed;
end;
$$;

create or replace function public.finish_subscription_reminder(
  target_id uuid,
  target_status text,
  target_log uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if target_status not in ('sent', 'failed') then
    raise exception 'reminder status must be sent or failed'
      using errcode = '23514';
  end if;

  update public.subscription_reminders
  set
    status = target_status,
    email_log_id = coalesce(target_log, subscription_reminders.email_log_id)
  where subscription_reminders.id = target_id
    and subscription_reminders.status = 'queued';
end;
$$;

create or replace function public.expire_due_subscriptions()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  updated integer;
begin
  update public.subscriptions
  set status = 'expired'
  where subscriptions.status = 'active'
    and subscriptions.current_period_end is not null
    and subscriptions.current_period_end <= now();

  get diagnostics updated = row_count;
  return updated;
end;
$$;

revoke all on function public.claim_email_delivery(text, text, text, uuid, uuid, uuid) from public, anon, authenticated;
revoke all on function public.finish_email_delivery(uuid, text, text, text) from public, anon, authenticated;
revoke all on function public.claim_subscription_reminder(uuid, timestamptz, text) from public, anon, authenticated;
revoke all on function public.finish_subscription_reminder(uuid, text, uuid) from public, anon, authenticated;
revoke all on function public.expire_due_subscriptions() from public, anon, authenticated;

grant execute on function public.claim_email_delivery(text, text, text, uuid, uuid, uuid) to service_role;
grant execute on function public.finish_email_delivery(uuid, text, text, text) to service_role;
grant execute on function public.claim_subscription_reminder(uuid, timestamptz, text) to service_role;
grant execute on function public.finish_subscription_reminder(uuid, text, uuid) to service_role;
grant execute on function public.expire_due_subscriptions() to service_role;
