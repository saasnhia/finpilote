-- ========================================
-- PHASE 1: Bank Automation - FINAL VERSION
-- ========================================
-- Ultra-safe: Handles non-existent tables in DROP statements
-- Idempotent: Can be run multiple times safely

-- ========================================
-- STEP 1: Create comptes_bancaires table
-- ========================================

-- Create table first (if not exists)
create table if not exists public.comptes_bancaires (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  bank_name text not null,
  account_name text not null,
  iban text not null,
  bic text,
  current_balance numeric(12,2) not null default 0,
  last_sync_date timestamp with time zone,
  account_type text not null default 'checking' check (account_type in ('checking', 'savings', 'business')),
  is_active boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, iban)
);

-- Now safely drop and recreate policies/triggers/indexes
do $$
begin
  -- Drop policy if exists
  if exists (
    select 1 from pg_policies
    where tablename = 'comptes_bancaires'
    and policyname = 'Users can manage their own bank accounts'
  ) then
    drop policy "Users can manage their own bank accounts" on public.comptes_bancaires;
  end if;

  -- Drop trigger if exists
  if exists (
    select 1 from pg_trigger
    where tgname = 'handle_comptes_bancaires_updated_at'
  ) then
    drop trigger handle_comptes_bancaires_updated_at on public.comptes_bancaires;
  end if;
end $$;

-- Drop indexes safely
drop index if exists public.comptes_bancaires_user_id_idx;
drop index if exists public.comptes_bancaires_is_active_idx;

-- Create indexes
create index comptes_bancaires_user_id_idx on public.comptes_bancaires(user_id);
create index comptes_bancaires_is_active_idx on public.comptes_bancaires(is_active);

-- Enable RLS
alter table public.comptes_bancaires enable row level security;

-- Create policy
create policy "Users can manage their own bank accounts"
  on public.comptes_bancaires for all
  using (auth.uid() = user_id);

-- Create trigger
create trigger handle_comptes_bancaires_updated_at
  before update on public.comptes_bancaires
  for each row execute procedure public.handle_updated_at();

-- ========================================
-- STEP 2: Create categories_personnalisees table
-- ========================================

-- Create table first (if not exists)
create table if not exists public.categories_personnalisees (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  description_pattern text not null,
  category text not null,
  is_fixed boolean not null default false,
  confidence_score numeric(3,2) not null default 1.00,
  usage_count integer not null default 0,
  last_used_at timestamp with time zone,
  pattern_type text not null default 'substring' check (pattern_type in ('substring', 'regex', 'exact')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Now safely drop and recreate policies/triggers/indexes
do $$
begin
  -- Drop policy if exists
  if exists (
    select 1 from pg_policies
    where tablename = 'categories_personnalisees'
    and policyname = 'Users can manage their own custom categories'
  ) then
    drop policy "Users can manage their own custom categories" on public.categories_personnalisees;
  end if;

  -- Drop trigger if exists
  if exists (
    select 1 from pg_trigger
    where tgname = 'handle_categories_personnalisees_updated_at'
  ) then
    drop trigger handle_categories_personnalisees_updated_at on public.categories_personnalisees;
  end if;
end $$;

-- Drop indexes safely
drop index if exists public.categories_personnalisees_user_id_idx;
drop index if exists public.categories_personnalisees_category_idx;

-- Create indexes
create index categories_personnalisees_user_id_idx on public.categories_personnalisees(user_id);
create index categories_personnalisees_category_idx on public.categories_personnalisees(category);

-- Enable RLS
alter table public.categories_personnalisees enable row level security;

-- Create policy
create policy "Users can manage their own custom categories"
  on public.categories_personnalisees for all
  using (auth.uid() = user_id);

-- Create trigger
create trigger handle_categories_personnalisees_updated_at
  before update on public.categories_personnalisees
  for each row execute procedure public.handle_updated_at();

-- ========================================
-- STEP 3: Extend transactions table (columns only, no FK yet)
-- ========================================

-- Drop indexes first
drop index if exists public.transactions_bank_account_id_idx;
drop index if exists public.transactions_source_idx;
drop index if exists public.transactions_status_idx;
drop index if exists public.transactions_import_batch_id_idx;

-- Add columns one by one
do $$
begin
  -- bank_account_id (NO FK yet)
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'transactions' and column_name = 'bank_account_id'
  ) then
    alter table public.transactions add column bank_account_id uuid;
  end if;

  -- source
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'transactions' and column_name = 'source'
  ) then
    alter table public.transactions add column source text not null default 'manual';
  end if;

  -- Add check constraint for source
  if not exists (
    select 1 from information_schema.constraint_column_usage
    where table_name = 'transactions' and constraint_name like '%source%check%'
  ) then
    alter table public.transactions add constraint transactions_source_check
      check (source in ('manual', 'bank_import', 'invoice'));
  end if;

  -- status
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'transactions' and column_name = 'status'
  ) then
    alter table public.transactions add column status text not null default 'active';
  end if;

  -- Add check constraint for status
  if not exists (
    select 1 from information_schema.constraint_column_usage
    where table_name = 'transactions' and constraint_name like '%status%check%'
  ) then
    alter table public.transactions add constraint transactions_status_check
      check (status in ('active', 'reconciled', 'duplicate', 'pending'));
  end if;

  -- confidence_score
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'transactions' and column_name = 'confidence_score'
  ) then
    alter table public.transactions add column confidence_score numeric(3,2);
  end if;

  -- original_description
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'transactions' and column_name = 'original_description'
  ) then
    alter table public.transactions add column original_description text;
  end if;

  -- import_batch_id
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'transactions' and column_name = 'import_batch_id'
  ) then
    alter table public.transactions add column import_batch_id uuid;
  end if;

  -- suggested_category
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'transactions' and column_name = 'suggested_category'
  ) then
    alter table public.transactions add column suggested_category text;
  end if;

  -- category_confirmed
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'transactions' and column_name = 'category_confirmed'
  ) then
    alter table public.transactions add column category_confirmed boolean not null default false;
  end if;
