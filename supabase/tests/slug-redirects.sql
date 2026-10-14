-- Previous menu slugs redirect only while the business stays published.

reset role;

update public.businesses
set slug = 'harbor-table'
where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

select test_support.expect_true(
  'the previous slug resolves to the current public slug',
  public.published_menu_slug('harbor-grill') = 'harbor-table'
);

select test_support.expect_true(
  'the current slug resolves to itself',
  public.published_menu_slug('harbor-table') = 'harbor-table'
);

select test_support.expect_error(
  'a redirect slug must be a url segment',
  $$insert into public.business_slug_redirects (slug, business_id)
    values ('<script>', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')$$,
  '23514'
);

update public.businesses
set is_published = false
where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

select test_support.expect_true(
  'an unpublished menu does not resolve from its old slug',
  public.published_menu_slug('harbor-grill') is null
);

update public.businesses
set is_published = true
where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

select set_config('request.jwt.claim.sub', '44444444-4444-4444-8444-444444444444', false);
select set_config('request.jwt.claim.role', 'authenticated', false);
set role authenticated;

select test_support.expect_error(
  'a visitor cannot read the slug redirect table',
  $$select slug from public.business_slug_redirects$$,
  '42501'
);
