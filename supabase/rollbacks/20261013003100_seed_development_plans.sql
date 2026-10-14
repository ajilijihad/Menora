-- Rollback for 20261013003100_seed_development_plans.sql.
-- Delete subscriptions that reference these plans before running this script.

delete from public.subscription_plans
where code in ('dev_starter', 'dev_growth');
