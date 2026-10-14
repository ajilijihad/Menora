-- Public analytics recording, retention, and custom-domain verification.

reset role;

update public.businesses
set is_published = true, status = 'active', suspended_at = null
where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

select test_support.expect_true(
  'an unpublished slug is not recorded',
  public.record_public_analytics(
    'missing-menu',
    'menu_view',
    null,
    'desktop',
    'direct',
    repeat('ab', 32)
  ) = false
);

select test_support.expect_true(
  'the harbor menu is public for analytics',
  (select count(*) from public.published_business('harbor-table')) = 1
);

select test_support.expect_true(
  'the first menu view is accepted',
  public.record_public_analytics(
    'harbor-table',
    'menu_view',
    null,
    'mobile',
    'search',
    repeat('ab', 32)
  ) = true
);

select test_support.expect_true(
  'a repeated menu view in the same hour is collapsed',
  public.record_public_analytics(
    'harbor-table',
    'menu_view',
    null,
    'mobile',
    'search',
    repeat('ab', 32)
  ) = true
  and (
    select count(*) = 1
    from public.analytics_events
    where visitor_hash = repeat('ab', 32)
      and event_name = 'menu_view'
      and device_category = 'mobile'
      and referrer_source = 'search'
  )
);

select test_support.expect_true(
  'an unpublished product view is not recorded',
  public.record_public_analytics(
    'harbor-table',
    'product_view',
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    'desktop',
    'direct',
    repeat('cd', 32)
  ) = false
);

select test_support.expect_true(
  'a published product view is accepted',
  public.record_public_analytics(
    'harbor-table',
    'product_view',
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    'tablet',
    'social',
    repeat('cd', 32)
  ) = true
);

select test_support.expect_true(
  'a published product view stores that business category',
  (
    select menu_category_id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
    from public.analytics_events
    where visitor_hash = repeat('cd', 32)
  )
);

select test_support.expect_true(
  'a product from another business is not recorded',
  public.record_public_analytics(
    'harbor-table',
    'product_view',
    'bcbcbcbc-bcbc-4bcb-8bcb-bcbcbcbcbcbc',
    'desktop',
    'other',
    repeat('12', 32)
  ) = false
);

insert into public.analytics_events (
  id, business_id, event_name, occurred_at, visitor_hash
)
values (
  '17171717-1717-4171-8171-171717171717',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'menu_view',
  now() - interval '4000 days',
  repeat('ef', 32)
);

select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', false);
select set_config('request.jwt.claim.role', 'authenticated', false);
set role authenticated;

select test_support.expect_count(
  'a member cannot read views outside the plan retention',
  $$select * from public.analytics_events where id = '17171717-1717-4171-8171-171717171717'$$,
  0
);

select test_support.expect_true(
  'the summary omits the visitor hash and keeps recent menu views',
  (
    select
      summary ->> 'menuViews' = '1'
      and summary::text not like '%visitor_hash%'
      and summary::text not like '%' || repeat('ab', 32) || '%'
    from (
      select public.business_analytics_summary(
        'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        now() - interval '30 days',
        now() + interval '1 day'
      ) as summary
    ) wrapped
  )
);

select test_support.expect_error(
  'an ordinary user cannot insert an analytics event directly',
  $$insert into public.analytics_events (business_id, event_name)
    values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'menu_view')$$,
  '42501'
);

reset role;
select set_config('request.jwt.claim.sub', '55555555-5555-4555-8555-555555555555', false);
select set_config('request.jwt.claim.role', 'authenticated', false);
set role authenticated;

select test_support.expect_count(
  'an administrator can still read the retained event',
  $$select * from public.analytics_events where id = '17171717-1717-4171-8171-171717171717'$$,
  1
);

reset role;

select public.maintain_public_analytics();

select test_support.expect_count(
  'retention maintenance deletes views older than the plan window',
  $$select * from public.analytics_events where id = '17171717-1717-4171-8171-171717171717'$$,
  0
);

update public.custom_domains
set status = 'disabled'
where business_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  and status in ('pending', 'verified', 'active');

update public.subscriptions
set
  plan_id = '00000000-0000-4000-8000-000000000012',
  status = 'active',
  current_period_start = now(),
  current_period_end = now() + interval '30 days'
where id = '13131313-1313-4131-8131-131313131313';

select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', false);
select set_config('request.jwt.claim.role', 'authenticated', false);
set role authenticated;

select test_support.expect_error(
  'a domain cannot be submitted before this deployment host is registered',
  $$select public.submit_custom_domain(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'menu.harbor.test'
  )$$,
  '23514'
);

