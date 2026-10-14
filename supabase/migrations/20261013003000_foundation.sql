-- Menor foundation schema.
-- Apply on Supabase with a role that can create triggers on auth.users
-- (CLI db push or the dashboard SQL editor). Do not run this as anon.
--
-- Billing rows and email logs are not writable by anon or authenticated.
-- service_role bypasses row level security and is the only client role
-- that may change billing status.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  if tg_op = 'UPDATE' then
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$;

create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated') then
    new.id := old.id;
    new.email := old.email;
    new.is_platform_admin := old.is_platform_admin;
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$;

create or replace function public.lock_business_owner()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated') then
    new.owner_id := old.owner_id;
  end if;
  return new;
end;
$$;

create or replace function public.lock_business_id()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE'
    and current_user in ('anon', 'authenticated')
    and new.business_id is distinct from old.business_id
  then
    raise exception 'business_id cannot be changed'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create or replace function public.reject_client_billing_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated') then
    raise exception 'This table can only be changed by trusted server-side operations'
      using errcode = '42501';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create or replace function public.protect_domain_status()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated') then
    if tg_op = 'INSERT' then
      new.status := 'pending';
    elsif new.status is distinct from old.status then
      raise exception 'Domain status can only be changed by trusted server-side operations'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text not null default '',
  is_platform_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_full_name_length check (char_length(full_name) <= 120),
  constraint profiles_email_length check (email is null or char_length(email) <= 320)
);

create trigger tr_profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger tr_profiles_protect_privileges
  before update on public.profiles
  for each row execute function public.protect_profile_privileges();

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete restrict,
  name text not null,
  slug text not null,
  description text,
  currency text not null default 'USD',
  status text not null default 'draft',
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint businesses_name_length check (char_length(btrim(name)) between 1 and 120),
  constraint businesses_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint businesses_description_length check (
    description is null or char_length(description) <= 2000
  ),
  constraint businesses_currency_format check (currency ~ '^[A-Z]{3}$'),
  constraint businesses_status_values check (status in ('draft', 'active', 'archived')),
  constraint businesses_published_requires_active check (
    not is_published or status = 'active'
  )
);

create unique index businesses_slug_key on public.businesses (slug);
create index businesses_owner_id_idx on public.businesses (owner_id);
create index businesses_public_idx
  on public.businesses (slug)
  where status = 'active' and is_published;

create trigger tr_businesses_set_updated_at
  before update on public.businesses
  for each row execute function public.set_updated_at();

create trigger tr_businesses_lock_owner
  before update on public.businesses
  for each row execute function public.lock_business_owner();

create table public.business_members (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_members_role_values check (role in ('owner', 'manager', 'editor')),
  constraint business_members_business_user_key unique (business_id, user_id)
);

create unique index business_members_one_owner_idx
  on public.business_members (business_id)
  where role = 'owner';

create index business_members_user_id_idx on public.business_members (user_id);

create trigger tr_business_members_set_updated_at
  before update on public.business_members
  for each row execute function public.set_updated_at();

create trigger tr_business_members_lock_business_id
  before update on public.business_members
  for each row execute function public.lock_business_id();

create or replace function public.add_business_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.business_members (business_id, user_id, role)
  values (new.id, new.owner_id, 'owner');
  return new;
end;
$$;

create trigger tr_businesses_add_owner
  after insert on public.businesses
  for each row execute function public.add_business_owner_membership();

create table public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint menu_categories_name_length check (char_length(btrim(name)) between 1 and 120),
  constraint menu_categories_description_length check (
    description is null or char_length(description) <= 2000
  ),
  constraint menu_categories_sort_order_nonnegative check (sort_order >= 0),
  constraint menu_categories_business_name_key unique (business_id, name),
  constraint menu_categories_id_business_key unique (id, business_id)
);

create index menu_categories_business_id_idx
  on public.menu_categories (business_id, sort_order);

create trigger tr_menu_categories_set_updated_at
  before update on public.menu_categories
  for each row execute function public.set_updated_at();

create trigger tr_menu_categories_lock_business_id
  before update on public.menu_categories
  for each row execute function public.lock_business_id();

