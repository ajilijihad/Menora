alter table public.menu_categories
  add column icon text,
  add column image_path text;

alter table public.menu_categories
  add constraint menu_categories_icon_known check (
    icon is null
    or icon in (
      'meal',
      'drink',
      'juice',
      'coffee',
      'water',
      'wine',
      'beer',
      'cocktail',
      'milk',
      'fish',
      'vegetable',
      'salad',
      'fruit',
      'dessert',
      'ice-cream',
      'cake',
      'bakery',
      'burger',
      'pizza',
      'chicken',
      'meat',
      'soup',
      'breakfast',
      'sandwich',
      'grill',
      'snack'
    )
  ),
  add constraint menu_categories_image_path_safe check (
    image_path is null
    or (
      char_length(image_path) between 1 and 180
      and lower(image_path) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/cat-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$'
      and lower(image_path) like lower(business_id::text) || '/cat-' || lower(id::text) || '-%'
    )
  ),
  add constraint menu_categories_icon_or_image check (icon is null or image_path is null);

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
  )
  or exists (
    select 1
    from public.menu_categories
    where menu_categories.business_id = case
        when (storage.foldername(object_name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
          then ((storage.foldername(object_name))[1])::uuid
        else null
      end
      and menu_categories.id = case
        when substring(storage.filename(object_name) from '^cat-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})-')
          ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
          then substring(storage.filename(object_name) from '^cat-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})-')::uuid
        else null
      end
      and public.has_business_role(
        menu_categories.business_id,
        array['owner', 'manager', 'editor']
      )
  );
$$;

drop policy if exists menu_media_insert on storage.objects;
drop policy if exists menu_media_update on storage.objects;

create policy menu_media_insert
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'menu-media'
    and (
      name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/img-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$'
      or name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/cat-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$'
    )
    and public.menu_media_writable(name)
  );

create policy menu_media_update
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'menu-media' and public.menu_media_writable(name))
  with check (
    bucket_id = 'menu-media'
    and (
      name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/img-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$'
      or name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/cat-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$'
    )
    and public.menu_media_writable(name)
  );
