-- Menu CRUD, price rules, and tenant isolation.

reset role;
select set_config('request.jwt.claim.sub', 'c1111111-1111-4111-8111-111111111111', false);
select set_config('request.jwt.claim.role', 'authenticated', false);
set role authenticated;

insert into public.menu_categories (
  id, business_id, name, name_ar, description, description_ar, sort_order, is_published
)
values (
  'd1d1d1d1-d1d1-41d1-81d1-d1d1d1d1d1d1',
  'c1c1c1c1-c1c1-41c1-81c1-c1c1c1c1c1c1',
  'Coffee',
  'القهوة',
  'Hot drinks',
  'مشروبات ساخنة',
  0,
  false
);

insert into public.menu_products (
  id,
  business_id,
  category_id,
  name,
  name_ar,
  description,
  description_ar,
  price_cents,
  compare_at_cents,
  stock_status,
  is_featured,
  dietary_labels,
  sort_order
)
values (
  'd2d2d2d2-d2d2-42d2-82d2-d2d2d2d2d2d2',
  'c1c1c1c1-c1c1-41c1-81c1-c1c1c1c1c1c1',
  'd1d1d1d1-d1d1-41d1-81d1-d1d1d1d1d1d1',
  'Espresso',
  'إسبريسو',
  'Short shot',
  'جرعة قصيرة',
  400,
  500,
  'in_stock',
  true,
  array['vegan'],
  0
);

insert into public.product_variants (business_id, product_id, name, name_ar, price_cents, sort_order)
values (
  'c1c1c1c1-c1c1-41c1-81c1-c1c1c1c1c1c1',
  'd2d2d2d2-d2d2-42d2-82d2-d2d2d2d2d2d2',
  'Large',
  'كبير',
  550,
  0
);

insert into public.product_addons (business_id, product_id, name, name_ar, price_cents, sort_order)
values (
  'c1c1c1c1-c1c1-41c1-81c1-c1c1c1c1c1c1',
  'd2d2d2d2-d2d2-42d2-82d2-d2d2d2d2d2d2',
  'Oat milk',
  'حليب الشوفان',
  75,
  0
);

insert into public.product_images (business_id, product_id, image_path, sort_order)
values (
  'c1c1c1c1-c1c1-41c1-81c1-c1c1c1c1c1c1',
  'd2d2d2d2-d2d2-42d2-82d2-d2d2d2d2d2d2',
  'c1c1c1c1-c1c1-41c1-81c1-c1c1c1c1c1c1/d2d2d2d2-d2d2-42d2-82d2-d2d2d2d2d2d2/img-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.png',
  0
);

insert into storage.objects (bucket_id, name)
values (
  'menu-media',
  'c1c1c1c1-c1c1-41c1-81c1-c1c1c1c1c1c1/d2d2d2d2-d2d2-42d2-82d2-d2d2d2d2d2d2/img-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.png'
);

select test_support.expect_count(
  'owner can store a product and its gallery',
  $$select * from public.product_images
    where product_id = 'd2d2d2d2-d2d2-42d2-82d2-d2d2d2d2d2d2'$$,
  1
);

select test_support.expect_error(
  'compare-at price must be above the selling price',
  $$update public.menu_products
    set compare_at_cents = 400
    where id = 'd2d2d2d2-d2d2-42d2-82d2-d2d2d2d2d2d2'$$,
  '23514'
);

select test_support.expect_error(
  'a negative price is rejected',
  $$update public.menu_products
    set price_cents = -1
    where id = 'd2d2d2d2-d2d2-42d2-82d2-d2d2d2d2d2d2'$$,
  '23514'
);

select test_support.expect_error(
  'a product image must stay inside the product folder',
  $$insert into public.product_images (business_id, product_id, image_path)
    values (
      'c1c1c1c1-c1c1-41c1-81c1-c1c1c1c1c1c1',
      'd2d2d2d2-d2d2-42d2-82d2-d2d2d2d2d2d2',
      'c1c1c1c1-c1c1-41c1-81c1-c1c1c1c1c1c1/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/img-bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb.png'
    )$$,
  '23514'
);

select test_support.expect_error(
  'product business_id cannot be reassigned',
  $$update public.menu_products
    set business_id = 'd3d3d3d3-d3d3-43d3-83d3-d3d3d3d3d3d3'
    where id = 'd2d2d2d2-d2d2-42d2-82d2-d2d2d2d2d2d2'$$,
  '42501'
);

set role authenticated;
select set_config('request.jwt.claim.sub', 'c3333333-3333-4333-8333-333333333333', false);

update public.menu_products
set name = 'House Espresso'
where id = 'd2d2d2d2-d2d2-42d2-82d2-d2d2d2d2d2d2';

select test_support.expect_true(
  'editor can rename a product in their business',
  (
    select name = 'House Espresso'
    from public.menu_products
    where id = 'd2d2d2d2-d2d2-42d2-82d2-d2d2d2d2d2d2'
  )
);

select set_config('request.jwt.claim.sub', 'c2222222-2222-4222-8222-222222222222', false);

select test_support.expect_count(
  'another account cannot read a draft product',
  $$select * from public.menu_products
    where id = 'd2d2d2d2-d2d2-42d2-82d2-d2d2d2d2d2d2'$$,
  0
);

insert into public.businesses (id, owner_id, name, slug)
values (
  'd3d3d3d3-d3d3-43d3-83d3-d3d3d3d3d3d3',
  'c2222222-2222-4222-8222-222222222222',
  'Outsider Kitchen',
  'outsider-kitchen'
);

insert into public.menu_categories (id, business_id, name)
values (
  'd4d4d4d4-d4d4-44d4-84d4-d4d4d4d4d4d4',
  'd3d3d3d3-d3d3-43d3-83d3-d3d3d3d3d3d3',
  'Sides'
);

select test_support.expect_error(
  'a product cannot use a category from another business',
  $$insert into public.menu_products (business_id, category_id, name, price_cents)
    values (
      'd3d3d3d3-d3d3-43d3-83d3-d3d3d3d3d3d3',
      'd1d1d1d1-d1d1-41d1-81d1-d1d1d1d1d1d1',
      'Stolen',
      100
    )$$,
  '23503'
);

select test_support.expect_error(
  'another account cannot upload into the product folder',
  $$insert into storage.objects (bucket_id, name)
    values (
      'menu-media',
      'c1c1c1c1-c1c1-41c1-81c1-c1c1c1c1c1c1/d2d2d2d2-d2d2-42d2-82d2-d2d2d2d2d2d2/img-bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb.png'
    )$$,
  '42501'
);

reset role;
select set_config('request.jwt.claim.sub', '', false);
set role anon;

select test_support.expect_count(
  'anonymous visitors cannot read an unpublished product',
  $$select name from public.menu_products
    where id = 'd2d2d2d2-d2d2-42d2-82d2-d2d2d2d2d2d2'$$,
  0
);

reset role;
