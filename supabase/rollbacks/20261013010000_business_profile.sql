-- Rollback for 20261013010000_business_profile.sql.
-- Run this before supabase/rollbacks/20261013003000_foundation.sql.

drop policy if exists business_media_delete on storage.objects;
drop policy if exists business_media_update on storage.objects;
drop policy if exists business_media_insert on storage.objects;
drop policy if exists business_media_select on storage.objects;

delete from storage.objects where bucket_id = 'business-media';
delete from storage.buckets where id = 'business-media';

drop view if exists public.public_businesses;

create view public.public_businesses
with (security_barrier = true, security_invoker = true) as
select
  id,
  name,
  slug,
  description,
  currency
from public.businesses
where status = 'active'
  and is_published;

comment on view public.public_businesses is
  'Published active businesses without owner identifiers.';

revoke all on table public.public_businesses from public, anon, authenticated;
grant select on table public.public_businesses to anon, authenticated, service_role;

alter table public.businesses
  drop constraint if exists businesses_cover_path_safe,
  drop constraint if exists businesses_logo_path_safe,
  drop constraint if exists businesses_profile_documents_valid,
  drop constraint if exists businesses_time_zone_format,
  drop constraint if exists businesses_default_language_values,
  drop constraint if exists businesses_map_url_https,
  drop constraint if exists businesses_address_length,
  drop constraint if exists businesses_phone_format,
  drop constraint if exists businesses_type_values;

alter table public.businesses
  drop column if exists time_zone,
  drop column if exists default_language,
  drop column if exists social_links,
  drop column if exists opening_hours,
  drop column if exists map_url,
  drop column if exists address,
  drop column if exists phone,
  drop column if exists cover_path,
  drop column if exists logo_path,
  drop column if exists business_type;

drop function if exists public.business_profile_documents_valid(jsonb, jsonb);