create table public.menu_products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  category_id uuid not null,
  name text not null,
  description text,
  price_cents integer not null,
  image_path text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint menu_products_category_business_fkey
    foreign key (category_id, business_id)
    references public.menu_categories (id, business_id)
    on delete cascade,
  constraint menu_products_name_length check (char_length(btrim(name)) between 1 and 160),
  constraint menu_products_description_length check (
    description is null or char_length(description) <= 4000
  ),
  constraint menu_products_price_nonnegative check (price_cents >= 0),
  constraint menu_products_sort_order_nonnegative check (sort_order >= 0),
  constraint menu_products_image_path_safe check (
    image_path is null
    or (
      char_length(image_path) between 1 and 512
      and image_path !~ '\.\.'
    )
  ),
  constraint menu_products_category_name_key unique (category_id, name),
  constraint menu_products_id_business_key unique (id, business_id)
);

create index menu_products_business_id_idx on public.menu_products (business_id);
create index menu_products_category_id_idx on public.menu_products (category_id, sort_order);

create trigger tr_menu_products_set_updated_at
  before update on public.menu_products
  for each row execute function public.set_updated_at();

create trigger tr_menu_products_lock_business_id
  before update on public.menu_products
  for each row execute function public.lock_business_id();

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  product_id uuid not null,
  name text not null,
  price_cents integer not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_variants_product_business_fkey
    foreign key (product_id, business_id)
    references public.menu_products (id, business_id)
    on delete cascade,
  constraint product_variants_name_length check (char_length(btrim(name)) between 1 and 120),
  constraint product_variants_price_nonnegative check (price_cents >= 0),
  constraint product_variants_sort_order_nonnegative check (sort_order >= 0),
  constraint product_variants_product_name_key unique (product_id, name)
);

create index product_variants_product_id_idx
  on public.product_variants (product_id, sort_order);

create trigger tr_product_variants_set_updated_at
  before update on public.product_variants
  for each row execute function public.set_updated_at();

create trigger tr_product_variants_lock_business_id
  before update on public.product_variants
  for each row execute function public.lock_business_id();

create table public.product_addons (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  product_id uuid not null,
  name text not null,
  price_cents integer not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_addons_product_business_fkey
    foreign key (product_id, business_id)
    references public.menu_products (id, business_id)
    on delete cascade,
  constraint product_addons_name_length check (char_length(btrim(name)) between 1 and 120),
  constraint product_addons_price_nonnegative check (price_cents >= 0),
  constraint product_addons_sort_order_nonnegative check (sort_order >= 0),
  constraint product_addons_product_name_key unique (product_id, name)
);

create index product_addons_product_id_idx
  on public.product_addons (product_id, sort_order);

create trigger tr_product_addons_set_updated_at
  before update on public.product_addons
  for each row execute function public.set_updated_at();

create trigger tr_product_addons_lock_business_id
  before update on public.product_addons
  for each row execute function public.lock_business_id();

create table public.business_theme_settings (
  business_id uuid primary key references public.businesses (id) on delete cascade,
  primary_color text not null default '#111111',
  accent_color text not null default '#C2410C',
  background_color text not null default '#FFFFFF',
  font_family text not null default 'sans',
  logo_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_theme_settings_primary_color check (primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  constraint business_theme_settings_accent_color check (accent_color ~ '^#[0-9A-Fa-f]{6}$'),
  constraint business_theme_settings_background_color check (background_color ~ '^#[0-9A-Fa-f]{6}$'),
  constraint business_theme_settings_font_length check (char_length(font_family) between 1 and 80),
  constraint business_theme_settings_logo_path_safe check (
    logo_path is null
    or (
      char_length(logo_path) between 1 and 512
      and logo_path !~ '\.\.'
    )
  )
);

create trigger tr_business_theme_settings_set_updated_at
  before update on public.business_theme_settings
  for each row execute function public.set_updated_at();

create trigger tr_business_theme_settings_lock_business_id
  before update on public.business_theme_settings
  for each row execute function public.lock_business_id();

create table public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  description text,
  amount_cents integer not null,
  currency text not null,
  billing_interval text not null default 'month',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscription_plans_code_key unique (code),
  constraint subscription_plans_code_format check (code ~ '^[a-z0-9_]+$'),
  constraint subscription_plans_name_length check (char_length(btrim(name)) between 1 and 120),
  constraint subscription_plans_amount_nonnegative check (amount_cents >= 0),
  constraint subscription_plans_currency_format check (currency ~ '^[A-Z]{3}$'),
  constraint subscription_plans_interval_month check (billing_interval = 'month')
);

