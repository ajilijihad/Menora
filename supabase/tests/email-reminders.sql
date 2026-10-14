-- Reminder claims, failed delivery retry, and server-side expiration.
-- Depends on the Harbor subscription left active by paypal-payments.sql.

reset role;

select test_support.expect_true(
  'a future period is not expired by the daily job',
  public.expire_due_subscriptions() = 0
  and (
    select status = 'active'
    from public.subscriptions
    where id = '13131313-1313-4131-8131-131313131313'
  )
);

select test_support.expect_true(
  'the first reminder claim is recorded for the period',
  public.claim_subscription_reminder(
    '13131313-1313-4131-8131-131313131313',
    '2026-11-13T00:00:00Z',
    'reminder_7'
  ) is not null
);

select test_support.expect_true(
  'a second scheduler run does not claim the same reminder',
  public.claim_subscription_reminder(
    '13131313-1313-4131-8131-131313131313',
    '2026-11-13T00:00:00Z',
    'reminder_7'
  ) is null
);

select public.finish_subscription_reminder(
  (
    select id
    from public.subscription_reminders
    where subscription_id = '13131313-1313-4131-8131-131313131313'
      and reminder_type = 'reminder_7'
  ),
  'failed',
  null
);

select test_support.expect_true(
  'a failed reminder can be claimed again',
  public.claim_subscription_reminder(
    '13131313-1313-4131-8131-131313131313',
    '2026-11-13T00:00:00Z',
    'reminder_7'
  ) is not null
);

select public.finish_subscription_reminder(
  (
    select id
    from public.subscription_reminders
    where subscription_id = '13131313-1313-4131-8131-131313131313'
      and reminder_type = 'reminder_7'
  ),
  'sent',
  null
);

select test_support.expect_true(
  'a sent reminder is not claimed again',
  public.claim_subscription_reminder(
    '13131313-1313-4131-8131-131313131313',
    '2026-11-13T00:00:00Z',
    'reminder_7'
  ) is null
);

select test_support.expect_true(
  'a sent email requires a provider message id',
  public.claim_email_delivery(
    'receipt:a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1',
    'owner@example.test',
    'payment_receipt',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '13131313-1313-4131-8131-131313131313',
    'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1'
  ) is not null
);

select test_support.expect_error(
  'a delivery cannot be marked sent without a provider message id',
  $$select public.finish_email_delivery(
    (select id from public.email_logs where idempotency_key = 'receipt:a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1'),
    'sent',
    null,
    null
  )$$,
  '23514'
);

select public.finish_email_delivery(
  (select id from public.email_logs where idempotency_key = 'receipt:a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1'),
  'failed',
  null,
  'Resend rejected the message'
);

select test_support.expect_true(
  'the failed delivery stores the provider error and is not marked sent',
  (
    select status = 'failed' and provider_message_id is null and error_message = 'Resend rejected the message'
    from public.email_logs
    where idempotency_key = 'receipt:a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1'
  )
);

select test_support.expect_true(
  'a failed delivery can be claimed once for a retry',
  public.claim_email_delivery(
    'receipt:a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1',
    'owner@example.test',
    'payment_receipt',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '13131313-1313-4131-8131-131313131313',
    'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1'
  ) is not null
);

update public.subscriptions
set
  current_period_start = now() - interval '2 months',
  current_period_end = now() - interval '1 day'
where id = '13131313-1313-4131-8131-131313131313';

select test_support.expect_true(
  'the daily job expires a paid period that has ended',
  public.expire_due_subscriptions() = 1
);

select test_support.expect_true(
  'the expired subscription is stored as expired',
  (
    select status = 'expired' and current_period_end < now()
    from public.subscriptions
    where id = '13131313-1313-4131-8131-131313131313'
  )
);

select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', false);
select set_config('request.jwt.claim.role', 'authenticated', false);
set role authenticated;

select test_support.expect_error(
  'a signed-in owner cannot claim a reminder',
  $$select public.claim_subscription_reminder(
    '13131313-1313-4131-8131-131313131313',
    '2026-11-13T00:00:00Z',
    'reminder_1'
  )$$,
  '42501'
);

reset role;
