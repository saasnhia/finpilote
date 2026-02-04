-- FinPilote Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users profile table (extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  company_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Financial data table
create table if not exists public.financial_data (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  month text not null, -- Format: YYYY-MM
  fixed_costs jsonb not null default '{
    "rent": 0,
    "salaries": 0,
    "insurance": 0,
    "subscriptions": 0,
    "loan_payments": 0,
    "other": 0
  }'::jsonb,
  variable_cost_rate numeric(5,2) not null default 0,
  revenue numeric(12,2) not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, month)
);

-- Transactions table
create table if not exists public.transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  date date not null default current_date,
  description text not null,
  amount numeric(12,2) not null,
  type text not null check (type in ('income', 'expense')),
  category text not null default 'other',
  is_fixed boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes
create index if not exists financial_data_user_id_idx on public.financial_data(user_id);
create index if not exists financial_data_month_idx on public.financial_data(month);
create index if not exists transactions_user_id_idx on public.transactions(user_id);
create index if not exists transactions_date_idx on public.transactions(date);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.financial_data enable row level security;
alter table public.transactions enable row level security;

-- Profiles policies
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Financial data policies
create policy "Users can view their own financial data"
  on public.financial_data for select
  using (auth.uid() = user_id);

create policy "Users can insert their own financial data"
  on public.financial_data for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own financial data"
  on public.financial_data for update
  using (auth.uid() = user_id);

create policy "Users can delete their own financial data"
  on public.financial_data for delete
  using (auth.uid() = user_id);

-- Transactions policies
create policy "Users can view their own transactions"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own transactions"
  on public.transactions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own transactions"
  on public.transactions for update
  using (auth.uid() = user_id);

create policy "Users can delete their own transactions"
  on public.transactions for delete
  using (auth.uid() = user_id);

-- Function to create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

-- Trigger to auto-create profile
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

-- Triggers for updated_at
drop trigger if exists handle_profiles_updated_at on public.profiles;
create trigger handle_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

drop trigger if exists handle_financial_data_updated_at on public.financial_data;
create trigger handle_financial_data_updated_at
  before update on public.financial_data
  for each row execute procedure public.handle_updated_at();