create trigger tr_subscription_plans_set_updated_at
  before update on public.subscription_plans
  for each row execute function public.set_updated_at();

create trigger tr_subscription_plans_reject_client_write
  before insert or update or delete on public.subscription_plans
  for each row execute function public.reject_client_billing_write();

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete restrict,
  plan_id uuid not null references public.subscription_plans (id) on delete restrict,
  status text not null,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscriptions_status_values check (
    status in ('pending', 'active', 'past_due', 'canceled', 'expired')
  ),
  constraint subscriptions_period_order check (
    current_period_end is null
    or current_period_start is null
    or current_period_end >= current_period_start
  )
);

create unique index subscriptions_one_open_idx
  on public.subscriptions (business_id)
  where status in ('pending', 'active', 'past_due');

create index subscriptions_business_id_idx on public.subscriptions (business_id);
create index subscriptions_plan_id_idx on public.subscriptions (plan_id);

create trigger tr_subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

create trigger tr_subscriptions_lock_business_id
  before update on public.subscriptions
  for each row execute function public.lock_business_id();

create trigger tr_subscriptions_reject_client_write
  before insert or update or delete on public.subscriptions
  for each row execute function public.reject_client_billing_write();

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete restrict,
  subscription_id uuid not null references public.subscriptions (id) on delete restrict,
  amount_cents integer not null,
  currency text not null,
  status text not null,
  provider text not null default 'paypal',
  provider_order_id text,
  provider_capture_id text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payments_amount_nonnegative check (amount_cents >= 0),
  constraint payments_currency_format check (currency ~ '^[A-Z]{3}$'),
  constraint payments_status_values check (
    status in ('pending', 'completed', 'failed', 'refunded')
  ),
  constraint payments_provider_paypal check (provider = 'paypal'),
  constraint payments_completed_requires_paid_at check (
    status <> 'completed' or paid_at is not null
  ),
  constraint payments_provider_order_key unique (provider, provider_order_id)
);

create index payments_business_id_idx on public.payments (business_id);
create index payments_subscription_id_idx on public.payments (subscription_id);

create trigger tr_payments_set_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

create trigger tr_payments_lock_business_id
  before update on public.payments
  for each row execute function public.lock_business_id();

create trigger tr_payments_reject_client_write
  before insert or update or delete on public.payments
  for each row execute function public.reject_client_billing_write();

create table public.email_logs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses (id) on delete set null,
  to_email text not null,
  template text not null,
  status text not null,
  provider_message_id text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint email_logs_to_email_format check (
    to_email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  ),
  constraint email_logs_template_length check (char_length(template) between 1 and 80),
  constraint email_logs_status_values check (status in ('queued', 'sent', 'failed')),
  constraint email_logs_error_length check (
    error_message is null or char_length(error_message) <= 2000
  )
);

create index email_logs_business_id_idx on public.email_logs (business_id);
create index email_logs_created_at_idx on public.email_logs (created_at desc);

create trigger tr_email_logs_set_updated_at
  before update on public.email_logs
  for each row execute function public.set_updated_at();

create trigger tr_email_logs_lock_business_id
  before update on public.email_logs
  for each row execute function public.lock_business_id();

create trigger tr_email_logs_reject_client_write
  before insert or update or delete on public.email_logs
  for each row execute function public.reject_client_billing_write();

create table public.custom_domains (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  hostname text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint custom_domains_hostname_key unique (hostname),
  constraint custom_domains_hostname_lowercase check (hostname = lower(hostname)),
  constraint custom_domains_hostname_format check (
    hostname ~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$'
  ),
  constraint custom_domains_status_values check (status in ('pending', 'active', 'disabled'))
);

create index custom_domains_business_id_idx on public.custom_domains (business_id);

create trigger tr_custom_domains_set_updated_at
  before update on public.custom_domains
  for each row execute function public.set_updated_at();

create trigger tr_custom_domains_lock_business_id
  before update on public.custom_domains
  for each row execute function public.lock_business_id();

create trigger tr_custom_domains_protect_status
  before insert or update on public.custom_domains
  for each row execute function public.protect_domain_status();

