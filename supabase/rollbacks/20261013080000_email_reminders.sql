drop function if exists public.expire_due_subscriptions();
drop function if exists public.finish_subscription_reminder(uuid, text, uuid);
drop function if exists public.claim_subscription_reminder(uuid, timestamptz, text);
drop function if exists public.finish_email_delivery(uuid, text, text, text);
drop function if exists public.claim_email_delivery(text, text, text, uuid, uuid, uuid);

drop table if exists public.subscription_reminders;

drop index if exists public.email_logs_idempotency_key_idx;

alter table public.email_logs
  drop constraint if exists email_logs_idempotency_key_length;

alter table public.email_logs
  drop column if exists payment_id,
  drop column if exists subscription_id,
  drop column if exists idempotency_key;
