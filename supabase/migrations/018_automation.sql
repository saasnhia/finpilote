-- ============================================================
-- Migration 018 — Automatisation intelligente (Feature 1)
-- Règles de catégorisation + Log d'automatisation + Settings
-- ============================================================

-- ------------------------------------------------------------
-- 1. ALTER TABLE factures — ajout colonnes comptables
-- ------------------------------------------------------------
ALTER TABLE public.factures
  ADD COLUMN IF NOT EXISTS compte_comptable TEXT,
  ADD COLUMN IF NOT EXISTS code_tva TEXT,
  ADD COLUMN IF NOT EXISTS categorie TEXT;

COMMENT ON COLUMN public.factures.compte_comptable IS 'Compte PCG (ex: 607, 6061, 604...)';
COMMENT ON COLUMN public.factures.code_tva IS 'Code TVA appliqué (ex: TVA20, TVA10, EXONERE)';
COMMENT ON COLUMN public.factures.categorie IS 'Catégorie libre (ex: Fournitures, Loyer, Abonnement)';

-- ------------------------------------------------------------
-- 2. TABLE categorization_rules
-- Règles fournisseur → compte comptable
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categorization_rules (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fournisseur_pattern TEXT NOT NULL,          -- pattern normalisé (lowercase, sans accents)
  fournisseur_display TEXT,                   -- nom d'affichage original
  compte_comptable  TEXT NOT NULL,            -- compte PCG (ex: '607')
  compte_label      TEXT,                     -- libellé lisible (ex: 'Achats de marchandises')
  code_tva          TEXT NOT NULL DEFAULT 'TVA20',
  categorie         TEXT,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  match_count       INTEGER NOT NULL DEFAULT 0,  -- nb de fois appliquée
  confidence        NUMERIC(5,2) NOT NULL DEFAULT 100.0, -- 0-100, baisse si conflit
  source            TEXT NOT NULL DEFAULT 'manual'
                    CHECK (source IN ('manual', 'learned', 'suggested')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Un pattern de fournisseur = une règle par user
  UNIQUE (user_id, fournisseur_pattern)
);

CREATE INDEX IF NOT EXISTS idx_cat_rules_user_active
  ON public.categorization_rules(user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_cat_rules_pattern
  ON public.categorization_rules(user_id, fournisseur_pattern);

-- RLS
ALTER TABLE public.categorization_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "cat_rules_select_own"
  ON public.categorization_rules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "cat_rules_insert_own"
  ON public.categorization_rules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "cat_rules_update_own"
  ON public.categorization_rules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "cat_rules_delete_own"
  ON public.categorization_rules FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_categorization_rules_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cat_rules_updated_at ON public.categorization_rules;
CREATE TRIGGER trg_cat_rules_updated_at
  BEFORE UPDATE ON public.categorization_rules
  FOR EACH ROW EXECUTE FUNCTION update_categorization_rules_updated_at();

-- ------------------------------------------------------------
-- 3. TABLE automation_log
-- Journal de toutes les actions automatiques
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.automation_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type   TEXT NOT NULL CHECK (action_type IN (
    'auto_match',
    'match_suggested',
    'rule_applied',
    'rule_learned',
    'import_processed',
    'categorization_applied',
    'categorization_suggested'
  )),
  entity_type   TEXT NOT NULL CHECK (entity_type IN (
    'facture', 'transaction', 'rapprochement', 'rule'
  )),
  entity_id     UUID,           -- ID de l'entité concernée
  rule_id       UUID REFERENCES public.categorization_rules(id) ON DELETE SET NULL,
  metadata      JSONB NOT NULL DEFAULT '{}',
  -- Ex: { "compte_comptable": "607", "fournisseur": "EDF", "confidence": 95.5, "previous_value": null }
  is_reversible BOOLEAN NOT NULL DEFAULT true,
  is_reversed   BOOLEAN NOT NULL DEFAULT false,
  reversed_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_automation_log_user_date
  ON public.automation_log(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_automation_log_entity
  ON public.automation_log(user_id, entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_automation_log_action
  ON public.automation_log(user_id, action_type, created_at DESC);

-- RLS
ALTER TABLE public.automation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "automation_log_select_own"
  ON public.automation_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "automation_log_insert_own"
  ON public.automation_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Permettre la mise à jour is_reversed (annulation)
CREATE POLICY IF NOT EXISTS "automation_log_update_own"
  ON public.automation_log FOR UPDATE
  USING (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 4. TABLE automation_settings
-- Préférences d'automatisation par utilisateur
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.automation_settings (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Catégorisation
  categorization_auto_apply   BOOLEAN NOT NULL DEFAULT false,  -- false = suggestions seulement
  categorization_min_confidence NUMERIC(5,2) NOT NULL DEFAULT 85.0,
  -- Rapprochement
  auto_matching_enabled       BOOLEAN NOT NULL DEFAULT true,
  auto_match_threshold        INTEGER NOT NULL DEFAULT 85,
  suggest_threshold           INTEGER NOT NULL DEFAULT 50,
  -- Notifications
  notify_on_auto_action       BOOLEAN NOT NULL DEFAULT true,
  -- Timestamps
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (user_id)
);

-- RLS
ALTER TABLE public.automation_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "automation_settings_select_own"
  ON public.automation_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "automation_settings_insert_own"
  ON public.automation_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "automation_settings_update_own"
  ON public.automation_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_automation_settings_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_automation_settings_updated_at ON public.automation_settings;
CREATE TRIGGER trg_automation_settings_updated_at
  BEFORE UPDATE ON public.automation_settings
  FOR EACH ROW EXECUTE FUNCTION update_automation_settings_updated_at();

-- Créer des settings par défaut pour les users existants
INSERT INTO public.automation_settings (user_id)
SELECT id FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.automation_settings)
ON CONFLICT (user_id) DO NOTHING;

-- ------------------------------------------------------------
-- 5. Index sur factures pour les nouvelles colonnes
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_factures_compte_comptable
  ON public.factures(user_id, compte_comptable)
  WHERE compte_comptable IS NOT NULL;

-- ============================================================
-- END Migration 018
-- ============================================================
