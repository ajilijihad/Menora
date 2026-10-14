-- Local stand-in for Supabase roles and auth.uid().
-- Not a migration. Hosted Supabase already provides these objects.

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin nosuperuser nobypassrls;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin nosuperuser nobypassrls;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin nosuperuser bypassrls;
  end if;
end
$$;

create schema if not exists auth;

create table if not exists auth.users (
  id uuid primary key,
  email text,
  raw_user_meta_data jsonb not null default '{}'::jsonb
);

create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

create or replace function auth.role()
returns text
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.role', true), '');
$$;

grant usage on schema auth to anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;

create schema if not exists storage;

create table if not exists storage.buckets (
  id text primary key,
  name text not null,
  public boolean not null default false,
  file_size_limit bigint,
  allowed_mime_types text[]
);

create table if not exists storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text not null,
  name text,
  owner uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb
);

create or replace function storage.foldername(object_name text)
returns text[]
language sql
immutable
as $$
  select string_to_array(object_name, '/');
$$;

alter table storage.objects enable row level security;
grant usage on schema storage to anon, authenticated, service_role;
grant select on table storage.buckets to anon, authenticated, service_role;
grant select on table storage.objects to anon;
grant select, insert, update, delete on table storage.objects to authenticated;
grant all on table storage.objects to service_role;
grant all on table storage.buckets to service_role;
