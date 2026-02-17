-- Migration 009: Smart Matching - Supplier History + Partial Payments
-- Tables pour le systeme de matching intelligent multi-criteres

-- ========================================
-- Table: supplier_histories (apprentissage fournisseur)
-- ========================================
CREATE TABLE IF NOT EXISTS supplier_histories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  supplier_name TEXT NOT NULL,
  supplier_normalized TEXT NOT NULL,
  transaction_patterns JSONB DEFAULT '[]'::jsonb,
  iban_patterns JSONB DEFAULT '[]'::jsonb,
  avg_amount NUMERIC(12,2) DEFAULT 0,
  match_count INTEGER DEFAULT 0,
  last_matched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour recherche rapide par user + fournisseur normalise
CREATE INDEX IF NOT EXISTS idx_supplier_histories_user
  ON supplier_histories(user_id);
CREATE INDEX IF NOT EXISTS idx_supplier_histories_normalized
  ON supplier_histories(user_id, supplier_normalized);

-- RLS
ALTER TABLE supplier_histories ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'supplier_histories' AND policyname = 'Users can manage their own supplier histories'
  ) THEN
    CREATE POLICY "Users can manage their own supplier histories"
      ON supplier_histories FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ========================================
-- Table: partial_payments (paiements partiels)
-- ========================================
CREATE TABLE IF NOT EXISTS partial_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  facture_id UUID NOT NULL,
  transaction_id UUID NOT NULL,
  montant_paye NUMERIC(12,2) NOT NULL,
  date_paiement DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_partial_payments_user
  ON partial_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_partial_payments_facture
  ON partial_payments(facture_id);

-- RLS
ALTER TABLE partial_payments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'partial_payments' AND policyname = 'Users can manage their own partial payments'
  ) THEN
    CREATE POLICY "Users can manage their own partial payments"
      ON partial_payments FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ========================================
-- Add smart score columns to rapprochements_factures (if not exists)
-- ========================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rapprochements_factures' AND column_name = 'supplier_score'
  ) THEN
    ALTER TABLE rapprochements_factures ADD COLUMN supplier_score NUMERIC(5,2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rapprochements_factures' AND column_name = 'invoice_number_score'
  ) THEN
    ALTER TABLE rapprochements_factures ADD COLUMN invoice_number_score NUMERIC(5,2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rapprochements_factures' AND column_name = 'iban_bonus'
  ) THEN
    ALTER TABLE rapprochements_factures ADD COLUMN iban_bonus NUMERIC(5,2);
  END IF;
END $$;
