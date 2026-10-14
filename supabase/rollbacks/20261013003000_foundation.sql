-- Rollback for 20261013003000_foundation.sql.
-- Run supabase/rollbacks/20261013003100_seed_development_plans.sql first
-- when those plan rows exist. This drops tenant data.

drop trigger if exists on_auth_user_email_updated on auth.users;
drop trigger if exists on_auth_user_created on auth.users;

drop view if exists public.public_businesses;

drop table if exists public.analytics_events;
drop table if exists public.custom_domains;
drop table if exists public.email_logs;
drop table if exists public.payments;
drop table if exists public.subscriptions;
drop table if exists public.subscription_plans;
drop table if exists public.business_theme_settings;
drop table if exists public.product_addons;
drop table if exists public.product_variants;
drop table if exists public.menu_products;
drop table if exists public.menu_categories;
drop table if exists public.business_members;
drop table if exists public.businesses;
drop table if exists public.profiles;

drop function if exists public.sync_auth_user_email();
drop function if exists public.handle_new_auth_user();
drop function if exists public.product_is_public(uuid);
drop function if exists public.category_is_public(uuid);
drop function if exists public.business_is_public(uuid);
drop function if exists public.has_business_role(uuid, text[]);
drop function if exists public.is_business_member(uuid);
drop function if exists public.business_role(uuid);
drop function if exists public.is_platform_admin();
drop function if exists public.assert_analytics_product_business();
drop function if exists public.add_business_owner_membership();
drop function if exists public.protect_domain_status();
drop function if exists public.reject_client_billing_write();
drop function if exists public.lock_business_id();
drop function if exists public.lock_business_owner();
drop function if exists public.protect_profile_privileges();
drop function if exists public.set_updated_at();
