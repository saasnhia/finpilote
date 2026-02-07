-- ========================================
-- PHASE 3: Rapprochement Bancaire Intelligent
-- ========================================

-- ========================================
-- TABLE 1: rapprochements_factures
-- ========================================

create table if not exists public.rapprochements_factures (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  facture_id uuid references public.factures on delete cascade not null,
  transaction_id uuid references public.transactions on delete cascade not null,
  montant numeric(12,2) not null,
  type text not null default 'auto' check (type in ('auto', 'manuel', 'suggestion')),
  statut text not null default 'suggestion' check (statut in ('suggestion', 'valide', 'rejete')),
  confidence_score numeric(5,2) not null default 0,
  date_score numeric(5,2),
  amount_score numeric(5,2),
  description_score numeric(5,2),
  validated_at timestamp with time zone,
  validated_by_user boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(facture_id, transaction_id)
);

create index if not exists rapprochements_factures_user_id_idx on public.rapprochements_factures(user_id);
create index if not exists rapprochements_factures_facture_id_idx on public.rapprochements_factures(facture_id);
create index if not exists rapprochements_factures_transaction_id_idx on public.rapprochements_factures(transaction_id);
create index if not exists rapprochements_factures_statut_idx on public.rapprochements_factures(statut);

alter table public.rapprochements_factures enable row level security;

create policy "Users can manage their own invoice reconciliations"
  on public.rapprochements_factures for all
  using (auth.uid() = user_id);

create trigger handle_rapprochements_factures_updated_at
  before update on public.rapprochements_factures
  for each row execute procedure public.handle_updated_at();

-- ========================================
-- TABLE 2: anomalies_detectees
-- ========================================

create table if not exists public.anomalies_detectees (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  type text not null check (type in (
    'doublon_transaction',
    'doublon_facture',
    'transaction_sans_facture',
    'facture_sans_transaction',
    'ecart_tva',
    'ecart_montant',
    'date_incoherente',
    'montant_eleve'
  )),
  severite text not null default 'warning' check (severite in ('info', 'warning', 'critical')),
  description text not null,
  transaction_id uuid references public.transactions on delete set null,
  facture_id uuid references public.factures on delete set null,
  montant numeric(12,2),
  montant_attendu numeric(12,2),
  ecart numeric(12,2),
  statut text not null default 'ouverte' check (statut in ('ouverte', 'resolue', 'ignoree')),
  resolved_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists anomalies_detectees_user_id_idx on public.anomalies_detectees(user_id);
create index if not exists anomalies_detectees_type_idx on public.anomalies_detectees(type);
create index if not exists anomalies_detectees_severite_idx on public.anomalies_detectees(severite);
create index if not exists anomalies_detectees_statut_idx on public.anomalies_detectees(statut);
create index if not exists anomalies_detectees_transaction_id_idx on public.anomalies_detectees(transaction_id);

alter table public.anomalies_detectees enable row level security;

create policy "Users can manage their own anomalies"
  on public.anomalies_detectees for all
  using (auth.uid() = user_id);

create trigger handle_anomalies_detectees_updated_at
  before update on public.anomalies_detectees
  for each row execute procedure public.handle_updated_at();

-- ========================================
-- VERIFICATION
-- ========================================
select 'Phase 3 migration completed!' as status;

select 'rapprochements_factures' as table_name, count(*) as rows from public.rapprochements_factures
union all
select 'anomalies_detectees', count(*) from public.anomalies_detectees;
