-- Remember previous public menu slugs so an old QR code still opens the menu.
-- Apply after 20261013040000_theme_editor.sql.

create table public.business_slug_redirects (
  slug text primary key,
  business_id uuid not null references public.businesses (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint business_slug_redirects_slug_check check (
    slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    and char_length(slug) between 1 and 60
  )
);

create index business_slug_redirects_business_id_idx
  on public.business_slug_redirects (business_id);

comment on table public.business_slug_redirects is
  'Previous public menu slugs. The public lookup returns the current slug for an active published business.';

create function public.record_slug_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and old.slug is distinct from new.slug then
    delete from public.business_slug_redirects
    where slug = new.slug;

    if exists (
      select 1
      from public.business_slug_redirects
      where slug = old.slug
        and business_id <> new.id
    ) then
      raise exception 'slug redirect belongs to another business'
        using errcode = '23505';
    end if;

    insert into public.business_slug_redirects (slug, business_id)
    values (old.slug, new.id)
    on conflict (slug) do update
      set business_id = excluded.business_id;
  end if;

  return new;
end;
$$;

create trigger tr_businesses_record_slug_change
  after update of slug on public.businesses
  for each row
  execute function public.record_slug_change();

create function public.published_menu_slug(target_slug text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select matches.slug
  from (
    select businesses.slug, 0 as rank
    from public.businesses
    where businesses.slug = target_slug
      and target_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
      and char_length(target_slug) <= 60
      and businesses.status = 'active'
      and businesses.is_published
    union all
    select businesses.slug, 1 as rank
    from public.business_slug_redirects
    join public.businesses on businesses.id = business_slug_redirects.business_id
    where business_slug_redirects.slug = target_slug
      and target_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
      and char_length(target_slug) <= 60
      and businesses.status = 'active'
      and businesses.is_published
  ) as matches
  order by matches.rank
  limit 1;
$$;

revoke all on function public.record_slug_change() from public;
revoke all on function public.published_menu_slug(text) from public;
grant execute on function public.published_menu_slug(text) to anon, authenticated;

alter table public.business_slug_redirects enable row level security;
alter table public.business_slug_redirects force row level security;
revoke all on table public.business_slug_redirects from public, anon, authenticated;

comment on function public.published_menu_slug(text) is
  'Current public slug for an active published menu, including a previous slug. Returns null when the menu is missing or unpublished.';
