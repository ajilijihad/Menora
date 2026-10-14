-- Plan limits, paid activation, and client billing writes.
-- Depends on Harbor Grill from rls.sql.

reset role;

delete from public.payments
where business_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

delete from public.subscriptions
where business_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

insert into public.subscriptions (
  id,
  business_id,
  plan_id,
  status,
  current_period_start
)
values (
  '13131313-1313-4131-8131-131313131313',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  '00000000-0000-4000-8000-000000000010',
  'active',
  now()
);

select test_support.expect_true(
  'a new business receives the free plan without a payment',
  (
    select subscriptions.status = 'active'
      and subscription_plans.code = 'free'
      and subscription_plans.amount_cents = 0
      and subscriptions.current_period_end is null
    from public.subscriptions
    join public.subscription_plans on subscription_plans.id = subscriptions.plan_id
    where subscriptions.business_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  )
);

select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', false);
select set_config('request.jwt.claim.role', 'authenticated', false);
set role authenticated;

select test_support.expect_error(
  'an owner cannot change a subscription status',
  $$update public.subscriptions
    set status = 'expired'
    where business_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'$$,
  '42501'
);

select test_support.expect_error(
  'an owner cannot change a subscription plan',
  $$update public.subscriptions
    set plan_id = (select id from public.subscription_plans where code = 'pro')
    where business_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'$$,
  '42501'
);

select test_support.expect_error(
  'an owner cannot change a subscription expiration',
  $$update public.subscriptions
    set current_period_end = now() + interval '1 year'
    where business_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'$$,
  '42501'
);

select test_support.expect_error(
  'the free plan blocks a second business',
  $$insert into public.businesses (owner_id, name, slug)
    values (
      '11111111-1111-4111-8111-111111111111',
      'Second Grill',
      'second-grill'
    )$$,
  '23514'
);

select test_support.expect_error(
  'the free plan blocks a locked menu layout',
  $$update public.business_theme_settings
    set menu_theme = 'cafe'
    where business_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'$$,
  '23514'
);

select test_support.expect_error(
  'the free plan blocks a custom domain',
  $$insert into public.custom_domains (business_id, hostname)
    values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'menu.example.test')$$,
  '23514'
);

select test_support.expect_true(
  'free analytics retention is seven days',
  public.analytics_visible_from('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') > now() - interval '8 days'
    and public.analytics_visible_from('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') < now() - interval '6 days'
);

reset role;

update public.subscriptions
set requested_plan_id = (select id from public.subscription_plans where code = 'pro')
where business_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

select test_support.expect_true(
  'a requested paid plan does not change the product limit',
  public.business_product_limit('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
    = (select max_products from public.subscription_plans where code = 'free')
);

update public.subscriptions
set plan_id = (select id from public.subscription_plans where code = 'pro'),
    status = 'pending',
    requested_plan_id = null
where business_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

select test_support.expect_true(
  'a pending paid plan uses free limits',
  public.business_product_limit('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
    = (select max_products from public.subscription_plans where code = 'free')
);

update public.subscriptions
set status = 'active',
    current_period_start = now(),
    current_period_end = now() + interval '1 month'
where business_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

select test_support.expect_true(
  'an active paid plan uses its own product limit',
  public.business_product_limit('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
    = (select max_products from public.subscription_plans where code = 'pro')
);

insert into public.businesses (id, owner_id, name, slug)
values (
  'abababab-abab-4aba-8aba-abababababab',
  '11111111-1111-4111-8111-111111111111',
  'Second Grill',
  'second-grill-account'
);

select test_support.expect_true(
  'a second business inherits the account paid plan',
  public.business_product_limit('abababab-abab-4aba-8aba-abababababab')
    = (select max_products from public.subscription_plans where code = 'pro')
    and public.owner_business_capacity('11111111-1111-4111-8111-111111111111')
      = (select max_businesses from public.subscription_plans where code = 'pro')
);

update public.subscriptions
set
  current_period_start = now() - interval '1 month',
  current_period_end = now() - interval '1 day'
where business_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

select test_support.expect_true(
  'an expired paid plan uses free limits',
  public.business_product_limit('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
    = (select max_products from public.subscription_plans where code = 'free')
);

select test_support.expect_true(
  'an expired account plan returns every business to free limits',
  public.business_product_limit('abababab-abab-4aba-8aba-abababababab')
    = (select max_products from public.subscription_plans where code = 'free')
);

delete from public.subscriptions
where business_id = 'abababab-abab-4aba-8aba-abababababab';

delete from public.businesses
where id = 'abababab-abab-4aba-8aba-abababababab';

update public.subscriptions
set plan_id = (select id from public.subscription_plans where code = 'free'),
    status = 'active',
    current_period_start = now(),
    current_period_end = null,
    requested_plan_id = null
where business_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

update public.subscription_plans
set max_products = (
  select count(*)::integer
  from public.menu_products
  where business_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
)
where code = 'free';

select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', false);
select set_config('request.jwt.claim.role', 'authenticated', false);
set role authenticated;

select test_support.expect_error(
  'the product limit rejects another product',
  $$insert into public.menu_products (business_id, category_id, name, price_cents)
    values (
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      'Over the limit',
      100
    )$$,
  '23514'
);

reset role;

update public.subscription_plans
set max_products = 25
where code = 'free';
