-- Menu details: bilingual text, minor-unit compare prices, stock, labels, and galleries.
-- price_cents remains an integer count of the business currency's minor unit.
-- It is not a floating-point amount. USD 10.50 is 1050. KWD 1.250 is 1250.

create or replace function public.dietary_labels_valid(labels text[])
returns boolean
language sql
immutable
set search_path = ''
as $$
  select labels is not null
    and cardinality(labels) = cardinality(array(select distinct unnest(labels)))
    and not exists (
      select 1
      from unnest(labels) as label
      where label not in (
        'vegetarian', 'vegan', 'spicy', 'gluten', 'dairy', 'nuts', 'shellfish', 'sesame'
      )
    );
$$;

alter table public.menu_categories
  add column name_ar text,
  add column description_ar text;

alter table public.menu_categories
  add constraint menu_categories_name_ar_length
    check (name_ar is null or char_length(btrim(name_ar)) between 1 and 120),
  add constraint menu_categories_description_ar_length
    check (description_ar is null or char_length(description_ar) <= 2000);

create unique index menu_categories_business_name_ar_key
  on public.menu_categories (business_id, name_ar)
  where name_ar is not null;

alter table public.menu_products
  add column name_ar text,
  add column description_ar text,
  add column compare_at_cents integer,
  add column stock_status text not null default 'in_stock',
  add column is_featured boolean not null default false,
  add column dietary_labels text[] not null default '{}';

alter table public.menu_products
  add constraint menu_products_name_ar_length
    check (name_ar is null or char_length(btrim(name_ar)) between 1 and 160),
  add constraint menu_products_description_ar_length
    check (description_ar is null or char_length(description_ar) <= 4000),
  add constraint menu_products_compare_at_above_price
    check (compare_at_cents is null or compare_at_cents > price_cents),
  add constraint menu_products_stock_status_values
    check (stock_status in ('in_stock', 'out_of_stock')),
  add constraint menu_products_dietary_labels_valid
    check (public.dietary_labels_valid(dietary_labels));

create unique index menu_products_category_name_ar_key
  on public.menu_products (category_id, name_ar)
  where name_ar is not null;

create index menu_products_business_featured_idx
  on public.menu_products (business_id, is_featured, sort_order);

alter table public.product_variants
  add column name_ar text;

alter table public.product_variants
  add constraint product_variants_name_ar_length
    check (name_ar is null or char_length(btrim(name_ar)) between 1 and 120);

alter table public.product_addons
  add column name_ar text;

alter table public.product_addons
  add constraint product_addons_name_ar_length
    check (name_ar is null or char_length(btrim(name_ar)) between 1 and 120);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  product_id uuid not null,
  image_path text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint product_images_product_business_fkey
    foreign key (product_id, business_id)
    references public.menu_products (id, business_id)
    on delete cascade,
  constraint product_images_sort_order_nonnegative check (sort_order >= 0),
  constraint product_images_path_key unique (product_id, image_path),
  constraint product_images_path_safe check (
    lower(image_path) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/img-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$'
    and lower(image_path) like lower(business_id::text) || '/' || lower(product_id::text) || '/%'
  )
);

create index product_images_product_id_idx
  on public.product_images (product_id, sort_order);

create trigger tr_product_images_lock_business_id
  before update on public.product_images
  for each row execute function public.lock_business_id();

create or replace function public.lock_product_id()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE'
    and current_user in ('anon', 'authenticated')
    and new.product_id is distinct from old.product_id
  then
    raise exception 'product_id cannot be changed'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger tr_product_variants_lock_product_id
  before update on public.product_variants
  for each row execute function public.lock_product_id();

create trigger tr_product_addons_lock_product_id
  before update on public.product_addons
  for each row execute function public.lock_product_id();

create trigger tr_product_images_lock_product_id
  before update on public.product_images
  for each row execute function public.lock_product_id();

create or replace function public.limit_product_images()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (
    select count(*)
    from public.product_images
    where product_images.product_id = new.product_id
  ) >= 8 then
    raise exception 'a product can have at most 8 images'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger tr_product_images_limit
  before insert on public.product_images
  for each row execute function public.limit_product_images();

alter table public.product_images enable row level security;
alter table public.product_images force row level security;

create policy product_images_select
  on public.product_images
  for select
  to anon, authenticated
  using (
    public.is_business_member(business_id)
    or public.is_platform_admin()
    or public.product_is_public(product_id)
  );

create policy product_images_write
  on public.product_images
  for all
  to authenticated
  using (public.has_business_role(business_id, array['owner', 'manager', 'editor']))
  with check (public.has_business_role(business_id, array['owner', 'manager', 'editor']));

grant select on table public.product_images to anon;
grant select, insert, update, delete on table public.product_images to authenticated;
grant all on table public.product_images to service_role;

create or replace function public.menu_media_writable(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.menu_products
    where menu_products.business_id = case
        when (storage.foldername(object_name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
          then ((storage.foldername(object_name))[1])::uuid
        else null
      end
      and menu_products.id = case
        when (storage.foldername(object_name))[2] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
          then ((storage.foldername(object_name))[2])::uuid
        else null
      end
      and public.has_business_role(
        menu_products.business_id,
        array['owner', 'manager', 'editor']
      )
  );
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'menu-media',
  'menu-media',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy menu_media_select
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'menu-media');

create policy menu_media_insert
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'menu-media'
    and name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/img-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$'
    and public.menu_media_writable(name)
  );

create policy menu_media_update
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'menu-media' and public.menu_media_writable(name))
  with check (
    bucket_id = 'menu-media'
    and name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/img-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$'
    and public.menu_media_writable(name)
  );

create policy menu_media_delete
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'menu-media' and public.menu_media_writable(name));
