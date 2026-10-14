-- Platform administrator appointment, suspension, and direct function calls.

reset role;

update public.profiles
set is_platform_admin = true
where id = '11111111-1111-4111-8111-111111111111';

select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', false);
select set_config('request.jwt.claim.role', 'authenticated', false);
set role authenticated;

select test_support.expect_true(
  'a profile flag does not appoint a platform administrator',
  public.is_platform_admin() = false
);

select test_support.expect_count(
  'an ordinary user cannot read email logs',
  'select * from public.email_logs',
  0
);

select test_support.expect_error(
  'an ordinary user cannot grant a plan',
  $$select public.admin_grant_plan(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '00000000-0000-4000-8000-000000000012',
    'Owner tried to grant a plan'
  )$$,
  '42501'
);

select test_support.expect_error(
  'an ordinary user cannot adjust a subscription directly',
  $$select public.admin_adjust_subscription(
    '13131313-1313-4131-8131-131313131313',
    'renew',
    'Owner tried to renew without appointment'
  )$$,
  '42501'
);

select test_support.expect_error(
  'an ordinary user cannot insert a completed payment',
  $$insert into public.payments (
    business_id, subscription_id, amount_cents, currency, status, provider, provider_order_id, paid_at
  ) values (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '13131313-1313-4131-8131-131313131313',
    1900,
    'USD',
    'completed',
    'paypal',
    'forged-admin-order',
    now()
  )$$,
  '42501'
);

select test_support.expect_error(
  'an ordinary user cannot appoint an administrator',
  $$insert into public.platform_admins (user_id)
    values ('11111111-1111-4111-8111-111111111111')$$,
  '42501'
);

reset role;

select test_support.expect_true(
  'the published menu is available before suspension',
  (select count(*) from public.published_business('harbor-table')) = 1
);

select set_config('request.jwt.claim.sub', '55555555-5555-4555-8555-555555555555', false);
set role authenticated;

select public.admin_set_business_suspension(
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  true,
  'Suspended for a policy review'
);

select test_support.expect_true(
  'suspension removes the business from the public menu',
  (select count(*) from public.published_business('harbor-table')) = 0
  and (
    select suspended_at is not null and is_published = false
    from public.businesses
    where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  )
);

select public.admin_set_business_suspension(
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  false,
  'Review finished and the suspension can end'
);

select test_support.expect_true(
  'reactivation keeps the menu unpublished until the owner publishes it',
  (select count(*) from public.published_business('harbor-table')) = 0
  and (
    select suspended_at is null and is_published = false
    from public.businesses
    where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  )
);

select test_support.expect_error(
  'a short reason is rejected',
  $$select public.admin_adjust_subscription(
    '13131313-1313-4131-8131-131313131313',
    'renew',
    'short'
  )$$,
  '23514'
);

select public.admin_adjust_subscription(
  '13131313-1313-4131-8131-131313131313',
  'renew',
  'Manual renewal after the paid period ended'
);

select test_support.expect_true(
  'the renewal records the operator and the values before and after',
  (
    select
      actor_id = '55555555-5555-4555-8555-555555555555'
      and action = 'subscription_renew'
      and before_data ->> 'status' = 'expired'
      and after_data ->> 'status' = 'active'
      and after_data ->> 'current_period_end' is not null
    from public.admin_audit_logs
    where target_id = '13131313-1313-4131-8131-131313131313'
    order by created_at desc
    limit 1
  )
);

create temp table payment_count_before_grant as
select count(*)::integer as total from public.payments;

select public.admin_grant_plan(
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  '00000000-0000-4000-8000-000000000012',
  'Complimentary Pro access without a payment'
);

select test_support.expect_true(
  'granting a plan activates it and does not record a payment',
  (
    select status = 'active'
      and plan_id = '00000000-0000-4000-8000-000000000012'
      and current_period_end is not null
    from public.subscriptions
    where business_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
      and status in ('pending', 'active', 'past_due')
  )
  and (select count(*) from public.payments) = (select total from payment_count_before_grant)
  and (
    select action = 'plan_granted'
    from public.admin_audit_logs
    where target_table = 'subscriptions'
    order by created_at desc
    limit 1
  )
);

select test_support.expect_error(
  'an appointed administrator cannot insert the audit row directly',
  $$insert into public.admin_audit_logs (actor_id, action, target_table, reason)
    values (
      '55555555-5555-4555-8555-555555555555',
      'forged',
      'payments',
      'This direct insert must fail'
    )$$,
  '42501'
);

select test_support.expect_error(
  'an appointed administrator cannot mark a payment completed',
  $$update public.payments
    set status = 'completed', paid_at = now()
    where id = 'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1'$$,
  '42501'
);

reset role;

update public.profiles
set is_platform_admin = false
where id = '11111111-1111-4111-8111-111111111111';
