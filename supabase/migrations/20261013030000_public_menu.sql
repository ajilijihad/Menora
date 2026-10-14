-- Public menu layout and a published-business lookup that does not expose owner_id.
-- Apply after 20261013020000_menu_management.sql.

alter table public.business_theme_settings
  add column menu_theme text not null default 'restaurant'
  constraint business_theme_settings_menu_theme_check
    check (menu_theme in ('restaurant', 'cafe', 'minimal'));

comment on column public.business_theme_settings.menu_theme is
  'Public menu layout. restaurant, cafe, and minimal are different page structures.';

-- security definer so a signed-in visitor who is not a member can read the
-- published projection. The businesses table policy for authenticated users
-- is membership-only; widening it would expose owner_id. This function
-- returns only public columns and only active published rows.
create or replace function public.published_business(target_slug text)
returns table (
  id uuid,
  name text,
  slug text,
  description text,
  currency text,
  business_type text,
  logo_path text,
  cover_path text,
  phone text,
  address text,
  map_url text,
  opening_hours jsonb,
  social_links jsonb,
  default_language text,
  time_zone text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    businesses.id,
    businesses.name,
    businesses.slug,
    businesses.description,
    businesses.currency,
    businesses.business_type,
    businesses.logo_path,
    businesses.cover_path,
    businesses.phone,
    businesses.address,
    businesses.map_url,
    businesses.opening_hours,
    businesses.social_links,
    businesses.default_language,
    businesses.time_zone
  from public.businesses
  where businesses.slug = target_slug
    and target_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    and char_length(target_slug) <= 60
    and businesses.status = 'active'
    and businesses.is_published;
$$;

revoke all on function public.published_business(text) from public;
grant execute on function public.published_business(text) to anon, authenticated;

comment on function public.published_business(text) is
  'Published active business profile for the public menu. Omits owner_id and private settings.';
