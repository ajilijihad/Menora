drop function if exists public.record_paypal_event(text, text, uuid);
drop function if exists public.refund_paypal_payment(uuid, text);
drop function if exists public.complete_paypal_payment(uuid, text, text, integer, text);

drop table if exists public.paypal_events;

drop index if exists public.payments_provider_refund_key;
drop index if exists public.payments_provider_capture_key;

alter table public.payments
  drop constraint if exists payments_refunded_requires_refund_id;

alter table public.payments
  drop constraint if exists payments_status_values;

alter table public.payments
  add constraint payments_status_values check (
    status in ('pending', 'completed', 'failed', 'refunded')
  );

alter table public.payments
  drop column if exists refunded_at,
  drop column if exists provider_refund_id,
  drop column if exists granted_period_end,
  drop column if exists granted_period_start,
  drop column if exists plan_id;
