-- Constrained public-menu appearance tokens.
-- Apply after 20261013030000_public_menu.sql.
-- Values are enums, integers, or #RRGGBB colors. Free-form CSS is not stored.

alter table public.business_theme_settings
  add column text_color text not null default '#1C1917'
    constraint business_theme_settings_text_color check (text_color ~ '^#[0-9A-Fa-f]{6}$'),
  add column font_choice text not null default 'sans'
    constraint business_theme_settings_font_choice check (font_choice in ('sans', 'serif', 'mono')),
  add column type_scale text not null default 'md'
    constraint business_theme_settings_type_scale check (type_scale in ('sm', 'md', 'lg')),
  add column card_layout text not null default 'stacked'
    constraint business_theme_settings_card_layout check (card_layout in ('stacked', 'horizontal', 'overlay')),
  add column image_ratio text not null default 'landscape'
    constraint business_theme_settings_image_ratio check (image_ratio in ('square', 'landscape', 'portrait')),
  add column radius_px smallint not null default 16
    constraint business_theme_settings_radius_px check (radius_px between 0 and 32),
  add column spacing_step text not null default 'comfortable'
    constraint business_theme_settings_spacing_step check (spacing_step in ('compact', 'comfortable', 'spacious')),
  add column nav_style text not null default 'pills'
    constraint business_theme_settings_nav_style check (nav_style in ('pills', 'underline', 'list')),
  add column featured_style text not null default 'row'
    constraint business_theme_settings_featured_style check (featured_style in ('row', 'grid', 'list'));

comment on column public.business_theme_settings.text_color is
  'Public menu text color. Hex only.';
comment on column public.business_theme_settings.font_choice is
  'Allowlisted font. The app maps it to a built-in font stack.';