select test_support.expect_error(
  'an ordinary user cannot appoint this deployment host',
  $$insert into public.platform_hosts (hostname) values ('menor.test')$$,
  '42501'
);

reset role;

insert into public.platform_hosts (hostname)
values ('menor.test');

select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', false);
select set_config('request.jwt.claim.role', 'authenticated', false);
set role authenticated;

select test_support.expect_error(
  'the deployment host cannot be claimed',
  $$select public.submit_custom_domain(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'menor.test'
  )$$,
  '23514'
);

select test_support.expect_error(
  'an ip address is not a domain',
  $$select public.submit_custom_domain(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '1.2.3.4'
  )$$,
  '23514'
);

reset role;

update public.custom_domains
set hostname = 'menu.harbor.test'
where hostname = 'kitchen.example.test';

select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', false);
select set_config('request.jwt.claim.role', 'authenticated', false);
set role authenticated;

select test_support.expect_error(
  'a second business cannot claim a hostname that is already assigned',
  $$select public.submit_custom_domain(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'menu.harbor.test'
  )$$,
  '23505'
);

reset role;

update public.custom_domains
set hostname = 'kitchen.example.test'
where hostname = 'menu.harbor.test';

select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', false);
select set_config('request.jwt.claim.role', 'authenticated', false);
set role authenticated;

select public.submit_custom_domain(
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'menu.harbor.test'
);

select test_support.expect_true(
  'a submitted domain stays pending',
  (
    select status = 'pending' and verified_at is null
    from public.custom_domains
    where hostname = 'menu.harbor.test'
  )
);

select test_support.expect_error(
  'the same business cannot open a second domain',
  $$select public.submit_custom_domain(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'www.harbor.test'
  )$$,
  '23505'
);

select test_support.expect_error(
  'a customer cannot mark a domain verified',
  $$select public.confirm_custom_domain(
    (select id from public.custom_domains where hostname = 'menu.harbor.test'),
    (select verification_token from public.custom_domains where hostname = 'menu.harbor.test')
  )$$,
  '42501'
);

select test_support.expect_error(
  'a customer cannot mark a domain active',
  $$select public.activate_custom_domain(
    (select id from public.custom_domains where hostname = 'menu.harbor.test')
  )$$,
  '42501'
);

reset role;

select test_support.expect_true(
  'a wrong token does not verify the domain',
  public.confirm_custom_domain(
    (select id from public.custom_domains where hostname = 'menu.harbor.test'),
    '00000000000000000000000000000000'
  ) = 'rejected'
  and (
    select status = 'pending'
    from public.custom_domains
    where hostname = 'menu.harbor.test'
  )
);

select test_support.expect_error(
  'activation is rejected before verification',
  $$select public.activate_custom_domain(
    (select id from public.custom_domains where hostname = 'menu.harbor.test')
  )$$,
  '23514'
);

select test_support.expect_true(
  'a matching token verifies the domain',
  public.confirm_custom_domain(
    (select id from public.custom_domains where hostname = 'menu.harbor.test'),
    (select verification_token from public.custom_domains where hostname = 'menu.harbor.test')
  ) = 'verified'
);

select test_support.expect_true(
  'verification does not activate the domain',
  (
    select status = 'verified' and verified_at is not null
    from public.custom_domains
    where hostname = 'menu.harbor.test'
  )
  and public.active_menu_host('menu.harbor.test') is null
);

select public.activate_custom_domain(
  (select id from public.custom_domains where hostname = 'menu.harbor.test')
);

select test_support.expect_true(
  'an active verified domain resolves only for that published business',
  public.active_menu_host('menu.harbor.test') = 'harbor-table'
  and public.active_menu_host('kitchen.example.test') is null
);

update public.subscriptions
set plan_id = '00000000-0000-4000-8000-000000000010'
where id = '13131313-1313-4131-8131-131313131313';

select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', false);
select set_config('request.jwt.claim.role', 'authenticated', false);
set role authenticated;

select public.sync_business_domains('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

select test_support.expect_true(
  'a downgrade disables the domain and stops routing',
  (
    select status = 'disabled'
    from public.custom_domains
    where hostname = 'menu.harbor.test'
  )
  and public.active_menu_host('menu.harbor.test') is null
);

delete from public.custom_domains
where hostname = 'menu.harbor.test';

select test_support.expect_count(
  'the owner can remove the domain',
  $$select * from public.custom_domains where hostname = 'menu.harbor.test'$$,
  0
);

reset role;
