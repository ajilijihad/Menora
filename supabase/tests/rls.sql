-- RLS checks for anonymous users, tenant roles, and a platform administrator.
-- The session role and JWT subject stand in for Supabase Auth.

create schema if not exists test_support;

create or replace function test_support.expect_count(
  label text,
  query text,
  expected bigint
)
returns void
language plpgsql
as $$
declare
  actual bigint;
begin
  execute format('select count(*) from (%s) rows', query) into actual;
  if actual is distinct from expected then
    raise exception 'FAILED %: expected % rows, got %', label, expected, actual;
  end if;
  raise notice 'ok %', label;
end;
$$;

create or replace function test_support.expect_true(label text, ok boolean)
returns void
language plpgsql
as $$
begin
  if not coalesce(ok, false) then
    raise exception 'FAILED %', label;
  end if;
  raise notice 'ok %', label;
end;
$$;

create or replace function test_support.expect_error(
  label text,
  statement text,
  expected_sqlstate text,
  message_like text default null
)
returns void
language plpgsql
as $$
begin
  execute statement;
  raise exception 'FAILED %: statement succeeded', label;
exception
  when others then
    if sqlerrm like 'FAILED %: statement succeeded' then
      raise;
    end if;
    if sqlstate <> expected_sqlstate then
      raise exception 'FAILED %: expected %, got % (%).',
        label, expected_sqlstate, sqlstate, sqlerrm;
    end if;
    if message_like is not null and sqlerrm not like message_like then
      raise exception 'FAILED %: message % did not match %',
        label, sqlerrm, message_like;
    end if;
    raise notice 'ok %', label;
end;
$$;

grant usage on schema test_support to anon, authenticated, service_role;
grant execute on all functions in schema test_support to anon, authenticated, service_role;

insert into auth.users (id, email, raw_user_meta_data)
values
  (
    '11111111-1111-4111-8111-111111111111',
    'owner@example.test',
    '{"full_name":"Owner Example"}'::jsonb
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    'manager@example.test',
    '{"full_name":"Manager Example"}'::jsonb
  ),
  (
    '33333333-3333-4333-8333-333333333333',
    'editor@example.test',
    '{"full_name":"Editor Example"}'::jsonb
  ),
  (
    '44444444-4444-4444-8444-444444444444',
    'outsider@example.test',
    '{"full_name":"Outsider Example"}'::jsonb
  ),
  (
    '55555555-5555-4555-8555-555555555555',
    'admin@example.test',
    '{"full_name":"Admin Example"}'::jsonb
  );

update public.profiles
set is_platform_admin = true
where id = '55555555-5555-4555-8555-555555555555';

insert into public.platform_admins (user_id)
values ('55555555-5555-4555-8555-555555555555');

select test_support.expect_true(
  'signup copies the auth email onto the profile',
  (
    select email = 'owner@example.test'
    from public.profiles
    where id = '11111111-1111-4111-8111-111111111111'
  )
);

select test_support.expect_true(
  'every application table forces row level security',
  (
    select bool_and(relrowsecurity and relforcerowsecurity)
    from pg_class
    where oid = any (array[
      'public.profiles'::regclass,
      'public.businesses'::regclass,
      'public.business_members'::regclass,
      'public.menu_categories'::regclass,
      'public.menu_products'::regclass,
      'public.product_variants'::regclass,
      'public.product_addons'::regclass,
      'public.business_theme_settings'::regclass,
      'public.subscription_plans'::regclass,
      'public.subscriptions'::regclass,
      'public.payments'::regclass,
      'public.email_logs'::regclass,
      'public.custom_domains'::regclass,
      'public.analytics_events'::regclass,
      'public.platform_admins'::regclass,
      'public.admin_audit_logs'::regclass,
      'public.platform_hosts'::regclass
    ])
  )
);

select test_support.expect_true(
  'anonymous role cannot read payments',
  not has_table_privilege('anon', 'public.payments', 'select')
);
select test_support.expect_true(
  'anonymous role cannot read email logs',
  not has_table_privilege('anon', 'public.email_logs', 'select')
);
select test_support.expect_true(
  'anonymous role cannot read profiles',
  not has_table_privilege('anon', 'public.profiles', 'select')
);
select test_support.expect_true(
  'authenticated role cannot update payments',
  not has_table_privilege('authenticated', 'public.payments', 'update')
);
select test_support.expect_true(
  'authenticated role cannot update subscriptions',
  not has_table_privilege('authenticated', 'public.subscriptions', 'update')
);

