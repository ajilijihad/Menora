-- Allow the A3 poster size on databases that already saved the first poster migration.

alter table public.businesses
  drop constraint if exists businesses_poster_size_values;

alter table public.businesses
  add constraint businesses_poster_size_values
    check (poster_size in ('a5', 'a6', 'a7', 'square', 'letter'));
