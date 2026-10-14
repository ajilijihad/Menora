-- Development catalog only. No customer records, payment captures, or API credentials.
-- Deactivate these rows before using a live PayPal app.

insert into public.subscription_plans (
  id,
  code,
  name,
  description,
  amount_cents,
  currency,
  billing_interval,
  is_active
)
values
  (
    '00000000-0000-4000-8000-000000000001',
    'dev_starter',
    'Starter (development)',
    'Development-only monthly plan. Not a production price.',
    0,
    'USD',
    'month',
    true
  ),
  (
    '00000000-0000-4000-8000-000000000002',
    'dev_growth',
    'Growth (development)',
    'Development-only monthly plan. Not a production price.',
    2900,
    'USD',
    'month',
    true
  )
on conflict (code) do nothing;
