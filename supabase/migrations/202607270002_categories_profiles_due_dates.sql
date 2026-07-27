create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 40),
  color text not null default '#34d399' check (color ~ '^#[0-9a-fA-F]{6}$'),
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

alter table public.transactions
  add column if not exists due_date date,
  add column if not exists status text not null default 'paid';

alter table public.transactions
  drop constraint if exists transactions_status_check;

alter table public.transactions
  add constraint transactions_status_check check (status in ('paid', 'pending'));

alter table public.profiles enable row level security;
alter table public.categories enable row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "Users can view own categories"
  on public.categories for select using (auth.uid() = user_id);
create policy "Users can create own categories"
  on public.categories for insert with check (auth.uid() = user_id);
create policy "Users can update own categories"
  on public.categories for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own categories"
  on public.categories for delete using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;

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
  on conflict (user_id, name) do nothing;

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
on conflict (user_id, name) do nothing;

create index if not exists transactions_user_due_idx
  on public.transactions (user_id, due_date)
  where status = 'pending';

create index if not exists categories_user_idx
  on public.categories (user_id);
