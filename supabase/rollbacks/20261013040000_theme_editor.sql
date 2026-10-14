-- Rollback for 20261013040000_theme_editor.sql.
-- Run this before the public menu rollback.

alter table public.business_theme_settings
  drop column if exists featured_style,
  drop column if exists nav_style,
  drop column if exists spacing_step,
  drop column if exists radius_px,
  drop column if exists image_ratio,
  drop column if exists card_layout,
  drop column if exists type_scale,
  drop column if exists font_choice,
  drop column if exists text_color;
