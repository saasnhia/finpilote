-- ========================================
-- PHASE 2: TVA CA3 - Migration SQL
-- ========================================

-- ========================================
-- TABLE 1: declarations_tva
-- ========================================

create table if not exists public.declarations_tva (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,

  -- Période
  periode_debut date not null,
  periode_fin date not null,
  regime text not null default 'reel_normal' check (regime in ('reel_normal', 'reel_simplifie', 'franchise')),

  -- Montants calculés
  montant_ht numeric(12,2) not null default 0,
  tva_collectee numeric(12,2) not null default 0,
  tva_deductible numeric(12,2) not null default 0,
  tva_nette numeric(12,2) not null default 0, -- positif = à payer, négatif = crédit

  -- Détail par taux
  ventes_tva_20 numeric(12,2) default 0,
  ventes_tva_10 numeric(12,2) default 0,
  ventes_tva_55 numeric(12,2) default 0,
  ventes_tva_21 numeric(12,2) default 0,
  achats_tva_20 numeric(12,2) default 0,
  achats_tva_10 numeric(12,2) default 0,
  achats_tva_55 numeric(12,2) default 0,
  achats_tva_21 numeric(12,2) default 0,

  -- Statut
  statut text not null default 'brouillon' check (statut in ('brouillon', 'validee', 'envoyee', 'payee')),
  date_validation timestamp with time zone,
  date_envoi timestamp with time zone,
  date_paiement timestamp with time zone,

  -- Fichiers
  fichier_ca3_url text,

  -- Notes
  notes text,

  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,

  unique(user_id, periode_debut, periode_fin)
);

-- Indexes
create index if not exists declarations_tva_user_id_idx on public.declarations_tva(user_id);
create index if not exists declarations_tva_statut_idx on public.declarations_tva(statut);
create index if not exists declarations_tva_periode_idx on public.declarations_tva(periode_debut, periode_fin);

-- Enable RLS
alter table public.declarations_tva enable row level security;

-- RLS Policy
create policy "Users can manage their own TVA declarations"
  on public.declarations_tva for all
  using (auth.uid() = user_id);

-- Trigger for updated_at
create trigger handle_declarations_tva_updated_at
  before update on public.declarations_tva
  for each row execute procedure public.handle_updated_at();

-- ========================================
-- TABLE 2: lignes_ca3
-- ========================================

create table if not exists public.lignes_ca3 (
  id uuid default uuid_generate_v4() primary key,
  declaration_id uuid references public.declarations_tva on delete cascade not null,

  -- Ligne CA3
  ligne_numero text not null, -- Ex: '01', '02', '08', '20', etc.
  ligne_libelle text not null,

  -- Montants
  base_ht numeric(12,2), -- Base HT pour les ventes
  taux_tva numeric(5,2), -- Taux de TVA (20.00, 10.00, etc.)
  montant_tva numeric(12,2) not null default 0, -- Montant de TVA

  -- Catégorie
  categorie text not null check (categorie in ('ventes', 'achats', 'autres_operations', 'credit_tva')),

  -- Métadonnées
  auto_calculated boolean not null default true, -- false si modifié manuellement
  transaction_count integer default 0, -- Nombre de transactions liées

  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes
create index if not exists lignes_ca3_declaration_id_idx on public.lignes_ca3(declaration_id);
create index if not exists lignes_ca3_ligne_numero_idx on public.lignes_ca3(ligne_numero);

-- Enable RLS
alter table public.lignes_ca3 enable row level security;

-- RLS Policy
create policy "Users can manage CA3 lines through declarations"
  on public.lignes_ca3 for all
  using (
    exists (
      select 1 from public.declarations_tva
      where declarations_tva.id = lignes_ca3.declaration_id
      and declarations_tva.user_id = auth.uid()
    )
  );

-- Trigger for updated_at
create trigger handle_lignes_ca3_updated_at
  before update on public.lignes_ca3
  for each row execute procedure public.handle_updated_at();

-- ========================================
-- VERIFICATION
-- ========================================

select 'Phase 2 migration completed!' as status;

-- Verify tables
select 'declarations_tva' as table_name, count(*) as rows from public.declarations_tva
union all
select 'lignes_ca3', count(*) from public.lignes_ca3;
