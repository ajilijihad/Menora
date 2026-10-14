-- Rollback for 20261013030000_public_menu.sql.
-- Run this before the menu management rollback.

drop function if exists public.published_business(text);

alter table public.business_theme_settings
  drop column if exists menu_theme;
