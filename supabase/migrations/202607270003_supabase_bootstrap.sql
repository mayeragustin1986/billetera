begin;

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null default '#34d399',
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  amount numeric(14, 2) not null,
  description text not null,
  category text not null default 'Otros',
  occurred_at date not null default current_date,
  due_date date,
  status text not null default 'paid',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists full_name text not null default '',
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table public.categories
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists name text,
  add column if not exists color text not null default '#34d399',
  add column if not exists created_at timestamptz not null default now();

alter table public.transactions
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists type text,
  add column if not exists amount numeric(14, 2),
  add column if not exists description text,
  add column if not exists category text not null default 'Otros',
  add column if not exists occurred_at date not null default current_date,
  add column if not exists due_date date,
  add column if not exists status text not null default 'paid',
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table public.transactions drop constraint if exists transactions_type_check;
alter table public.transactions
  add constraint transactions_type_check check (type in ('income', 'expense'));

alter table public.transactions drop constraint if exists transactions_amount_check;
alter table public.transactions
  add constraint transactions_amount_check check (amount > 0);

alter table public.transactions drop constraint if exists transactions_description_check;
alter table public.transactions
  add constraint transactions_description_check
  check (char_length(trim(description)) between 1 and 120);

alter table public.transactions drop constraint if exists transactions_status_check;
alter table public.transactions
  add constraint transactions_status_check check (status in ('paid', 'pending'));

alter table public.categories drop constraint if exists categories_name_check;
alter table public.categories
  add constraint categories_name_check check (char_length(trim(name)) between 2 and 40);

alter table public.categories drop constraint if exists categories_color_check;
alter table public.categories
  add constraint categories_color_check check (color ~ '^#[0-9a-fA-F]{6}$');

create unique index if not exists categories_user_name_uidx
  on public.categories (user_id, lower(name));
create index if not exists categories_user_idx
  on public.categories (user_id);
create index if not exists transactions_user_date_idx
  on public.transactions (user_id, occurred_at desc, created_at desc);
create index if not exists transactions_user_due_idx
  on public.transactions (user_id, due_date)
  where status = 'pending';

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;

alter table public.profiles force row level security;
alter table public.categories force row level security;
alter table public.transactions force row level security;

drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);
create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "Users can view own categories" on public.categories;
drop policy if exists "Users can create own categories" on public.categories;
drop policy if exists "Users can update own categories" on public.categories;
drop policy if exists "Users can delete own categories" on public.categories;
drop policy if exists "categories_select_own" on public.categories;
drop policy if exists "categories_insert_own" on public.categories;
drop policy if exists "categories_update_own" on public.categories;
drop policy if exists "categories_delete_own" on public.categories;
create policy "categories_select_own"
  on public.categories for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "categories_insert_own"
  on public.categories for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "categories_update_own"
  on public.categories for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "categories_delete_own"
  on public.categories for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can view own transactions" on public.transactions;
drop policy if exists "Users can create own transactions" on public.transactions;
drop policy if exists "Users can update own transactions" on public.transactions;
drop policy if exists "Users can delete own transactions" on public.transactions;
drop policy if exists "transactions_select_own" on public.transactions;
drop policy if exists "transactions_insert_own" on public.transactions;
drop policy if exists "transactions_update_own" on public.transactions;
drop policy if exists "transactions_delete_own" on public.transactions;
create policy "transactions_select_own"
  on public.transactions for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "transactions_insert_own"
  on public.transactions for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "transactions_update_own"
  on public.transactions for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "transactions_delete_own"
  on public.transactions for delete to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists transactions_set_updated_at on public.transactions;
create trigger transactions_set_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do update
    set full_name = excluded.full_name;

  insert into public.categories (user_id, name, color)
  values
    (new.id, 'Alimentos', '#fb923c'),
    (new.id, 'Transporte', '#38bdf8'),
    (new.id, 'Vivienda', '#a78bfa'),
    (new.id, 'Servicios', '#fbbf24'),
    (new.id, 'Salud', '#fb7185'),
    (new.id, 'Ocio', '#2dd4bf'),
    (new.id, 'Sueldo', '#34d399'),
    (new.id, 'Inversiones', '#94a3b8'),
    (new.id, 'Otros', '#64748b')
  on conflict (user_id, (lower(name))) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

insert into public.profiles (id, full_name)
select id, coalesce(raw_user_meta_data ->> 'full_name', '')
from auth.users
on conflict (id) do nothing;

insert into public.categories (user_id, name, color)
select users.id, defaults.name, defaults.color
from auth.users as users
cross join (
  values
    ('Alimentos', '#fb923c'),
    ('Transporte', '#38bdf8'),
    ('Vivienda', '#a78bfa'),
    ('Servicios', '#fbbf24'),
    ('Salud', '#fb7185'),
    ('Ocio', '#2dd4bf'),
    ('Sueldo', '#34d399'),
    ('Inversiones', '#94a3b8'),
    ('Otros', '#64748b')
) as defaults(name, color)
on conflict (user_id, (lower(name))) do nothing;

revoke all on table public.profiles from anon;
revoke all on table public.categories from anon;
revoke all on table public.transactions from anon;

grant usage on schema public to authenticated;
grant select, update on table public.profiles to authenticated;
grant select, insert, update, delete on table public.categories to authenticated;
grant select, insert, update, delete on table public.transactions to authenticated;

notify pgrst, 'reload schema';

commit;
