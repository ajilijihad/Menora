do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'profiles'
  ) then
    raise exception 'FAILED rollback: public.profiles still exists';
  end if;

  if exists (
    select 1
    from pg_trigger
    where tgname = 'on_auth_user_created'
  ) then
    raise exception 'FAILED rollback: auth user trigger still exists';
  end if;

  raise notice 'ok rollback removed the foundation schema';
end
$$;
