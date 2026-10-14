-- Business profile fields and media storage rules.
-- Hosted Supabase already has the storage schema. The local database check
-- creates a compatible stub in supabase/tests/bootstrap.sql before this file.

alter table public.businesses
  add column business_type text not null default 'other',
  add column logo_path text,
  add column cover_path text,
  add column phone text,
  add column address text,
  add column map_url text,
  add column opening_hours jsonb not null default '{}'::jsonb,
  add column social_links jsonb not null default '{}'::jsonb,
  add column default_language text not null default 'en',
  add column time_zone text not null default 'UTC';

create or replace function public.business_profile_documents_valid(hours jsonb, social jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select
    jsonb_typeof(hours) = 'object'
    and jsonb_typeof(social) = 'object'
    and not exists (
      select 1
      from jsonb_object_keys(hours) as day_key
      where day_key not in (
        'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
      )
    )
    and not exists (
      select 1
      from jsonb_each(hours) as entry
      where jsonb_typeof(entry.value) <> 'object'
        or jsonb_typeof(entry.value -> 'closed') <> 'boolean'
    )
    and not exists (
      select 1
      from jsonb_object_keys(social) as link_key
      where link_key not in ('instagram', 'facebook', 'tiktok', 'x', 'website')
    )
    and not exists (
      select 1
      from jsonb_each_text(social) as entry
      where char_length(entry.value) > 500
        or entry.value !~ '^https://'
    );
$$;

alter table public.businesses
  add constraint businesses_type_values
    check (business_type in ('restaurant', 'cafe', 'bakery', 'other')),
  add constraint businesses_phone_format
    check (phone is null or phone ~ '^\+?[0-9][0-9 ()-]{6,31}$'),
  add constraint businesses_address_length
    check (address is null or char_length(address) between 1 and 300),
  add constraint businesses_map_url_https
    check (
      map_url is null
      or (char_length(map_url) between 12 and 500 and map_url ~ '^https://')
    ),
  add constraint businesses_default_language_values
    check (default_language in ('en', 'ar')),
  add constraint businesses_time_zone_format
    check (time_zone ~ '^[A-Za-z0-9_+-]{1,32}(?:/[A-Za-z0-9_+-]{1,32}){0,2}$'),
  add constraint businesses_profile_documents_valid
    check (public.business_profile_documents_valid(opening_hours, social_links)),
  add constraint businesses_logo_path_safe
    check (
      logo_path is null
      or (
        lower(logo_path) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/logo-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$'
        and lower(logo_path) like lower(id::text) || '/%'
      )
    ),
  add constraint businesses_cover_path_safe
    check (
      cover_path is null
      or (
        lower(cover_path) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/cover-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$'
        and lower(cover_path) like lower(id::text) || '/%'
      )
    );

create or replace view public.public_businesses
with (security_barrier = true, security_invoker = true) as
select
  id,
  name,
  slug,
  description,
  currency,
  business_type,
  logo_path,
  cover_path,
  phone,
  address,
  map_url,
  opening_hours,
  social_links,
  default_language,
  time_zone
from public.businesses
where status = 'active'
  and is_published;

comment on view public.public_businesses is
  'Published active businesses without owner identifiers.';

grant select (
  business_type,
  logo_path,
  cover_path,
  phone,
  address,
  map_url,
  opening_hours,
  social_links,
  default_language,
  time_zone
) on table public.businesses to anon;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'business-media',
  'business-media',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy business_media_select
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'business-media');

create policy business_media_insert
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'business-media'
    and name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/(logo|cover)-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$'
    and public.has_business_role(
      case
        when (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
          then ((storage.foldername(name))[1])::uuid
        else null
      end,
      array['owner', 'manager']
    )
  );

create policy business_media_update
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'business-media'
    and public.has_business_role(
      case
        when (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
          then ((storage.foldername(name))[1])::uuid
        else null
      end,
      array['owner', 'manager']
    )
  )
  with check (
    bucket_id = 'business-media'
    and name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/(logo|cover)-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$'
    and public.has_business_role(
      case
        when (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
          then ((storage.foldername(name))[1])::uuid
        else null
      end,
      array['owner', 'manager']
    )
  );

create policy business_media_delete
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'business-media'
    and public.has_business_role(
      case
        when (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
          then ((storage.foldername(name))[1])::uuid
        else null
      end,
      array['owner', 'manager']
    )
  );
