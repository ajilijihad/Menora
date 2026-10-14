-- Public homepage content edited by platform administrators.
-- Apply after 20261013120000_admin_grant_plan.sql.
-- No default row is inserted, so a later migration cannot overwrite saved content.

create table public.platform_homepage (
  singleton boolean primary key default true,
  content jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null,
  constraint platform_homepage_singleton check (singleton),
  constraint platform_homepage_content_size check (octet_length(content::text) between 2 and 120000)
);

comment on table public.platform_homepage is
  'Single published document for the public marketing homepage. Prices stay on subscription_plans.';

create trigger tr_platform_homepage_set_updated_at
  before update on public.platform_homepage
  for each row execute function public.set_updated_at();

alter table public.platform_homepage enable row level security;
alter table public.platform_homepage force row level security;

revoke all on table public.platform_homepage from public, anon, authenticated;
grant select on table public.platform_homepage to anon, authenticated;
grant insert, update on table public.platform_homepage to authenticated;
grant all on table public.platform_homepage to service_role;

create policy platform_homepage_select
  on public.platform_homepage
  for select
  to anon, authenticated
  using (true);

create policy platform_homepage_insert
  on public.platform_homepage
  for insert
  to authenticated
  with check (public.is_platform_admin() and singleton);

create policy platform_homepage_update
  on public.platform_homepage
  for update
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin() and singleton);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'platform-media',
  'platform-media',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy platform_media_select
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'platform-media');

create policy platform_media_insert
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'platform-media'
    and public.is_platform_admin()
    and name ~ '^homepage/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$'
  );

create policy platform_media_update
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'platform-media' and public.is_platform_admin())
  with check (
    bucket_id = 'platform-media'
    and public.is_platform_admin()
    and name ~ '^homepage/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$'
  );

create policy platform_media_delete
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'platform-media'
    and public.is_platform_admin()
    and name ~ '^homepage/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$'
  );
