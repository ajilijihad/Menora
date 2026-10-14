-- Saved QR poster size and optional background image.

alter table public.businesses
  add column if not exists poster_background_path text,
  add column if not exists poster_size text not null default 'a5';

alter table public.businesses
  drop constraint if exists businesses_poster_size_values,
  drop constraint if exists businesses_poster_background_path_safe;

alter table public.businesses
  add constraint businesses_poster_size_values
    check (poster_size in ('a5', 'a6', 'a7', 'square', 'letter')),
  add constraint businesses_poster_background_path_safe
    check (
      poster_background_path is null
      or (
        lower(poster_background_path) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/poster-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$'
        and lower(poster_background_path) like lower(id::text) || '/%'
      )
    );

drop policy if exists business_media_insert on storage.objects;
drop policy if exists business_media_update on storage.objects;

create policy business_media_insert
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'business-media'
    and name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/(logo|cover|poster)-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$'
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
    and name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/(logo|cover|poster)-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$'
    and public.has_business_role(
      case
        when (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
          then ((storage.foldername(name))[1])::uuid
        else null
      end,
      array['owner', 'manager']
    )
  );