end $$;

-- ========================================
-- STEP 4: Create rapprochements table
-- ========================================

-- Create table first (if not exists)
create table if not exists public.rapprochements (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  transaction_id uuid references public.transactions on delete cascade not null,
  bank_transaction_id uuid references public.transactions on delete cascade not null,
  match_score numeric(3,2) not null,
  match_method text not null check (match_method in ('auto', 'manual', 'suggested')),
  date_score numeric(3,2),
  amount_score numeric(3,2),
  description_score numeric(3,2),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected')),
  confirmed_at timestamp with time zone,
  confirmed_by_user boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(transaction_id, bank_transaction_id)
);

-- Now safely drop and recreate policies/triggers/indexes
do $$
begin
  -- Drop policy if exists
  if exists (
    select 1 from pg_policies
    where tablename = 'rapprochements'
    and policyname = 'Users can manage their own reconciliations'
  ) then
    drop policy "Users can manage their own reconciliations" on public.rapprochements;
  end if;

  -- Drop trigger if exists
  if exists (
    select 1 from pg_trigger
    where tgname = 'handle_rapprochements_updated_at'
  ) then
    drop trigger handle_rapprochements_updated_at on public.rapprochements;
  end if;
end $$;

-- Drop indexes safely
drop index if exists public.rapprochements_user_id_idx;
drop index if exists public.rapprochements_status_idx;
drop index if exists public.rapprochements_transaction_id_idx;
drop index if exists public.rapprochements_bank_transaction_id_idx;

-- Create indexes
create index rapprochements_user_id_idx on public.rapprochements(user_id);
create index rapprochements_status_idx on public.rapprochements(status);
create index rapprochements_transaction_id_idx on public.rapprochements(transaction_id);
create index rapprochements_bank_transaction_id_idx on public.rapprochements(bank_transaction_id);

-- Enable RLS
alter table public.rapprochements enable row level security;

-- Create policy
create policy "Users can manage their own reconciliations"
  on public.rapprochements for all
  using (auth.uid() = user_id);

-- Create trigger
create trigger handle_rapprochements_updated_at
  before update on public.rapprochements
  for each row execute procedure public.handle_updated_at();

-- ========================================
-- STEP 5: Add foreign key constraint to transactions.bank_account_id
-- ========================================

do $$
begin
  -- Drop existing constraint if any
  if exists (
    select 1 from pg_constraint
    where conname = 'transactions_bank_account_id_fkey'
  ) then
    alter table public.transactions drop constraint transactions_bank_account_id_fkey;
  end if;

  -- Add the foreign key constraint
  alter table public.transactions
    add constraint transactions_bank_account_id_fkey
    foreign key (bank_account_id)
    references public.comptes_bancaires(id)
    on delete set null;
end $$;

-- ========================================
-- STEP 6: Create indexes on new transaction columns
-- ========================================

create index if not exists transactions_bank_account_id_idx on public.transactions(bank_account_id);
create index if not exists transactions_source_idx on public.transactions(source);
create index if not exists transactions_status_idx on public.transactions(status);
create index if not exists transactions_import_batch_id_idx on public.transactions(import_batch_id);

-- ========================================
-- VERIFICATION: Run this to check migration status
-- ========================================

select 'Migration completed successfully!' as status;

-- Verify tables
select 'comptes_bancaires' as table_name, count(*) as rows from public.comptes_bancaires
union all
select 'categories_personnalisees', count(*) from public.categories_personnalisees
union all
select 'rapprochements', count(*) from public.rapprochements;

-- Verify new columns in transactions
select column_name, data_type
from information_schema.columns
where table_name = 'transactions'
  and column_name in ('bank_account_id', 'source', 'status', 'confidence_score',
                      'original_description', 'import_batch_id', 'suggested_category',
                      'category_confirmed')
order by column_name;
