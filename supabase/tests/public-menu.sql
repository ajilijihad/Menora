-- Public menu lookup and layout setting.
-- Depends on the Harbor Grill and Private Kitchen rows created by rls.sql.

reset role;

select test_support.expect_error(
  'menu theme must be a known layout',
  $$update public.business_theme_settings
    set menu_theme = 'delivery'
    where business_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'$$,
  '23514'
);

update public.business_theme_settings
set menu_theme = 'clean-light'
where business_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

select set_config('request.jwt.claim.sub', '', false);
select set_config('request.jwt.claim.role', 'anon', false);
set role anon;

select test_support.expect_count(
  'anonymous visitor can resolve a published business by slug',
  $$select * from public.published_business('harbor-grill')$$,
  1
);

select test_support.expect_true(
  'published lookup returns the public name and slug',
  (
    select name = 'Harbor Grill' and slug = 'harbor-grill'
    from public.published_business('harbor-grill')
  )
);

select test_support.expect_count(
  'anonymous visitor cannot resolve a draft business',
  $$select * from public.published_business('private-kitchen')$$,
  0
);

select test_support.expect_count(
  'anonymous visitor cannot resolve a missing slug',
  $$select * from public.published_business('missing-kitchen')$$,
  0
);

select test_support.expect_error(
  'published lookup has no owner id column',
  $$select owner_id from public.published_business('harbor-grill')$$,
  '42703'
);

select test_support.expect_true(
  'anonymous visitor reads the public menu layout',
  (
    select menu_theme = 'clean-light'
    from public.business_theme_settings
    where business_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  )
);

reset role;
select set_config('request.jwt.claim.sub', '44444444-4444-4444-8444-444444444444', false);
select set_config('request.jwt.claim.role', 'authenticated', false);
set role authenticated;

select test_support.expect_count(
  'signed-in non-member can read a published business profile',
  $$select * from public.published_business('harbor-grill')$$,
  1
);

select test_support.expect_count(
  'signed-in visitor cannot read a draft through the public lookup',
  $$select * from public.published_business('private-kitchen')$$,
  0
);

reset role;
select set_config('request.jwt.claim.sub', '33333333-3333-4333-8333-333333333333', false);
select set_config('request.jwt.claim.role', 'authenticated', false);
set role authenticated;

update public.business_theme_settings
set menu_theme = 'premium-gold'
where business_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

select test_support.expect_true(
  'editor cannot change the public menu layout',
  (
    select menu_theme = 'clean-light'
    from public.business_theme_settings
    where business_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  )
);

reset role;
select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', false);
select set_config('request.jwt.claim.role', 'authenticated', false);
set role authenticated;

update public.business_theme_settings
set menu_theme = 'modern-dark'
where business_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

select test_support.expect_true(
  'manager can change the public menu layout',
  (
    select menu_theme = 'modern-dark'
    from public.business_theme_settings
    where business_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  )
);