create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  menu_product_id uuid,
  event_name text not null,
  occurred_at timestamptz not null default now(),
  visitor_hash text,
  created_at timestamptz not null default now(),
  constraint analytics_events_product_fkey
    foreign key (menu_product_id)
    references public.menu_products (id)
    on delete set null,
  constraint analytics_events_name_values check (event_name in ('menu_view', 'product_view')),
  constraint analytics_events_visitor_hash_length check (
    visitor_hash is null or char_length(visitor_hash) between 16 and 128
  )
);

create index analytics_events_business_occurred_idx
  on public.analytics_events (business_id, occurred_at desc);

create or replace function public.assert_analytics_product_business()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.menu_product_id is not null
    and not exists (
      select 1
      from public.menu_products
      where menu_products.id = new.menu_product_id
        and menu_products.business_id = new.business_id
    )
  then
    raise exception 'analytics product must belong to the same business'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger tr_analytics_events_product_business
  before insert or update on public.analytics_events
  for each row execute function public.assert_analytics_product_business();

create trigger tr_analytics_events_lock_business_id
  before update on public.analytics_events
  for each row execute function public.lock_business_id();

-- Access helpers. security definer avoids recursive policy checks.
-- They return booleans or the caller's own role, not other tenants' rows.

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select profiles.is_platform_admin
      from public.profiles
      where profiles.id = auth.uid()
    ),
    false
  );
$$;

