-- Migration 010: APIs Gouvernementales - Cache tables
-- API Entreprise (SIREN), API VIES (TVA), API Pappers (Risque)

-- ========================================
-- Table: entreprises_cache (API Entreprise - SIREN)
-- ========================================
CREATE TABLE IF NOT EXISTS entreprises_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  siren VARCHAR(9) UNIQUE NOT NULL,
  denomination VARCHAR(255),
  forme_juridique VARCHAR(100),
  adresse_complete TEXT,
  code_postal VARCHAR(10),
  commune VARCHAR(255),
  tva_intracom VARCHAR(20),
  statut_actif BOOLEAN DEFAULT TRUE,
  cached_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_entreprises_siren ON entreprises_cache(siren);
CREATE INDEX IF NOT EXISTS idx_entreprises_expires ON entreprises_cache(expires_at);

ALTER TABLE entreprises_cache ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'entreprises_cache' AND policyname = 'Public read access on entreprises_cache'
  ) THEN
    CREATE POLICY "Public read access on entreprises_cache"
      ON entreprises_cache FOR SELECT
      USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'entreprises_cache' AND policyname = 'Service write access on entreprises_cache'
  ) THEN
    CREATE POLICY "Service write access on entreprises_cache"
      ON entreprises_cache FOR ALL
      USING (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- ========================================
-- Table: tva_validations_cache (API VIES - TVA)
-- ========================================
CREATE TABLE IF NOT EXISTS tva_validations_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_tva VARCHAR(20) UNIQUE NOT NULL,
  pays_code VARCHAR(2),
  est_valide BOOLEAN NOT NULL,
  nom_entreprise VARCHAR(255),
  adresse TEXT,
  validated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tva_numero ON tva_validations_cache(numero_tva);

ALTER TABLE tva_validations_cache ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'tva_validations_cache' AND policyname = 'Public read access on tva_validations_cache'
  ) THEN
    CREATE POLICY "Public read access on tva_validations_cache"
      ON tva_validations_cache FOR SELECT
      USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'tva_validations_cache' AND policyname = 'Authenticated write access on tva_validations_cache'
  ) THEN
    CREATE POLICY "Authenticated write access on tva_validations_cache"
      ON tva_validations_cache FOR ALL
      USING (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- ========================================
-- Table: fournisseurs_risque_cache (API Pappers - Risque)
-- ========================================
CREATE TABLE IF NOT EXISTS fournisseurs_risque_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  siren VARCHAR(9) UNIQUE NOT NULL,
  score_risque INTEGER CHECK (score_risque BETWEEN 1 AND 10),
  chiffre_affaires DECIMAL(15,2),
  resultat_net DECIMAL(15,2),
  effectif INTEGER,
  cached_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_risque_siren ON fournisseurs_risque_cache(siren);
CREATE INDEX IF NOT EXISTS idx_risque_expires ON fournisseurs_risque_cache(expires_at);

ALTER TABLE fournisseurs_risque_cache ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'fournisseurs_risque_cache' AND policyname = 'Authenticated read access on fournisseurs_risque_cache'
  ) THEN
    CREATE POLICY "Authenticated read access on fournisseurs_risque_cache"
      ON fournisseurs_risque_cache FOR SELECT
      USING (auth.role() = 'authenticated');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'fournisseurs_risque_cache' AND policyname = 'Authenticated write access on fournisseurs_risque_cache'
  ) THEN
    CREATE POLICY "Authenticated write access on fournisseurs_risque_cache"
      ON fournisseurs_risque_cache FOR ALL
      USING (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;
