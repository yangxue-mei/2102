-- 个人账本应用数据库 schema
-- 使用 Supabase Auth 进行用户身份认证，使用 RLS 实现用户数据隔离

-- =====================================================================
-- categories：分类表
-- =====================================================================
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  type        text not null check (type in ('income','expense')),
  is_preset   boolean not null default false,
  created_at  timestamptz not null default now(),
  unique (user_id, name, type)
);

-- =====================================================================
-- transactions：账目表
-- =====================================================================
create table if not exists public.transactions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  amount       numeric(12,2) not null check (amount > 0),
  date         date not null,
  type         text not null check (type in ('income','expense')),
  category_id  uuid references public.categories(id) on delete set null,
  note         text,
  created_at   timestamptz not null default now()
);

create index if not exists idx_transactions_user_date on public.transactions(user_id, date desc);
create index if not exists idx_transactions_user_type on public.transactions(user_id, type);
create index if not exists idx_transactions_user_category on public.transactions(user_id, category_id);

-- =====================================================================
-- RLS 策略
-- =====================================================================
alter table public.categories enable row level security;
alter table public.transactions enable row level security;

drop policy if exists "categories_select_own" on public.categories;
drop policy if exists "categories_insert_own" on public.categories;
drop policy if exists "categories_update_own" on public.categories;
drop policy if exists "categories_delete_own" on public.categories;
create policy "categories_select_own" on public.categories
  for select using (auth.uid() = user_id);
create policy "categories_insert_own" on public.categories
  for insert with check (auth.uid() = user_id);
create policy "categories_update_own" on public.categories
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "categories_delete_own" on public.categories
  for delete using (auth.uid() = user_id);

drop policy if exists "transactions_select_own" on public.transactions;
drop policy if exists "transactions_insert_own" on public.transactions;
drop policy if exists "transactions_update_own" on public.transactions;
drop policy if exists "transactions_delete_own" on public.transactions;
create policy "transactions_select_own" on public.transactions
  for select using (auth.uid() = user_id);
create policy "transactions_insert_own" on public.transactions
  for insert with check (auth.uid() = user_id);
create policy "transactions_update_own" on public.transactions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "transactions_delete_own" on public.transactions
  for delete using (auth.uid() = user_id);

-- =====================================================================
-- 预设分类种子：新用户注册后自动插入预设分类
-- =====================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.categories (user_id, name, type, is_preset)
  values
    (new.id, '餐饮', 'expense', true),
    (new.id, '交通', 'expense', true),
    (new.id, '购物', 'expense', true),
    (new.id, '娱乐', 'expense', true),
    (new.id, '工资', 'income',  true),
    (new.id, '奖金', 'income',  true),
    (new.id, '理财', 'income',  true);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