create or replace function public.business_role(target_business_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select business_members.role
  from public.business_members
  where business_members.business_id = target_business_id
    and business_members.user_id = auth.uid()
  limit 1;
$$;

create or replace function public.is_business_member(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.business_role(target_business_id) is not null;
$$;

create or replace function public.has_business_role(
  target_business_id uuid,
  allowed_roles text[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.business_role(target_business_id) = any (allowed_roles);
$$;

create or replace function public.business_is_public(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.businesses
    where businesses.id = target_business_id
      and businesses.status = 'active'
      and businesses.is_published
  );
$$;

create or replace function public.category_is_public(target_category_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.menu_categories
    where menu_categories.id = target_category_id
      and menu_categories.is_active
      and menu_categories.is_published
      and public.business_is_public(menu_categories.business_id)
  );
$$;

create or replace function public.product_is_public(target_product_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.menu_products
    where menu_products.id = target_product_id
      and menu_products.is_active
      and menu_products.is_published
      and public.category_is_public(menu_products.category_id)
  );
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );
  return new;
end;
$$;

create or replace function public.sync_auth_user_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set email = new.email,
      updated_at = now()
  where profiles.id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row execute function public.sync_auth_user_email();

create view public.public_businesses
with (security_barrier = true, security_invoker = true) as
select
  id,
  name,
  slug,
  description,
  currency
from public.businesses
where status = 'active'
  and is_published;

comment on view public.public_businesses is
  'Published active businesses without owner identifiers.';

alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.business_members enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_addons enable row level security;
alter table public.business_theme_settings enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;
alter table public.email_logs enable row level security;
alter table public.custom_domains enable row level security;
alter table public.analytics_events enable row level security;

alter table public.profiles force row level security;
alter table public.businesses force row level security;
alter table public.business_members force row level security;
alter table public.menu_categories force row level security;
alter table public.menu_products force row level security;
alter table public.product_variants force row level security;
alter table public.product_addons force row level security;
alter table public.business_theme_settings force row level security;
alter table public.subscription_plans force row level security;
alter table public.subscriptions force row level security;
alter table public.payments force row level security;
alter table public.email_logs force row level security;
alter table public.custom_domains force row level security;
alter table public.analytics_events force row level security;

create policy profiles_select
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid() or public.is_platform_admin());

create policy profiles_update
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy businesses_select_public
  on public.businesses
  for select
  to anon
  using (status = 'active' and is_published);

create policy businesses_select_private
  on public.businesses
  for select
  to authenticated
  using (public.is_business_member(id) or public.is_platform_admin());

create policy businesses_insert
  on public.businesses
  for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy businesses_update
  on public.businesses
  for update
  to authenticated
  using (public.has_business_role(id, array['owner', 'manager']))
  with check (public.has_business_role(id, array['owner', 'manager']));

create policy businesses_delete
  on public.businesses
  for delete
  to authenticated
  using (public.has_business_role(id, array['owner']));

create policy business_members_select
  on public.business_members
  for select
  to authenticated
  using (
    public.is_business_member(business_id)
    or public.is_platform_admin()
  );

create policy business_members_insert
  on public.business_members
  for insert
  to authenticated
  with check (
    public.has_business_role(business_id, array['owner'])
    and role in ('manager', 'editor')
  );

create policy business_members_update
  on public.business_members
  for update
  to authenticated
  using (
    public.has_business_role(business_id, array['owner'])
    and role <> 'owner'
  )
  with check (
    public.has_business_role(business_id, array['owner'])
    and role in ('manager', 'editor')
  );

create policy business_members_delete
  on public.business_members
  for delete
  to authenticated
  using (
    public.has_business_role(business_id, array['owner'])
    and role <> 'owner'
  );

create policy menu_categories_select
  on public.menu_categories
  for select
  to anon, authenticated
  using (
    public.is_business_member(business_id)
    or public.is_platform_admin()
    or (
      is_active
      and is_published
      and public.business_is_public(business_id)
    )
  );

create policy menu_categories_write
  on public.menu_categories
  for all
  to authenticated
  using (public.has_business_role(business_id, array['owner', 'manager', 'editor']))
  with check (public.has_business_role(business_id, array['owner', 'manager', 'editor']));

create policy menu_products_select
  on public.menu_products
  for select
  to anon, authenticated
  using (
    public.is_business_member(business_id)
    or public.is_platform_admin()
    or (
      is_active
      and is_published
      and public.category_is_public(category_id)
    )
  );

create policy menu_products_write
  on public.menu_products
  for all
  to authenticated
  using (public.has_business_role(business_id, array['owner', 'manager', 'editor']))
  with check (public.has_business_role(business_id, array['owner', 'manager', 'editor']));

create policy product_variants_select
  on public.product_variants
  for select
  to anon, authenticated
  using (
    public.is_business_member(business_id)
    or public.is_platform_admin()
    or (is_active and public.product_is_public(product_id))
  );

create policy product_variants_write
  on public.product_variants
  for all
  to authenticated
  using (public.has_business_role(business_id, array['owner', 'manager', 'editor']))
  with check (public.has_business_role(business_id, array['owner', 'manager', 'editor']));

create policy product_addons_select
  on public.product_addons
  for select
  to anon, authenticated
  using (
    public.is_business_member(business_id)
    or public.is_platform_admin()
    or (is_active and public.product_is_public(product_id))
  );

create policy product_addons_write
  on public.product_addons
  for all
  to authenticated
  using (public.has_business_role(business_id, array['owner', 'manager', 'editor']))
  with check (public.has_business_role(business_id, array['owner', 'manager', 'editor']));

create policy business_theme_settings_select
  on public.business_theme_settings
  for select
  to anon, authenticated
  using (
    public.is_business_member(business_id)
    or public.is_platform_admin()
    or public.business_is_public(business_id)
  );

create policy business_theme_settings_write
  on public.business_theme_settings
  for all
  to authenticated
  using (public.has_business_role(business_id, array['owner', 'manager']))
  with check (public.has_business_role(business_id, array['owner', 'manager']));

create policy subscription_plans_select
  on public.subscription_plans
  for select
  to anon, authenticated
  using (is_active or public.is_platform_admin());

create policy subscriptions_select
  on public.subscriptions
  for select
  to authenticated
  using (
    public.has_business_role(business_id, array['owner', 'manager'])
    or public.is_platform_admin()
  );

create policy payments_select
  on public.payments
  for select
  to authenticated
  using (
    public.has_business_role(business_id, array['owner', 'manager'])
    or public.is_platform_admin()
  );

create policy email_logs_select
  on public.email_logs
  for select
  to authenticated
  using (public.is_platform_admin());

create policy custom_domains_select
  on public.custom_domains
  for select
  to anon, authenticated
  using (
    public.is_business_member(business_id)
    or public.is_platform_admin()
    or (status = 'active' and public.business_is_public(business_id))
  );

create policy custom_domains_insert
  on public.custom_domains
  for insert
  to authenticated
  with check (
    public.has_business_role(business_id, array['owner', 'manager'])
    and status = 'pending'
  );

create policy custom_domains_update
  on public.custom_domains
  for update
  to authenticated
  using (public.has_business_role(business_id, array['owner', 'manager']))
  with check (
    public.has_business_role(business_id, array['owner', 'manager'])
    and status = 'pending'
  );

create policy custom_domains_delete
  on public.custom_domains
  for delete
  to authenticated
  using (public.has_business_role(business_id, array['owner', 'manager']));

create policy analytics_events_select
  on public.analytics_events
  for select
  to authenticated
  using (
    public.is_business_member(business_id)
    or public.is_platform_admin()
  );

grant usage on schema public to anon, authenticated, service_role;

revoke all on table public.profiles from public, anon, authenticated;
revoke all on table public.businesses from public, anon, authenticated;
revoke all on table public.business_members from public, anon, authenticated;
revoke all on table public.menu_categories from public, anon, authenticated;
revoke all on table public.menu_products from public, anon, authenticated;
revoke all on table public.product_variants from public, anon, authenticated;
revoke all on table public.product_addons from public, anon, authenticated;
revoke all on table public.business_theme_settings from public, anon, authenticated;
revoke all on table public.subscription_plans from public, anon, authenticated;
revoke all on table public.subscriptions from public, anon, authenticated;
revoke all on table public.payments from public, anon, authenticated;
revoke all on table public.email_logs from public, anon, authenticated;
revoke all on table public.custom_domains from public, anon, authenticated;
revoke all on table public.analytics_events from public, anon, authenticated;
revoke all on table public.public_businesses from public, anon, authenticated;

grant select (
  id,
  name,
  slug,
  description,
  currency,
  status,
  is_published
) on table public.businesses to anon;

grant select on table public.menu_categories to anon;
grant select on table public.menu_products to anon;
grant select on table public.product_variants to anon;
grant select on table public.product_addons to anon;
grant select on table public.business_theme_settings to anon;
grant select on table public.subscription_plans to anon;
grant select on table public.custom_domains to anon;
grant select on table public.public_businesses to anon, authenticated;

grant select, update on table public.profiles to authenticated;
grant select, insert, update, delete on table public.businesses to authenticated;
grant select, insert, update, delete on table public.business_members to authenticated;
grant select, insert, update, delete on table public.menu_categories to authenticated;
grant select, insert, update, delete on table public.menu_products to authenticated;
grant select, insert, update, delete on table public.product_variants to authenticated;
grant select, insert, update, delete on table public.product_addons to authenticated;
grant select, insert, update, delete on table public.business_theme_settings to authenticated;
grant select on table public.subscription_plans to authenticated;
grant select on table public.subscriptions to authenticated;
grant select on table public.payments to authenticated;
grant select on table public.email_logs to authenticated;
grant select, insert, update, delete on table public.custom_domains to authenticated;
grant select on table public.analytics_events to authenticated;

grant all on table public.profiles to service_role;
grant all on table public.businesses to service_role;
grant all on table public.business_members to service_role;
grant all on table public.menu_categories to service_role;
grant all on table public.menu_products to service_role;
grant all on table public.product_variants to service_role;
grant all on table public.product_addons to service_role;
grant all on table public.business_theme_settings to service_role;
grant all on table public.subscription_plans to service_role;
grant all on table public.subscriptions to service_role;
grant all on table public.payments to service_role;
grant all on table public.email_logs to service_role;
grant all on table public.custom_domains to service_role;
grant all on table public.analytics_events to service_role;
grant select on table public.public_businesses to service_role;

revoke all on function public.is_platform_admin() from public;
revoke all on function public.business_role(uuid) from public;
revoke all on function public.is_business_member(uuid) from public;
revoke all on function public.has_business_role(uuid, text[]) from public;
revoke all on function public.business_is_public(uuid) from public;
revoke all on function public.category_is_public(uuid) from public;
revoke all on function public.product_is_public(uuid) from public;

grant execute on function public.is_platform_admin() to anon, authenticated, service_role;
grant execute on function public.business_role(uuid) to authenticated, service_role;
grant execute on function public.is_business_member(uuid) to anon, authenticated, service_role;
grant execute on function public.has_business_role(uuid, text[]) to authenticated, service_role;
grant execute on function public.business_is_public(uuid) to anon, authenticated, service_role;
grant execute on function public.category_is_public(uuid) to anon, authenticated, service_role;
grant execute on function public.product_is_public(uuid) to anon, authenticated, service_role;

comment on table public.payments is
  'PayPal payment records. No card data, payer email, or API secrets. Clients cannot change status.';
comment on table public.email_logs is
  'Internal delivery log. Readable by platform administrators only.';
comment on table public.business_members is
  'Tenant roles: owner, manager, and editor. Exactly one owner per business.';