-- Factures/Invoices table for OCR-extracted invoices
create table if not exists public.factures (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,

  -- File metadata
  file_name text not null,
  file_type text not null check (file_type in ('pdf', 'jpg', 'jpeg', 'png')),
  file_size_bytes integer not null,

  -- Extracted fields (French accounting standards - PCG)
  montant_ht numeric(12,2), -- Amount excluding VAT
  tva numeric(12,2), -- VAT amount
  montant_ttc numeric(12,2), -- Total amount including VAT
  date_facture date, -- Invoice date
  numero_facture text, -- Invoice number
  nom_fournisseur text, -- Supplier name

  -- OCR processing metadata
  raw_ocr_text text, -- Full OCR text extracted by Tesseract

  -- AI validation metadata
  ai_confidence_score numeric(3,2), -- 0.00 to 1.00 confidence from Claude
  ai_extraction_notes text, -- Any notes/warnings from Claude

  -- Validation status
  validation_status text not null default 'pending' check (validation_status in ('pending', 'validated', 'rejected', 'manual_review')),
  validated_by_user boolean not null default false,

  -- User edits tracking
  user_edited_fields jsonb default '[]'::jsonb, -- Array of field names edited by user

  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for performance
create index if not exists factures_user_id_idx on public.factures(user_id);
create index if not exists factures_date_facture_idx on public.factures(date_facture);
create index if not exists factures_validation_status_idx on public.factures(validation_status);
create index if not exists factures_created_at_idx on public.factures(created_at desc);

-- Enable Row Level Security
alter table public.factures enable row level security;

-- RLS Policies
create policy "Users can view their own invoices"
  on public.factures for select
  using (auth.uid() = user_id);

create policy "Users can insert their own invoices"
  on public.factures for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own invoices"
  on public.factures for update
  using (auth.uid() = user_id);

create policy "Users can delete their own invoices"
  on public.factures for delete
  using (auth.uid() = user_id);

-- Trigger for updated_at timestamp
drop trigger if exists handle_factures_updated_at on public.factures;
create trigger handle_factures_updated_at
  before update on public.factures
  for each row execute procedure public.handle_updated_at();

-- ========================================
-- PHASE 1: Bank Automation Tables
-- ========================================

-- Bank Accounts table
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

-- Indexes for bank accounts
create index if not exists comptes_bancaires_user_id_idx on public.comptes_bancaires(user_id);
create index if not exists comptes_bancaires_is_active_idx on public.comptes_bancaires(is_active);

-- Enable RLS
alter table public.comptes_bancaires enable row level security;

-- RLS Policies for bank accounts
create policy "Users can manage their own bank accounts"
  on public.comptes_bancaires for all
  using (auth.uid() = user_id);

-- Trigger for updated_at
drop trigger if exists handle_comptes_bancaires_updated_at on public.comptes_bancaires;
create trigger handle_comptes_bancaires_updated_at
  before update on public.comptes_bancaires
  for each row execute procedure public.handle_updated_at();

-- Custom Category Patterns table (for learned categorization)
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

-- Indexes for custom categories
create index if not exists categories_personnalisees_user_id_idx on public.categories_personnalisees(user_id);
create index if not exists categories_personnalisees_category_idx on public.categories_personnalisees(category);

-- Enable RLS
alter table public.categories_personnalisees enable row level security;

-- RLS Policies for custom categories
create policy "Users can manage their own custom categories"
  on public.categories_personnalisees for all
  using (auth.uid() = user_id);

-- Trigger for updated_at
drop trigger if exists handle_categories_personnalisees_updated_at on public.categories_personnalisees;
create trigger handle_categories_personnalisees_updated_at
  before update on public.categories_personnalisees
  for each row execute procedure public.handle_updated_at();

-- Bank Reconciliation table
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

-- Indexes for reconciliation
create index if not exists rapprochements_user_id_idx on public.rapprochements(user_id);
create index if not exists rapprochements_status_idx on public.rapprochements(status);
create index if not exists rapprochements_transaction_id_idx on public.rapprochements(transaction_id);
create index if not exists rapprochements_bank_transaction_id_idx on public.rapprochements(bank_transaction_id);

-- Enable RLS
alter table public.rapprochements enable row level security;

-- RLS Policies for reconciliation
create policy "Users can manage their own reconciliations"
  on public.rapprochements for all
  using (auth.uid() = user_id);

-- Trigger for updated_at
drop trigger if exists handle_rapprochements_updated_at on public.rapprochements;
create trigger handle_rapprochements_updated_at
  before update on public.rapprochements
  for each row execute procedure public.handle_updated_at();

-- ========================================
-- PHASE 1: Extend Transactions Table
-- ========================================

-- Add new columns to transactions for bank automation
alter table public.transactions
  add column if not exists bank_account_id uuid references public.comptes_bancaires on delete set null,
  add column if not exists source text not null default 'manual' check (source in ('manual', 'bank_import', 'invoice')),
  add column if not exists status text not null default 'active' check (status in ('active', 'reconciled', 'duplicate', 'pending')),
  add column if not exists confidence_score numeric(3,2),
  add column if not exists original_description text,
  add column if not exists import_batch_id uuid,
  add column if not exists suggested_category text,
  add column if not exists category_confirmed boolean not null default false;

-- Additional indexes for new columns
create index if not exists transactions_bank_account_id_idx on public.transactions(bank_account_id);
create index if not exists transactions_source_idx on public.transactions(source);
create index if not exists transactions_status_idx on public.transactions(status);
create index if not exists transactions_import_batch_id_idx on public.transactions(import_batch_id);