select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', false);
select set_config('request.jwt.claim.role', 'authenticated', false);
set role authenticated;

insert into public.businesses (id, owner_id, name, slug, status, is_published)
values (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  '11111111-1111-4111-8111-111111111111',
  'Harbor Grill',
  'harbor-grill',
  'active',
  true
);

select test_support.expect_count(
  'creating a business adds exactly one owner membership',
  $$select * from public.business_members
    where business_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' and role = 'owner'$$,
  1
);

insert into public.business_members (business_id, user_id, role)
values
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '22222222-2222-4222-8222-222222222222',
    'manager'
  ),
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '33333333-3333-4333-8333-333333333333',
    'editor'
  );

select test_support.expect_error(
  'owner cannot appoint a second owner',
  $$insert into public.business_members (business_id, user_id, role)
    values (
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      '22222222-2222-4222-8222-222222222222',
      'owner'
    )$$,
  '42501'
);

select test_support.expect_error(
  'published draft business is rejected',
  $$insert into public.businesses (owner_id, name, slug, status, is_published)
    values (
      '11111111-1111-4111-8111-111111111111',
      'Bad State',
      'bad-state',
      'draft',
      true
    )$$,
  '23514'
);

select test_support.expect_error(
  'slug must be a lowercase url segment',
  $$insert into public.businesses (owner_id, name, slug)
    values (
      '11111111-1111-4111-8111-111111111111',
      'Bad Slug',
      'Bad Slug'
    )$$,
  '23514'
);

insert into public.menu_categories (
  id, business_id, name, sort_order, is_active, is_published
)
values (
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'Mains',
  0,
  true,
  true
);

insert into public.menu_products (
  id, business_id, category_id, name, price_cents, is_active, is_published
)
values
  (
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    'Grilled fish',
    1800,
    true,
    true
  ),
  (
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    'Secret special',
    2400,
    true,
    false
  );

insert into public.product_variants (
  id, business_id, product_id, name, price_cents, is_active
)
values
  (
    'ffffffff-ffff-4fff-8fff-ffffffffffff',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    'Regular',
    1800,
    true
  ),
  (
    '17171717-1717-4171-8171-171717171717',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    'Hidden size',
    2100,
    false
  );

insert into public.product_addons (
  id, business_id, product_id, name, price_cents, is_active
)
values (
  '12121212-1212-4121-8121-121212121212',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  'Extra lemon',
  200,
  true
);

insert into public.business_theme_settings (business_id, font_family)
values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'sans');

reset role;

update public.subscriptions
set plan_id = '00000000-0000-4000-8000-000000000012'
where business_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  and status in ('pending', 'active', 'past_due');

select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', false);
select set_config('request.jwt.claim.role', 'authenticated', false);
set role authenticated;

insert into public.custom_domains (business_id, hostname, status)
values (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'menu.example.test',
  'active'
);

select test_support.expect_count(
  'client insert cannot activate a domain',
  $$select * from public.custom_domains
    where hostname = 'menu.example.test' and status = 'pending'$$,
  1
);

select test_support.expect_error(
  'client update cannot activate a domain',
  $$update public.custom_domains
    set status = 'active'
    where hostname = 'menu.example.test'$$,
  '42501',
  '%trusted server-side%'
);

update public.profiles
set full_name = 'Owner Updated',
    is_platform_admin = true
where id = '11111111-1111-4111-8111-111111111111';

update public.businesses
set owner_id = '33333333-3333-4333-8333-333333333333'
where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

reset role;

select test_support.expect_true(
  'profile privilege trigger keeps the admin flag off',
  (
    select full_name = 'Owner Updated' and is_platform_admin = false
    from public.profiles
    where id = '11111111-1111-4111-8111-111111111111'
  )
);

select test_support.expect_true(
  'owner_id cannot be reassigned by a client',
  (
    select owner_id = '11111111-1111-4111-8111-111111111111'
    from public.businesses
    where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  )
);

update public.custom_domains
set status = 'active', verified_at = now()
where hostname = 'menu.example.test';

update public.subscriptions
set
  id = '13131313-1313-4131-8131-131313131313',
  plan_id = '00000000-0000-4000-8000-000000000002',
  status = 'active',
  current_period_start = now(),
  current_period_end = now() + interval '30 days'
where business_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  and status in ('pending', 'active', 'past_due');

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

insert into public.email_logs (id, business_id, to_email, template, status)
values (
  '15151515-1515-4151-8151-151515151515',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'owner@example.test',
  'subscription-receipt',
  'sent'
);

