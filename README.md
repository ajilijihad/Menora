# Menor

Menor is a multi-tenant platform for digital menus. This repository is the Next.js application: authentication, businesses, menus, billing, email, administration, and public pages are separated into modules. Account, menu, and payment behavior is added in later phases.

## Requirements

- Node.js 20 or newer
- npm
- A [Supabase](https://supabase.com) project
- PayPal REST app credentials
- A [Resend](https://resend.com) API key

`@supabase/supabase-js` is pinned to 2.109.0 and `@supabase/ssr` to 0.12.0 because those releases support Node.js 20. Newer Supabase packages require Node.js 22.

## Installation

```bash
npm install
```

## Environment

Copy the template and fill in real values:

```bash
cp .env.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

| Variable | Where it is used |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser and server Supabase clients, and public logo and cover URLs |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser and server Supabase clients. In the Supabase dashboard this may be labeled publishable key or anon key. |
| `NEXT_PUBLIC_APP_URL` | Canonical application origin, for example `http://localhost:3000`. Production QR codes require an https origin that is not a local host |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only admin client. The dashboard may label this secret key or service_role. |
| `PAYPAL_CLIENT_ID` | Server-only PayPal REST app |
| `PAYPAL_CLIENT_SECRET` | Server-only PayPal REST app |
| `PAYPAL_ENVIRONMENT` | `sandbox` or `live`. Development uses Sandbox |
| `PAYPAL_LIVE_PAYMENTS` | Must be the exact string `true` before any live order is created. Leave it `false` until Sandbox tests pass and the PayPal account is approved |
| `PAYPAL_WEBHOOK_ID` | Server-only PayPal webhook id. The webhook route stays disabled until this is set |
| `RESEND_API_KEY` | Server-only Resend API key |
| `RESEND_FROM_EMAIL` | Server-only sender, for example `Menor <billing@your-domain.com>`. Menor does not call Resend while this is empty |
| `CRON_SECRET` | Server-only bearer secret, at least 16 characters, for the daily reminder job |

Next.js only inlines variables that start with `NEXT_PUBLIC_`. Service-role keys, PayPal secrets, and the Resend API key must never use that prefix. `.env.local` is gitignored. `.env.example` is the only environment file that belongs in git.

Public values are read in `src/lib/env/public.ts`. Server secrets are read in `src/lib/env/server.ts`, which imports `server-only`. Zod rejects missing values and the placeholders from the template. The service-role client, PayPal config, and Resend client are created only when server code asks for them.

## Local development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app redirects `/` to `/en` or `/ar` from the `menor-locale` cookie, then the `Accept-Language` header.

The public home page renders without credentials. Supabase session refresh starts after `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are set to real values. Calling the admin, billing, or email modules before their secrets are set throws `EnvConfigError` and does not send those values to the browser.

## Authentication

Account pages live under the locale prefix:

| Route | Access |
| --- | --- |
| `/en` and `/ar` | Public |
| `/[locale]/login`, `/register`, `/forgot-password`, `/verify-email` | Public. Signed-in visitors are sent to the dashboard |
| `/[locale]/reset-password` | Public page. The form is shown only after a verified recovery session |
| `/[locale]/dashboard` and `/[locale]/dashboard/profile` | Signed-in users |
| `/[locale]/admin` | Signed-in platform administrators |
| `/auth/confirm` | Supabase email callback. Not localized |
| `/menu/[slug]` | Public digital menu. No account and no ordering |

The signed-in user is always `supabase.auth.getUser()` on the server. Forms do not accept a user id. Registration sends `full_name` in user metadata so the database trigger can create `profiles`. It does not send `is_platform_admin` or app metadata. Profile edits update `full_name` only. Appoint administrators with the SQL in the dashboard section below.

Signup, login, password reset, confirmation, resend, and profile updates are rate limited in memory per IP address. That limiter applies to one server process and resets on restart. Use a shared store when you run more than one instance. Supabase Auth applies its own limits as well.

`npm run test` checks validation, redirect safety, rate limits, business slugs and media paths, and the rules that keep dashboard, admin, and public menu paths apart.

After sign-in, an account can create more than one business. The creator is stored as `owner_id` and the database adds the owner membership. Later requests load that membership with the signed-in user id. A business id from the browser is ignored unless that membership exists. Owners and managers can edit the profile. Only the owner can delete it, and deletion asks for the public slug. Editors can open the business and cannot change it. New businesses stay unpublished drafts. Menu products are edited from the menu screen. Subscription payments are started from the plan screen.

## Database

Migrations in `supabase/migrations` create the tenant schema, constraints, and row level security. `src/lib/supabase/database.types.ts` matches that schema. After linking a hosted project, regenerate it with:

```bash
npx supabase gen types typescript --linked > src/lib/supabase/database.types.ts
```

Apply the migrations with the Supabase CLI, from a role that can create triggers on `auth.users`:

```bash
npx supabase link --project-ref <project-ref>
npx supabase db push
```

The dashboard SQL editor can run the same files in filename order. Do not run them with the anon or publishable key.

`20261013003100_seed_development_plans.sql` inserts two development catalog rows (`dev_starter`, `dev_growth`). It does not insert customers, PayPal orders, or API credentials. Deactivate those rows before charging a live PayPal app.

Menu prices are integers in the business currency's minor unit. `price_cents` means that unit, not a floating-point amount: USD 10.50 is stored as 1050, and KWD 1.250 is stored as 1250. The menu screen chooses the currency from a fixed list. Owners and managers can change it. Editors can change categories, products, sizes, add-ons, and photos, and every write is checked against the signed-in membership and the row's `business_id`. Photos go to the public `menu-media` bucket, at most eight per product, after the browser reduces large files.

`20261013020000_menu_management.sql` adds bilingual names, compare-at prices, stock status, featured flags, dietary labels, and the product gallery. Apply it after the business profile migration.

`20261013030000_public_menu.sql` adds the public layout setting and a published-business lookup. The lookup returns the public profile only. It does not return `owner_id`. Apply it after the menu management migration.

`20261013040000_theme_editor.sql` adds the remaining appearance columns: text color, font choice, type scale, card layout, image ratio, radius, spacing, category navigation, and featured-product display. Existing rows keep their current colors, layout, and logo path. Each new column has a default, so the migration does not rewrite or delete menu data. Each value is a hex color, a small integer, or a fixed choice. The app turns those values into its own CSS variables. Apply it after the public menu migration. The theme editor does not add environment variables.

`20261013050000_slug_redirects.sql` remembers a previous public slug when a business changes it. The public page permanently redirects that old address to the current `/menu/business-slug`. The redirect table is not readable by visitors. Apply it after the theme editor migration. It does not rewrite existing menu content.

A published business is available at `/menu/business-slug`. The page is a digital menu: it has no cart, checkout, or delivery. English is left to right and Arabic is right to left. A visitor's language choice is kept in a cookie. When there is no choice, the page uses the business default language. Owners and managers open the theme editor from the menu screen and choose Modern Restaurant, Premium Cafe, or Minimal Food Menu, then colors, type, and layout. The public page uses the saved settings. The menu screen also creates a QR code for the same public address. The code does not include the theme, so changing the theme does not invalidate printed codes. Download PNG or SVG, or print a sheet with the business name and logo. In production the code is created only when `NEXT_PUBLIC_APP_URL` is an https origin that is not a local host. Missing, inactive, and unpublished businesses show the same not-available page.

`20261013060000_plan_entitlements.sql` adds Free, Starter, and Pro, with limits for businesses, products, layouts, analytics retention, and custom domains. A new business receives Free. Selecting a paid plan does not activate it. Apply it after the slug redirect migration.

`20261013070000_paypal_payments.sql` records manual monthly PayPal checkouts. A customer starts a new payment for each month. There is no automatic recurring subscription. The server creates a pending payment from the database price, creates a PayPal order, and captures it after approval. The plan is extended only after the captured status, amount, currency, order id, and capture id match that pending row. A repeated capture does not add a second month. An active plan with a future expiration is extended from that date. A refund of a completed capture shortens the month that capture granted. Card numbers are never collected or stored. Apply it after the plan entitlement migration.

PayPal calls stay in `src/modules/billing/paypal.ts`, so the provider can be replaced. A PayPal Personal account may not be eligible for the Orders API or webhooks used here. Do not work around an account restriction. Use a PayPal Business account that PayPal has approved for this integration, and keep `PAYPAL_ENVIRONMENT=sandbox` until Sandbox payments succeed. Live charges also require `PAYPAL_LIVE_PAYMENTS=true` while `NODE_ENV` is `production`. Webhook notifications are ignored unless PayPal verifies the signature.

`20261013080000_email_reminders.sql` stores email delivery attempts and one reminder claim per subscription period. Apply it after the PayPal migration. Welcome mail is sent by Menor through Resend after a new registration. Email verification and password recovery stay on the Supabase Auth email flow. To deliver those two through Resend, set the Supabase Auth SMTP host to `smtp.resend.com`, port 465, username `resend`, and the Resend API key as the password. Menor does not send a second copy of them.

A verified PayPal capture sends a payment receipt. A later capture for the same subscription sends a renewal confirmation. A failed capture sends a failure notice. The receipt page shows the capture id and states that the document is a payment receipt, not a tax invoice. These messages are essential account mail. Menor does not send marketing mail and does not attach an unsubscribe action to them.

The daily job is `GET` or `POST` `/api/email/reminders` with `Authorization: Bearer <CRON_SECRET>`. It stores timestamps in UTC, marks active subscriptions expired when `current_period_end` is in the past, and sends at most one 7-day, 3-day, 1-day, and expired message for each period. A failed send can be retried. A sent reminder is not sent again. On Vercel, `vercel.json` schedules that path at 06:00 UTC, and Vercel sends the bearer token when `CRON_SECRET` is set in the project environment. Any other host can call the same URL once a day with the same header. Administrators can preview every template at `/[locale]/admin/email` and send a test to their own address. Automated tests do not call Resend.

`20261013090000_platform_admin.sql` stores appointed administrators separately from profiles. The dashboard at `/[locale]/admin` shows businesses, users, plans, subscriptions, payments, email logs, domains, and basic view counts. Suspension, plan edits, and subscription adjustments run through database functions that require an appointment, a reason, and an audit row with the operator and the before/after values. Those functions do not insert a completed payment. Apply it after the email migration.

`20261013100000_analytics_seo_domains.sql` records public menu and product views with a device category and a referrer source. The stored visitor value is a daily hash used to collapse repeats. Addresses, user agents, and full referrer URLs are not stored. Members see aggregates inside the plan's retention window. A daily job, `GET` or `POST` `/api/analytics/retention` with the same bearer token as the email job, deletes older rows in batches of 2000. On Vercel it runs at 06:30 UTC.

Published menus have a canonical URL, Open Graph tags, and schema.org data built from the stored name, description, prices, and hours. Unpublished menus stay out of the sitemap and are not indexed. `robots.txt` hides the dashboard, admin, and account pages.

A business on an active plan that includes custom domains can submit one hostname. The row stays `pending` until a DNS TXT record at `_menor-verify.<hostname>` matches the token. That check sets `verified`. It does not set `active`. This repository's `vercel.json` only schedules cron jobs. There is no hosting API token, so Menor does not create the DNS alias or the certificate and the dashboard never shows that work as done. After the host accepts the domain, run this in the SQL editor:

```sql
select public.activate_custom_domain('<domain-uuid>');
```

The function rejects a domain that has not been verified. Routing then applies only when a request host matches an active, verified domain whose plan still allows it. `*.vercel.app` and the application host are not customer domains. A downgrade disables the row, and the owner can delete it. Another business cannot claim a hostname that is still assigned.

`20261013010000_business_profile.sql` adds the public profile: business type, logo and cover paths, phone, address, map link, opening hours, social links, default language, and time zone. It also creates the public `business-media` storage bucket. Uploads are limited to JPEG, PNG, and WebP, 2 MB in storage, and the app rejects files over 1.5 MB. Object names stay inside the business id folder (`{businessId}/logo-{uuid}.jpg`). Owners and managers can write those objects. Anonymous clients can read them. Apply this file after the foundation migration.

### Rollback

Supabase does not run down migrations automatically. Apply the scripts in `supabase/rollbacks` in this order when you need to remove the foundation:

1. `20261013100000_analytics_seo_domains.sql`
2. `20261013090000_platform_admin.sql`
3. `20261013080000_email_reminders.sql`
4. `20261013070000_paypal_payments.sql`
5. `20261013060000_plan_entitlements.sql`
6. `20261013050000_slug_redirects.sql`
7. `20261013040000_theme_editor.sql`
8. `20261013030000_public_menu.sql`
9. `20261013020000_menu_management.sql`
10. `20261013010000_business_profile.sql`
11. `20261013003100_seed_development_plans.sql` (delete subscriptions that reference the development plans first)
12. `20261013003000_foundation.sql`

Rollback drops tenant data.

### Access model

- `owner` manages the business, staff, menu, theme, and domains. A business has one owner.
- `manager` manages the menu, theme, business profile, and domains.
- `editor` manages menu categories, products, variants, and addons.
- Anonymous clients can read published, active menu content and active plan names. They cannot read profiles, memberships, payments, subscriptions, email logs, or analytics.
- Authenticated clients cannot insert or update subscriptions, payments, plans, or email logs. PayPal capture and refund stay on the server. Appointed administrators change plans, subscriptions, and suspension only through database functions that write an audit row. A profile flag does not grant that access, and those functions cannot mark a payment completed.
- Domain rows created by a client stay `pending`. A DNS TXT match can mark them `verified`. `active` is a separate database call after the host has accepted the domain, and it is refused before verification.

### Local database check

Docker is required. The check starts a temporary Postgres database, applies the migrations, verifies row level security as anonymous, member, and administrator roles, then applies the rollbacks:

```bash
npm run db:test
```

### Supabase dashboard

1. Run `npx supabase db push`, or paste the migration files into the SQL editor in order. The SQL editor uses a privileged role and can create the `auth.users` trigger.
2. In Authentication, enable the email provider and turn on **Confirm email**. Set the Site URL to `NEXT_PUBLIC_APP_URL`. Add these redirect URLs:
   - `http://localhost:3000/auth/confirm`
   - the same path on your deployed origin
   The default email template can keep `{{ .ConfirmationURL }}`. Signup and password reset set `emailRedirectTo` to `/auth/confirm`, which accepts either a PKCE `code` or a `token_hash` and `type`. Inserting `auth.users` creates the matching `profiles` row. Public registration cannot appoint an administrator.
3. Appoint a platform administrator from the SQL editor, not from a user session or a profile edit:

```sql
insert into public.platform_admins (user_id)
values ('<auth user uuid>')
on conflict (user_id) do nothing;
```

4. Leave row level security enabled. Do not add permissive policies in the dashboard.
5. Keep the service-role key in server environment variables only.
6. The business profile migration creates the `business-media` bucket. Keep it public for published images, and leave the storage policies in place so only owners and managers can upload into their business folder.

## Checks

```bash
npm run lint
npm run typecheck
npm run check
npm run test
npm run db:test
```

`npm run check` runs ESLint and `tsc --noEmit`. `npm run test` checks the auth rules without a live Supabase project. `npm run db:test` requires Docker.

## Project structure

```text
src/
  app/
    [locale]/          English and Arabic pages
    auth/confirm/      Email confirmation and recovery callback
    global-error.tsx   Root error boundary
    not-found.tsx      Fallback not-found state
  components/auth/     Account forms
  components/states/   Loading, error, empty, and not-found UI
  lib/auth/            Validation, redirects, and rate limits
  lib/env/             Public and server environment parsing
  lib/i18n/            Locales and dictionaries
  lib/supabase/        Browser, session, and service-role clients
  modules/
    auth/              Verified session user and account actions
    businesses/        Tenant-scoped business access
    menus/             Tenant-scoped menu access
    billing/           PayPal server configuration
    email/             Resend server client
    admin/             Service-role access
  proxy.ts             Locale redirect and Supabase session refresh
supabase/migrations/   SQL migrations
supabase/rollbacks/    Manual rollback scripts
supabase/tests/        Local RLS checks, not applied to hosted databases
```

`/[locale]` is `/en` or `/ar`. Public menu pages stay outside `/dashboard` and `/admin`, so they remain available without an account.

## Conventions

- Pages and layouts are Server Components. Add `"use client"` only when a component needs state, effects, or event handlers. `error.tsx` is a Client Component because Next.js error boundaries require it.
- Import browser Supabase from `@/lib/supabase/client`. Import the session client from `@/lib/supabase/server` or from the auth, businesses, or menus modules. Import the service-role client only from `@/modules/admin`.
- Read secrets with `getServerEnv()`. Do not pass service-role keys, PayPal secrets, or the Resend API key into Client Component props.
- Validate external input with Zod at the boundary that receives it.
- Return expected failures as values from Server Functions. Throw unexpected failures so the nearest `error.tsx` can render `ErrorState`.
- Use `LoadingState`, `EmptyState`, `ErrorState`, and `NotFoundState` instead of one-off status screens.
- Tenant queries use the session client and rely on row-level security. The admin client bypasses RLS and stays on the server.
- Storage uploads use the same Supabase clients. Buckets and policies are added with the schema.
