-- Rollback for 20261013050000_slug_redirects.sql.
-- Run this before the theme editor rollback.

drop trigger if exists tr_businesses_record_slug_change on public.businesses;
drop function if exists public.published_menu_slug(text);
drop function if exists public.record_slug_change();
drop table if exists public.business_slug_redirects;
