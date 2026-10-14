-- Replace A3 with A6 and A4 with A5, and allow A7.

alter table public.businesses
  drop constraint if exists businesses_poster_size_values;

update public.businesses
set poster_size = 'a6'
where poster_size = 'a3';

update public.businesses
set poster_size = 'a5'
where poster_size = 'a4';

alter table public.businesses
  alter column poster_size set default 'a5';

alter table public.businesses
  add constraint businesses_poster_size_values
    check (poster_size in ('a5', 'a6', 'a7', 'square', 'letter'));
