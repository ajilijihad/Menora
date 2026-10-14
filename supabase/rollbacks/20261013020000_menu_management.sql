-- Rollback for 20261013020000_menu_management.sql.
-- Run this before the business profile rollback.

drop policy if exists menu_media_delete on storage.objects;
drop policy if exists menu_media_update on storage.objects;
drop policy if exists menu_media_insert on storage.objects;
drop policy if exists menu_media_select on storage.objects;

delete from storage.objects where bucket_id = 'menu-media';
delete from storage.buckets where id = 'menu-media';

drop function if exists public.menu_media_writable(text);

drop trigger if exists tr_product_variants_lock_product_id on public.product_variants;
drop trigger if exists tr_product_addons_lock_product_id on public.product_addons;
drop trigger if exists tr_product_images_limit on public.product_images;
drop trigger if exists tr_product_images_lock_product_id on public.product_images;
drop trigger if exists tr_product_images_lock_business_id on public.product_images;

drop table if exists public.product_images;
drop function if exists public.limit_product_images();
drop function if exists public.lock_product_id();

alter table public.product_addons
  drop constraint if exists product_addons_name_ar_length;
alter table public.product_addons
  drop column if exists name_ar;

alter table public.product_variants
  drop constraint if exists product_variants_name_ar_length;
alter table public.product_variants
  drop column if exists name_ar;

drop index if exists public.menu_products_category_name_ar_key;
drop index if exists public.menu_products_business_featured_idx;

alter table public.menu_products
  drop constraint if exists menu_products_dietary_labels_valid,
  drop constraint if exists menu_products_stock_status_values,
  drop constraint if exists menu_products_compare_at_above_price,
  drop constraint if exists menu_products_description_ar_length,
  drop constraint if exists menu_products_name_ar_length;

alter table public.menu_products
  drop column if exists dietary_labels,
  drop column if exists is_featured,
  drop column if exists stock_status,
  drop column if exists compare_at_cents,
  drop column if exists description_ar,
  drop column if exists name_ar;

drop index if exists public.menu_categories_business_name_ar_key;

alter table public.menu_categories
  drop constraint if exists menu_categories_description_ar_length,
  drop constraint if exists menu_categories_name_ar_length;

alter table public.menu_categories
  drop column if exists description_ar,
  drop column if exists name_ar;

drop function if exists public.dietary_labels_valid(text[]);
