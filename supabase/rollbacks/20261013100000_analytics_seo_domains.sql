-- Removes analytics dimensions, domain verification, and platform host records.

drop function if exists public.maintain_public_analytics();
drop function if exists public.sync_business_domains(uuid);
drop function if exists public.active_menu_host(text);
drop function if exists public.activate_custom_domain(uuid);
drop function if exists public.confirm_custom_domain(uuid, text);
drop function if exists public.begin_domain_check(uuid);
drop function if exists public.submit_custom_domain(uuid, text);
drop function if exists public.register_platform_host(text);
drop function if exists public.business_analytics_summary(uuid, timestamptz, timestamptz);
drop function if exists public.record_public_analytics(text, text, uuid, text, text, text);

drop policy if exists analytics_events_select on public.analytics_events;
create policy analytics_events_select
  on public.analytics_events
  for select
  to authenticated
  using (
    public.is_business_member(business_id)
    or public.is_platform_admin()
  );

drop policy if exists custom_domains_select on public.custom_domains;
create policy custom_domains_select
  on public.custom_domains
  for select
  to anon, authenticated
  using (
    public.is_business_member(business_id)
    or public.is_platform_admin()
    or (status = 'active' and public.business_is_public(business_id))
  );

drop index if exists public.analytics_events_hour_dedupe_idx;
drop index if exists public.analytics_events_visitor_occurred_idx;
drop trigger if exists tr_analytics_events_hour_bucket on public.analytics_events;
drop function if exists public.set_analytics_hour_bucket();
drop index if exists public.custom_domains_one_open_idx;

alter table public.analytics_events
  drop constraint if exists analytics_events_category_fkey,
  drop constraint if exists analytics_events_referrer_values,
  drop constraint if exists analytics_events_device_values;

alter table public.analytics_events
  drop column if exists hour_bucket,
  drop column if exists menu_category_id,
  drop column if exists referrer_source,
  drop column if exists device_category;

update public.custom_domains
set status = 'pending'
where status = 'verified';

alter table public.custom_domains
  drop constraint if exists custom_domains_token_format,
  drop constraint if exists custom_domains_active_requires_verification,
  drop constraint if exists custom_domains_status_values;

alter table public.custom_domains
  add constraint custom_domains_status_values
    check (status in ('pending', 'active', 'disabled'));

alter table public.custom_domains
  drop column if exists last_checked_at,
  drop column if exists verified_at,
  drop column if exists verification_token;

drop table if exists public.platform_hosts;
