-- Theme editor constraints and tenant isolation.

reset role;

select test_support.expect_error(
  'theme text color must be a hex color',
  $$update public.business_theme_settings
    set text_color = 'red; background: url(javascript:alert(1))'
    where business_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'$$,
  '23514'
);

select test_support.expect_error(
  'theme radius stays inside 0 to 32',
  $$update public.business_theme_settings
    set radius_px = 80
    where business_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'$$,
  '23514'
);

select test_support.expect_error(
  'theme navigation style must be a known choice',
  $$update public.business_theme_settings
    set nav_style = '<script>'
    where business_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'$$,
  '23514'
);

update public.business_theme_settings
set text_color = '#112233', nav_style = 'underline', radius_px = 8
where business_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

select set_config('request.jwt.claim.sub', '', false);
select set_config('request.jwt.claim.role', 'anon', false);
set role anon;

select test_support.expect_true(
  'anonymous visitor can read the public theme tokens',
  (
    select text_color = '#112233' and nav_style = 'underline' and radius_px = 8
    from public.business_theme_settings
    where business_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  )
);

reset role;
select set_config('request.jwt.claim.sub', '33333333-3333-4333-8333-333333333333', false);
select set_config('request.jwt.claim.role', 'authenticated', false);
set role authenticated;

update public.business_theme_settings
set text_color = '#ABCDEF'
where business_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

select test_support.expect_true(
  'editor cannot change another role''s theme tokens',
  (
    select text_color = '#112233'
    from public.business_theme_settings
    where business_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  )
);

reset role;
select set_config('request.jwt.claim.sub', '44444444-4444-4444-8444-444444444444', false);
select set_config('request.jwt.claim.role', 'authenticated', false);
set role authenticated;

update public.business_theme_settings
set primary_color = '#010101'
where business_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

select test_support.expect_true(
  'a different business cannot change this theme',
  (
    select primary_color <> '#010101'
    from public.business_theme_settings
    where business_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  )
);

reset role;
select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', false);
select set_config('request.jwt.claim.role', 'authenticated', false);
set role authenticated;

update public.business_theme_settings
set featured_style = 'grid', card_layout = 'overlay'
where business_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

select test_support.expect_true(
  'manager can save theme layout tokens',
  (
    select featured_style = 'grid' and card_layout = 'overlay'
    from public.business_theme_settings
    where business_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  )
);
