-- Allow a website icon (.ico) in the public homepage media bucket.

update storage.buckets
set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/x-icon', 'image/vnd.microsoft.icon']
where id = 'platform-media';

drop policy if exists platform_media_insert on storage.objects;
drop policy if exists platform_media_update on storage.objects;
drop policy if exists platform_media_delete on storage.objects;

create policy platform_media_insert
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'platform-media'
    and public.is_platform_admin()
    and name ~ '^homepage/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp|ico)$'
  );

create policy platform_media_update
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'platform-media' and public.is_platform_admin())
  with check (
    bucket_id = 'platform-media'
    and public.is_platform_admin()
    and name ~ '^homepage/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp|ico)$'
  );

create policy platform_media_delete
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'platform-media'
    and public.is_platform_admin()
    and name ~ '^homepage/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp|ico)$'
  );
