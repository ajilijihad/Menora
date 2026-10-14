-- Business profile columns, owner membership, and media path rules.

reset role;

insert into auth.users (id, email, raw_user_meta_data)
values
  (
    'c1111111-1111-4111-8111-111111111111',
    'profile-owner@example.test',
    '{"full_name":"Profile Owner"}'::jsonb
  ),
  (
    'c2222222-2222-4222-8222-222222222222',
    'profile-outsider@example.test',
    '{"full_name":"Outsider"}'::jsonb
  ),
  (
    'c3333333-3333-4333-8333-333333333333',
    'profile-editor@example.test',
    '{"full_name":"Editor"}'::jsonb
  );

select set_config('request.jwt.claim.sub', 'c1111111-1111-4111-8111-111111111111', false);
select set_config('request.jwt.claim.role', 'authenticated', false);
set role authenticated;

insert into public.businesses (
  id,
  owner_id,
  name,
  slug,
  business_type,
  phone,
  address,
  map_url,
  opening_hours,
  social_links,
  default_language,
  time_zone
)
values (
  'c1c1c1c1-c1c1-41c1-81c1-c1c1c1c1c1c1',
  'c1111111-1111-4111-8111-111111111111',
  'North Cafe',
  'north-cafe',
  'cafe',
  '+1 202 555 0100',
  '12 Market Street',
  'https://maps.example/north',
  '{"monday":{"closed":false,"opens":"08:00","closes":"18:00"}}'::jsonb,
  '{"instagram":"https://instagram.com/north"}'::jsonb,
  'en',
  'Asia/Riyadh'
);

select test_support.expect_count(
  'profile owner is the only owner membership',
  $$select * from public.business_members
    where business_id = 'c1c1c1c1-c1c1-41c1-81c1-c1c1c1c1c1c1' and role = 'owner'$$,
  1
);

select test_support.expect_error(
  'a logo path must stay inside the business folder',
  $$update public.businesses
    set logo_path = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/logo-bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb.png'
    where id = 'c1c1c1c1-c1c1-41c1-81c1-c1c1c1c1c1c1'$$,
  '23514'
);

select test_support.expect_error(
  'slug must be url-safe',
  $$update public.businesses
    set slug = 'North Cafe'
    where id = 'c1c1c1c1-c1c1-41c1-81c1-c1c1c1c1c1c1'$$,
  '23514'
);

insert into public.business_members (business_id, user_id, role)
values (
  'c1c1c1c1-c1c1-41c1-81c1-c1c1c1c1c1c1',
  'c3333333-3333-4333-8333-333333333333',
  'editor'
);

insert into storage.objects (bucket_id, name)
values (
  'business-media',
  'c1c1c1c1-c1c1-41c1-81c1-c1c1c1c1c1c1/logo-dddddddd-dddd-4ddd-8ddd-dddddddddddd.png'
);

select test_support.expect_count(
  'owner can store a logo in the business folder',
  $$select * from storage.objects
    where name = 'c1c1c1c1-c1c1-41c1-81c1-c1c1c1c1c1c1/logo-dddddddd-dddd-4ddd-8ddd-dddddddddddd.png'$$,
  1
);

set role authenticated;
select set_config('request.jwt.claim.sub', 'c3333333-3333-4333-8333-333333333333', false);

update public.businesses
set name = 'Taken Over'
where id = 'c1c1c1c1-c1c1-41c1-81c1-c1c1c1c1c1c1';

select test_support.expect_true(
  'editor cannot change the business profile',
  (
    select name = 'North Cafe'
    from public.businesses
    where id = 'c1c1c1c1-c1c1-41c1-81c1-c1c1c1c1c1c1'
  )
);

select test_support.expect_error(
  'editor cannot upload business media',
  $$insert into storage.objects (bucket_id, name)
    values (
      'business-media',
      'c1c1c1c1-c1c1-41c1-81c1-c1c1c1c1c1c1/cover-eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee.png'
    )$$,
  '42501'
);

select set_config('request.jwt.claim.sub', 'c2222222-2222-4222-8222-222222222222', false);

select test_support.expect_count(
  'another account cannot read a draft business',
  $$select * from public.businesses
    where id = 'c1c1c1c1-c1c1-41c1-81c1-c1c1c1c1c1c1'$$,
  0
);

select test_support.expect_error(
  'another account cannot upload into the business folder',
  $$insert into storage.objects (bucket_id, name)
    values (
      'business-media',
      'c1c1c1c1-c1c1-41c1-81c1-c1c1c1c1c1c1/logo-ffffffff-ffff-4fff-8fff-ffffffffffff.png'
    )$$,
  '42501'
);

reset role;
select set_config('request.jwt.claim.sub', '', false);
set role anon;

select test_support.expect_count(
  'anonymous visitors cannot read an unpublished business phone',
  $$select phone from public.businesses
    where id = 'c1c1c1c1-c1c1-41c1-81c1-c1c1c1c1c1c1'$$,
  0
);

reset role;
