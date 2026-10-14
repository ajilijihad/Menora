-- PayPal capture checks. Depends on Harbor Grill from rls.sql and the free reset in plan-entitlements.sql.

reset role;

insert into public.payments (
  id,
  business_id,
  subscription_id,
  amount_cents,
  currency,
  status,
  provider,
  provider_order_id
)
values (
  '14141414-1414-4141-8141-141414141414',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  '13131313-1313-4131-8131-131313131313',
  2900,
  'USD',
  'pending',
  'paypal',
  'dev-order-harbor'
);

insert into public.payments (
  id,
  business_id,
  subscription_id,
  plan_id,
  amount_cents,
  currency,
  status,
  provider,
  provider_order_id
)
values
  (
    'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '13131313-1313-4131-8131-131313131313',
    '00000000-0000-4000-8000-000000000011',
    1900,
    'USD',
    'pending',
    'paypal',
    'ORDER-A'
  ),
  (
    'b2b2b2b2-b2b2-42b2-82b2-b2b2b2b2b2b2',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '13131313-1313-4131-8131-131313131313',
    '00000000-0000-4000-8000-000000000011',
    1900,
    'USD',
    'pending',
    'paypal',
    'ORDER-B'
  );

select test_support.expect_true(
  'a payment that was not prepared for checkout is rejected',
  public.complete_paypal_payment(
    '14141414-1414-4141-8141-141414141414',
    'dev-order-harbor',
    'FORGED-CAPTURE',
    2900,
    'USD'
  ) = 'rejected'
);

select test_support.expect_true(
  'the forged capture did not change the free plan',
  (
    select subscription_plans.code = 'free' and subscriptions.current_period_end is null
    from public.subscriptions
    join public.subscription_plans on subscription_plans.id = subscriptions.plan_id
    where subscriptions.id = '13131313-1313-4131-8131-131313131313'
  )
);

select test_support.expect_true(
  'a wrong amount is rejected',
  public.complete_paypal_payment(
    'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1',
    'ORDER-A',
    'CAPTURE-WRONG-AMOUNT',
    100,
    'USD'
  ) = 'rejected'
);

select test_support.expect_true(
  'a wrong currency is rejected',
  public.complete_paypal_payment(
    'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1',
    'ORDER-A',
    'CAPTURE-WRONG-CURRENCY',
    1900,
    'EUR'
  ) = 'rejected'
);

select test_support.expect_true(
  'a wrong order id is rejected',
  public.complete_paypal_payment(
    'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1',
    'ORDER-FORGED',
    'CAPTURE-WRONG-ORDER',
    1900,
    'USD'
  ) = 'rejected'
);

select test_support.expect_true(
  'the rejected attempts left the payment pending',
  (
    select status = 'pending' and provider_capture_id is null
    from public.payments
    where id = 'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1'
  )
);

select test_support.expect_true(
  'a matching capture grants one month from now',
  public.complete_paypal_payment(
    'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1',
    'ORDER-A',
    'CAPTURE-A',
    1900,
    'USD'
  ) = 'completed'
);

select test_support.expect_true(
  'the first paid month starts now and stores the capture',
  (
    select payments.status = 'completed'
      and payments.provider_capture_id = 'CAPTURE-A'
      and payments.paid_at is not null
      and payments.granted_period_start > now() - interval '1 minute'
      and payments.granted_period_end = payments.granted_period_start + interval '1 month'
      and subscriptions.status = 'active'
      and subscription_plans.code = 'starter'
      and subscriptions.current_period_end = payments.granted_period_end
    from public.payments
    join public.subscriptions on subscriptions.id = payments.subscription_id
    join public.subscription_plans on subscription_plans.id = subscriptions.plan_id
    where payments.id = 'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1'
  )
);

select test_support.expect_true(
  'a duplicate capture does not grant another month',
  public.complete_paypal_payment(
    'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1',
    'ORDER-A',
    'CAPTURE-A',
    1900,
    'USD'
  ) = 'already_completed'
);

select test_support.expect_true(
  'a second renewal is recorded',
  public.complete_paypal_payment(
    'b2b2b2b2-b2b2-42b2-82b2-b2b2b2b2b2b2',
    'ORDER-B',
    'CAPTURE-B',
    1900,
    'USD'
  ) = 'completed'
);

select test_support.expect_true(
  'a second renewal starts at the first expiration',
  (
    select first_payment.granted_period_end = second_payment.granted_period_start
      and second_payment.granted_period_end = second_payment.granted_period_start + interval '1 month'
      and subscriptions.current_period_end = second_payment.granted_period_end
    from public.payments as first_payment
    join public.payments as second_payment
      on second_payment.id = 'b2b2b2b2-b2b2-42b2-82b2-b2b2b2b2b2b2'
    join public.subscriptions on subscriptions.id = second_payment.subscription_id
    where first_payment.id = 'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1'
  )
);

select test_support.expect_true(
  'the first capture still covers only its original month',
  (
    select granted_period_end = granted_period_start + interval '1 month'
    from public.payments
    where id = 'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1'
  )
);

select test_support.expect_true(
  'a refund is recorded',
  public.refund_paypal_payment('b2b2b2b2-b2b2-42b2-82b2-b2b2b2b2b2b2', 'REFUND-B') = 'refunded'
);

select test_support.expect_true(
  'a refund removes the month that capture granted',
  (
    select subscriptions.current_period_end = first_payment.granted_period_end
      and second_payment.status = 'refunded'
      and second_payment.provider_refund_id = 'REFUND-B'
    from public.payments as first_payment
    join public.payments as second_payment
      on second_payment.id = 'b2b2b2b2-b2b2-42b2-82b2-b2b2b2b2b2b2'
    join public.subscriptions on subscriptions.id = first_payment.subscription_id
    where first_payment.id = 'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1'
  )
);

select test_support.expect_true(
  'the same refund does not shorten the period again',
  public.refund_paypal_payment('b2b2b2b2-b2b2-42b2-82b2-b2b2b2b2b2b2', 'REFUND-B') = 'already_refunded'
);

select test_support.expect_true(
  'a different refund id cannot shorten a refunded payment',
  public.refund_paypal_payment('b2b2b2b2-b2b2-42b2-82b2-b2b2b2b2b2b2', 'REFUND-AGAIN') = 'rejected'
);

select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', false);
select set_config('request.jwt.claim.role', 'authenticated', false);
set role authenticated;

select test_support.expect_error(
  'a signed-in owner cannot complete a payment directly',
  $$select public.complete_paypal_payment(
    'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1',
    'ORDER-A',
    'CAPTURE-A',
    1900,
    'USD'
  )$$,
  '42501'
);

select test_support.expect_error(
  'a signed-in owner cannot mark a payment paid',
  $$update public.payments
    set status = 'completed', paid_at = now()
    where id = 'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1'$$,
  '42501'
);

reset role;
