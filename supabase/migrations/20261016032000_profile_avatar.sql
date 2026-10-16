-- Personal profile pictures. The path is owned by the profile id.

alter table public.profiles
  add column avatar_path text;

alter table public.profiles
  add constraint profiles_avatar_path_safe
  check (
    avatar_path is null
    or (
      lower(avatar_path) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/avatar-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$'
      and lower(avatar_path) like lower(id::text) || '/%'
    )
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-media',
  'profile-media',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy profile_media_select
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'profile-media');

create policy profile_media_insert
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'profile-media'
    and name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/avatar-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$'
    and lower((storage.foldername(name))[1]) = lower(auth.uid()::text)
  );

create policy profile_media_update
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'profile-media'
    and lower((storage.foldername(name))[1]) = lower(auth.uid()::text)
  )
  with check (
    bucket_id = 'profile-media'
    and lower((storage.foldername(name))[1]) = lower(auth.uid()::text)
  );

create policy profile_media_delete
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'profile-media'
    and lower((storage.foldername(name))[1]) = lower(auth.uid()::text)
  );
