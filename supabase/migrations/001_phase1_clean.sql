-- ========================================
-- PHASE 1: Bank Automation - Clean Migration
-- ========================================
-- This migration is idempotent and can be run multiple times
-- It will create 3 new tables and extend the transactions table

-- ========================================
-- TABLE 1: comptes_bancaires (Bank Accounts)
-- ========================================

-- Drop existing policies, triggers, indexes
drop policy if exists "Users can manage their own bank accounts" on public.comptes_bancaires;
drop trigger if exists handle_comptes_bancaires_updated_at on public.comptes_bancaires;
drop index if exists public.comptes_bancaires_user_id_idx;
drop index if exists public.comptes_bancaires_is_active_idx;

-- Create table
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

-- Create indexes
create index comptes_bancaires_user_id_idx on public.comptes_bancaires(user_id);
create index comptes_bancaires_is_active_idx on public.comptes_bancaires(is_active);

-- Enable RLS
alter table public.comptes_bancaires enable row level security;

-- Create policies
create policy "Users can manage their own bank accounts"
  on public.comptes_bancaires for all
  using (auth.uid() = user_id);

-- Create trigger
create trigger handle_comptes_bancaires_updated_at
  before update on public.comptes_bancaires
  for each row execute procedure public.handle_updated_at();

-- ========================================
-- TABLE 2: categories_personnalisees (Custom Categories)
-- ========================================

-- Drop existing policies, triggers, indexes
drop policy if exists "Users can manage their own custom categories" on public.categories_personnalisees;
drop trigger if exists handle_categories_personnalisees_updated_at on public.categories_personnalisees;
drop index if exists public.categories_personnalisees_user_id_idx;
drop index if exists public.categories_personnalisees_category_idx;

-- Create table
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

-- Create indexes
create index categories_personnalisees_user_id_idx on public.categories_personnalisees(user_id);
create index categories_personnalisees_category_idx on public.categories_personnalisees(category);

-- Enable RLS
alter table public.categories_personnalisees enable row level security;

-- Create policies
create policy "Users can manage their own custom categories"
  on public.categories_personnalisees for all
  using (auth.uid() = user_id);

-- Create trigger
create trigger handle_categories_personnalisees_updated_at
  before update on public.categories_personnalisees
  for each row execute procedure public.handle_updated_at();

-- ========================================
-- TABLE 3: rapprochements (Bank Reconciliation)
-- ========================================

-- Drop existing policies, triggers, indexes
drop policy if exists "Users can manage their own reconciliations" on public.rapprochements;
drop trigger if exists handle_rapprochements_updated_at on public.rapprochements;
drop index if exists public.rapprochements_user_id_idx;
drop index if exists public.rapprochements_status_idx;
drop index if exists public.rapprochements_transaction_id_idx;
drop index if exists public.rapprochements_bank_transaction_id_idx;

-- Create table
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

-- Create indexes
create index rapprochements_user_id_idx on public.rapprochements(user_id);
create index rapprochements_status_idx on public.rapprochements(status);
create index rapprochements_transaction_id_idx on public.rapprochements(transaction_id);
create index rapprochements_bank_transaction_id_idx on public.rapprochements(bank_transaction_id);

-- Enable RLS
alter table public.rapprochements enable row level security;

-- Create policies
create policy "Users can manage their own reconciliations"
  on public.rapprochements for all
  using (auth.uid() = user_id);

-- Create trigger
create trigger handle_rapprochements_updated_at
  before update on public.rapprochements
  for each row execute procedure public.handle_updated_at();

-- ========================================
-- EXTEND: transactions table (add Phase 1 columns)
-- ========================================

-- Drop existing indexes
drop index if exists public.transactions_bank_account_id_idx;
drop index if exists public.transactions_source_idx;
drop index if exists public.transactions_status_idx;
drop index if exists public.transactions_import_batch_id_idx;

-- Add new columns (IF NOT EXISTS)
do $$
begin
  -- bank_account_id
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public'
                 and table_name = 'transactions'
                 and column_name = 'bank_account_id') then
    alter table public.transactions add column bank_account_id uuid references public.comptes_bancaires on delete set null;
  end if;

  -- source
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public'
                 and table_name = 'transactions'
                 and column_name = 'source') then
    alter table public.transactions add column source text not null default 'manual' check (source in ('manual', 'bank_import', 'invoice'));
  end if;

  -- status
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public'
                 and table_name = 'transactions'
                 and column_name = 'status') then
    alter table public.transactions add column status text not null default 'active' check (status in ('active', 'reconciled', 'duplicate', 'pending'));
  end if;

  -- confidence_score
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public'
                 and table_name = 'transactions'
                 and column_name = 'confidence_score') then
    alter table public.transactions add column confidence_score numeric(3,2);
  end if;

  -- original_description
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public'
                 and table_name = 'transactions'
                 and column_name = 'original_description') then
    alter table public.transactions add column original_description text;
  end if;

  -- import_batch_id
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public'
                 and table_name = 'transactions'
                 and column_name = 'import_batch_id') then
    alter table public.transactions add column import_batch_id uuid;
  end if;

  -- suggested_category
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public'
                 and table_name = 'transactions'
                 and column_name = 'suggested_category') then
    alter table public.transactions add column suggested_category text;
  end if;

  -- category_confirmed
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public'
                 and table_name = 'transactions'
                 and column_name = 'category_confirmed') then
    alter table public.transactions add column category_confirmed boolean not null default false;
  end if;
end $$;

-- Create indexes for new columns
create index transactions_bank_account_id_idx on public.transactions(bank_account_id);
create index transactions_source_idx on public.transactions(source);
create index transactions_status_idx on public.transactions(status);
create index transactions_import_batch_id_idx on public.transactions(import_batch_id);

-- ========================================
-- VERIFICATION QUERIES (Optional - comment out after first run)
-- ========================================

-- Uncomment these to verify the migration succeeded:
-- select count(*) as comptes_bancaires_exists from information_schema.tables where table_name = 'comptes_bancaires';
-- select count(*) as categories_personnalisees_exists from information_schema.tables where table_name = 'categories_personnalisees';
-- select count(*) as rapprochements_exists from information_schema.tables where table_name = 'rapprochements';
-- select column_name from information_schema.columns where table_name = 'transactions' and column_name in ('bank_account_id', 'source', 'status', 'confidence_score', 'original_description', 'import_batch_id', 'suggested_category', 'category_confirmed');
