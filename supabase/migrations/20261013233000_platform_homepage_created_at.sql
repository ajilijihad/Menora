-- The shared set_updated_at trigger copies created_at on every update.
-- platform_homepage was created without that column, so saves failed.

alter table public.platform_homepage
  add column created_at timestamptz not null default now();

comment on column public.platform_homepage.created_at is
  'Set when the homepage document is first saved. Later saves keep this value.';