insert into public.analytics_events (
  id, business_id, menu_product_id, event_name, visitor_hash
)
values (
  '16161616-1616-4161-8161-161616161616',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  'product_view',
  '0123456789abcdef'
);

insert into public.subscription_plans (code, name, amount_cents, currency, is_active)
values ('dev_hidden', 'Hidden (development)', 100, 'USD', false);

select set_config('request.jwt.claim.sub', '44444444-4444-4444-8444-444444444444', false);
set role authenticated;

insert into public.businesses (id, owner_id, name, slug, status, is_published)
values (
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  '44444444-4444-4444-8444-444444444444',
  'Private Kitchen',
  'private-kitchen',
  'draft',
  false
);

insert into public.menu_categories (
  id, business_id, name, is_active, is_published
)
values (
  'abababab-abab-4aba-8aba-abababababab',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  'Specials',
  true,
  true
);

insert into public.menu_products (
  id, business_id, category_id, name, price_cents, is_active, is_published
)
values (
  'bcbcbcbc-bcbc-4bcb-8bcb-bcbcbcbcbcbc',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  'abababab-abab-4aba-8aba-abababababab',
  'Unpublished stew',
  1200,
  true,
  true
);

reset role;

insert into public.custom_domains (business_id, hostname)
values (
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  'kitchen.example.test'
);

select set_config('request.jwt.claim.sub', '44444444-4444-4444-8444-444444444444', false);
select set_config('request.jwt.claim.role', 'authenticated', false);
set role authenticated;

update public.businesses
set name = 'Taken Over'
where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

select test_support.expect_count(
  'outsider sees only their own business record',
  'select * from public.businesses',
  1
);

select test_support.expect_count(
  'outsider sees their menu plus the published public product',
  'select * from public.menu_products',
  2
);

select test_support.expect_count(
  'outsider cannot read the other tenant draft product',
  $$select * from public.menu_products
    where id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'$$,
  0
);

select test_support.expect_count(
  'outsider cannot read another tenant payment',
  'select * from public.payments',
  0
);

select test_support.expect_count(
  'outsider cannot read email logs',
  'select * from public.email_logs',
  0
);

select test_support.expect_error(
  'product category must belong to the same business',
  $$insert into public.menu_products (
      business_id, category_id, name, price_cents, is_active, is_published
    )
    values (
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      'Smuggled',
      100,
      true,
      true
    )$$,
  '23503'
);

reset role;

select test_support.expect_true(
  'outsider update did not rename the other business',
  (
    select name = 'Harbor Grill'
    from public.businesses
    where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  )
);

select set_config('request.jwt.claim.sub', '', false);
select set_config('request.jwt.claim.role', 'anon', false);
set role anon;

select test_support.expect_count(
  'anonymous visitor sees only the published active business',
  'select * from public.public_businesses',
  1
);

select test_support.expect_count(
  'anonymous visitor sees only the published product',
  'select * from public.menu_products',
  1
);

select test_support.expect_count(
  'anonymous visitor sees only the active variant',
  'select * from public.product_variants',
  1
);

select test_support.expect_count(
  'anonymous visitor sees the published addon',
  'select * from public.product_addons',
  1
);

select test_support.expect_count(
  'anonymous visitor sees theme settings for the public business',
  'select * from public.business_theme_settings',
  1
);

select test_support.expect_count(
  'anonymous visitor sees only the active public domain',
  'select * from public.custom_domains',
  1
);

select test_support.expect_count(
  'anonymous visitor sees active catalog plans',
  'select * from public.subscription_plans',
  3
);

select test_support.expect_error(
  'anonymous visitor cannot read the owner id',
  'select owner_id from public.businesses limit 1',
  '42501'
);

select test_support.expect_error(
  'anonymous visitor cannot read payments',
  'select * from public.payments',
  '42501'
);

select test_support.expect_error(
  'anonymous visitor cannot read subscriptions',
  'select * from public.subscriptions',
  '42501'
);

select test_support.expect_error(
  'anonymous visitor cannot read email logs',
  'select * from public.email_logs',
  '42501'
);

select test_support.expect_error(
  'anonymous visitor cannot read profiles',
  'select * from public.profiles',
  '42501'
);

select test_support.expect_error(
  'anonymous visitor cannot read memberships',
  'select * from public.business_members',
  '42501'
);

select test_support.expect_error(
  'anonymous visitor cannot read analytics',
  'select * from public.analytics_events',
  '42501'
);

