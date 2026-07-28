begin;

create table if not exists public.financial_spaces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 50),
  color text not null default '#0a84ff' check (color ~ '^#[0-9a-fA-F]{6}$'),
  icon text not null default 'wallet',
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 60),
  type text not null default 'other' check (type in ('cash', 'bank', 'virtual_wallet', 'prepaid', 'other')),
  icon text not null default 'wallet',
  color text not null default '#30d158' check (color ~ '^#[0-9a-fA-F]{6}$'),
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists financial_spaces_user_name_uidx
  on public.financial_spaces (user_id, lower(name));
create unique index if not exists accounts_user_name_uidx
  on public.accounts (user_id, lower(name));
create index if not exists financial_spaces_user_sort_idx
  on public.financial_spaces (user_id, active desc, sort_order, name);
create index if not exists accounts_user_sort_idx
  on public.accounts (user_id, active desc, sort_order, name);

insert into public.financial_spaces (user_id, name, color, icon, sort_order)
select users.id, defaults.name, defaults.color, defaults.icon, defaults.sort_order
from auth.users users
cross join (values
  ('Personal', '#0a84ff', 'user', 10),
  ('Mintha', '#af52de', 'briefcase', 20)
) defaults(name, color, icon, sort_order)
on conflict (user_id, (lower(name))) do nothing;

insert into public.accounts (user_id, name, type, icon, color, sort_order)
select users.id, defaults.name, defaults.type, defaults.icon, defaults.color, defaults.sort_order
from auth.users users
cross join (values
  ('Efectivo', 'cash', 'banknote', '#30d158', 10),
  ('Mercado Pago Agustín', 'virtual_wallet', 'smartphone', '#00b1ea', 20),
  ('Mercado Pago Lau', 'virtual_wallet', 'smartphone', '#38bdf8', 30),
  ('Personal Pay', 'virtual_wallet', 'smartphone', '#7c3aed', 40),
  ('Naranja X', 'virtual_wallet', 'credit-card', '#ff9500', 50),
  ('Cuenta DNI', 'bank', 'landmark', '#0a84ff', 60)
) defaults(name, type, icon, color, sort_order)
on conflict (user_id, (lower(name))) do nothing;

alter table public.transactions
  add column if not exists space_id uuid,
  add column if not exists account_id uuid;

update public.transactions t
set space_id = s.id
from public.financial_spaces s
where t.space_id is null and s.user_id = t.user_id and lower(s.name) = 'personal';

update public.transactions t
set account_id = a.id
from public.accounts a
where t.account_id is null and a.user_id = t.user_id and lower(a.name) = 'efectivo';

alter table public.transactions
  alter column space_id set not null,
  alter column account_id set not null;

alter table public.transactions drop constraint if exists transactions_space_id_fkey;
alter table public.transactions
  add constraint transactions_space_id_fkey foreign key (space_id)
  references public.financial_spaces(id) on delete restrict;
alter table public.transactions drop constraint if exists transactions_account_id_fkey;
alter table public.transactions
  add constraint transactions_account_id_fkey foreign key (account_id)
  references public.accounts(id) on delete restrict;

create index if not exists transactions_space_idx on public.transactions (user_id, space_id);
create index if not exists transactions_account_idx on public.transactions (user_id, account_id);

alter table public.financial_spaces enable row level security;
alter table public.accounts enable row level security;
alter table public.financial_spaces force row level security;
alter table public.accounts force row level security;

drop policy if exists "financial_spaces_select_own" on public.financial_spaces;
drop policy if exists "financial_spaces_insert_own" on public.financial_spaces;
drop policy if exists "financial_spaces_update_own" on public.financial_spaces;
drop policy if exists "financial_spaces_delete_unused" on public.financial_spaces;
create policy "financial_spaces_select_own" on public.financial_spaces
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "financial_spaces_insert_own" on public.financial_spaces
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "financial_spaces_update_own" on public.financial_spaces
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "financial_spaces_delete_unused" on public.financial_spaces
  for delete to authenticated using (
    (select auth.uid()) = user_id
    and not exists (select 1 from public.transactions t where t.space_id = financial_spaces.id)
  );

drop policy if exists "accounts_select_own" on public.accounts;
drop policy if exists "accounts_insert_own" on public.accounts;
drop policy if exists "accounts_update_own" on public.accounts;
drop policy if exists "accounts_delete_unused" on public.accounts;
create policy "accounts_select_own" on public.accounts
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "accounts_insert_own" on public.accounts
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "accounts_update_own" on public.accounts
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "accounts_delete_unused" on public.accounts
  for delete to authenticated using (
    (select auth.uid()) = user_id
    and not exists (select 1 from public.transactions t where t.account_id = accounts.id)
  );

drop policy if exists "transactions_insert_own" on public.transactions;
drop policy if exists "transactions_update_own" on public.transactions;
create policy "transactions_insert_own" on public.transactions
  for insert to authenticated with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.financial_spaces s where s.id = space_id and s.user_id = (select auth.uid()) and s.active)
    and exists (select 1 from public.accounts a where a.id = account_id and a.user_id = (select auth.uid()) and a.active)
  );
create policy "transactions_update_own" on public.transactions
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.financial_spaces s where s.id = space_id and s.user_id = (select auth.uid()))
    and exists (select 1 from public.accounts a where a.id = account_id and a.user_id = (select auth.uid()))
  );

drop trigger if exists financial_spaces_set_updated_at on public.financial_spaces;
create trigger financial_spaces_set_updated_at before update on public.financial_spaces
  for each row execute function public.set_updated_at();
drop trigger if exists accounts_set_updated_at on public.accounts;
create trigger accounts_set_updated_at before update on public.accounts
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
  on conflict (id) do nothing;

  insert into public.categories (user_id, name, color)
  values
    (new.id, 'Alimentos', '#fb923c'), (new.id, 'Transporte', '#38bdf8'),
    (new.id, 'Vivienda', '#a78bfa'), (new.id, 'Servicios', '#fbbf24'),
    (new.id, 'Salud', '#fb7185'), (new.id, 'Ocio', '#2dd4bf'),
    (new.id, 'Sueldo', '#34d399'), (new.id, 'Inversiones', '#94a3b8'),
    (new.id, 'Otros', '#64748b')
  on conflict (user_id, (lower(name))) do nothing;

  insert into public.financial_spaces (user_id, name, color, icon, sort_order)
  values (new.id, 'Personal', '#0a84ff', 'user', 10),
         (new.id, 'Mintha', '#af52de', 'briefcase', 20)
  on conflict (user_id, (lower(name))) do nothing;

  insert into public.accounts (user_id, name, type, icon, color, sort_order)
  values
    (new.id, 'Efectivo', 'cash', 'banknote', '#30d158', 10),
    (new.id, 'Mercado Pago Agustín', 'virtual_wallet', 'smartphone', '#00b1ea', 20),
    (new.id, 'Mercado Pago Lau', 'virtual_wallet', 'smartphone', '#38bdf8', 30),
    (new.id, 'Personal Pay', 'virtual_wallet', 'smartphone', '#7c3aed', 40),
    (new.id, 'Naranja X', 'virtual_wallet', 'credit-card', '#ff9500', 50),
    (new.id, 'Cuenta DNI', 'bank', 'landmark', '#0a84ff', 60)
  on conflict (user_id, (lower(name))) do nothing;
  return new;
end;
$$;

grant select, insert, update, delete on public.financial_spaces to authenticated;
grant select, insert, update, delete on public.accounts to authenticated;
revoke all on public.financial_spaces from anon;
revoke all on public.accounts from anon;

notify pgrst, 'reload schema';
commit;