select test_support.expect_error(
  'anonymous visitor cannot insert a payment',
  $$insert into public.payments (
      business_id, subscription_id, amount_cents, currency, status, provider
    )
    values (
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      '13131313-1313-4131-8131-131313131313',
      1,
      'USD',
      'completed',
      'paypal'
    )$$,
  '42501'
);

reset role;
select set_config('request.jwt.claim.sub', '33333333-3333-4333-8333-333333333333', false);
select set_config('request.jwt.claim.role', 'authenticated', false);
set role authenticated;

select test_support.expect_count(
  'editor sees published and draft products for their business',
  'select * from public.menu_products',
  2
);

update public.menu_products
set name = 'Secret special revised'
where id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';

select test_support.expect_count(
  'editor saved the draft product rename',
  $$select * from public.menu_products
    where id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'
      and name = 'Secret special revised'$$,
  1
);

update public.business_theme_settings
set font_family = 'editor'
where business_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

select test_support.expect_count(
  'editor cannot change theme settings',
  $$select * from public.business_theme_settings where font_family = 'editor'$$,
  0
);

select test_support.expect_count(
  'editor cannot read payments',
  'select * from public.payments',
  0
);

select test_support.expect_error(
  'editor cannot add a staff member',
  $$insert into public.business_members (business_id, user_id, role)
    values (
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      '44444444-4444-4444-8444-444444444444',
      'editor'
    )$$,
  '42501'
);

reset role;
select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', false);
set role authenticated;

update public.business_theme_settings
set font_family = 'serif'
where business_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

select test_support.expect_count(
  'manager can update theme settings',
  $$select * from public.business_theme_settings where font_family = 'serif'$$,
  1
);

select test_support.expect_count(
  'manager can read the business payment',
  'select * from public.payments',
  1
);

delete from public.business_members
where business_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  and role = 'owner';

select test_support.expect_count(
  'manager cannot remove the owner',
  $$select * from public.business_members
    where business_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' and role = 'owner'$$,
  1
);

select test_support.expect_error(
  'manager cannot update payment status',
  $$update public.payments set status = 'completed', paid_at = now()
    where id = '14141414-1414-4141-8141-141414141414'$$,
  '42501'
);

reset role;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', false);
set role authenticated;

select test_support.expect_count(
  'owner can read the business payment',
  'select * from public.payments',
  1
);

select test_support.expect_error(
  'owner cannot update payment status',
  $$update public.payments set status = 'completed', paid_at = now()
    where id = '14141414-1414-4141-8141-141414141414'$$,
  '42501'
);

reset role;
select set_config('request.jwt.claim.sub', '55555555-5555-4555-8555-555555555555', false);
set role authenticated;

select test_support.expect_count(
  'administrator can read every business',
  'select * from public.businesses',
  2
);

select test_support.expect_count(
  'administrator can read email logs',
  'select * from public.email_logs',
  1
);

select test_support.expect_count(
  'administrator can read payments',
  'select * from public.payments',
  1
);

select test_support.expect_count(
  'administrator can read the hidden development plan',
  $$select * from public.subscription_plans where code = 'dev_hidden'$$,
  1
);

select test_support.expect_count(
  'administrator can read analytics',
  'select * from public.analytics_events',
  1
);

select test_support.expect_error(
  'administrator cannot update payment status through the client role',
  $$update public.payments set status = 'failed'
    where id = '14141414-1414-4141-8141-141414141414'$$,
  '42501'
);

reset role;

grant update on table public.payments to authenticated;
create policy payments_test_update
  on public.payments
  for update
  to authenticated
  using (true)
  with check (true);

select set_config('request.jwt.claim.sub', '55555555-5555-4555-8555-555555555555', false);
set role authenticated;

select test_support.expect_error(
  'billing trigger blocks a client even if a write policy exists',
  $$update public.payments set status = 'failed'
    where id = '14141414-1414-4141-8141-141414141414'$$,
  '42501',
  '%trusted server-side%'
);

reset role;
drop policy payments_test_update on public.payments;
revoke update on table public.payments from authenticated;

select test_support.expect_error(
  'analytics product must belong to the event business',
  $$insert into public.analytics_events (business_id, menu_product_id, event_name)
    values (
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
      'menu_view'
    )$$,
  '23514'
);

set role service_role;

update public.payments
set status = 'completed',
    paid_at = now()
where id = '14141414-1414-4141-8141-141414141414';

reset role;

select test_support.expect_true(
  'service role can mark a payment completed',
  (
    select status = 'completed' and paid_at is not null
    from public.payments
    where id = '14141414-1414-4141-8141-141414141414'
  )
);

delete from public.payments;
delete from public.subscriptions;
