-- ============================================
-- Phase 4 : Alertes, KPIs, Export FEC
-- Migration idempotente
-- ============================================

-- 1. Table des alertes actionnables
CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Type et sévérité
  type text NOT NULL CHECK (type IN (
    'facture_impayee', 'ecart_tva', 'transaction_anormale',
    'seuil_depasse', 'doublon_detecte', 'rapprochement_echoue',
    'point_mort_eleve', 'marge_faible', 'ca_baisse', 'tresorerie_basse'
  )),
  severite text NOT NULL CHECK (severite IN ('critical', 'warning', 'info')) DEFAULT 'info',

  -- Contenu
  titre text NOT NULL,
  description text NOT NULL,
  impact_financier numeric(12,2),

  -- Actions suggérées (JSON array)
  actions_suggerees jsonb DEFAULT '[]'::jsonb,

  -- Liens
  transaction_id uuid REFERENCES transactions(id) ON DELETE SET NULL,
  facture_id uuid REFERENCES factures(id) ON DELETE SET NULL,

  -- Statut
  statut text NOT NULL CHECK (statut IN ('nouvelle', 'vue', 'resolue', 'ignoree')) DEFAULT 'nouvelle',
  resolved_at timestamptz,
  notes text,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS pour alerts
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'alerts' AND policyname = 'alerts_user_policy') THEN
    CREATE POLICY alerts_user_policy ON alerts FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_alerts_user_statut ON alerts(user_id, statut);
CREATE INDEX IF NOT EXISTS idx_alerts_user_severite ON alerts(user_id, severite);

-- 2. Table des préférences dashboard
CREATE TABLE IF NOT EXISTS user_dashboard_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Configuration KPIs
  kpi_order jsonb DEFAULT '["breakEvenPoint","revenue","breakEvenDays","currentResult"]'::jsonb,
  visible_kpis jsonb DEFAULT '["breakEvenPoint","revenue","breakEvenDays","currentResult"]'::jsonb,

  -- Préférences additionnelles
  theme text DEFAULT 'default',

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Un seul enregistrement par utilisateur
  UNIQUE(user_id)
);

-- RLS pour user_dashboard_preferences
ALTER TABLE user_dashboard_preferences ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_dashboard_preferences' AND policyname = 'dashboard_prefs_user_policy') THEN
    CREATE POLICY dashboard_prefs_user_policy ON user_dashboard_preferences FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- 3. Table des insights/recommandations appliquées
CREATE TABLE IF NOT EXISTS applied_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  insight_key text NOT NULL, -- Clé unique de l'insight (ex: 'point_mort_eleve_2026-01')
  applied_at timestamptz DEFAULT now(),
  notes text,

  UNIQUE(user_id, insight_key)
);

-- RLS pour applied_insights
ALTER TABLE applied_insights ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'applied_insights' AND policyname = 'insights_user_policy') THEN
    CREATE POLICY insights_user_policy ON applied_insights FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- Trigger updated_at
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_alerts_updated_at') THEN
    CREATE TRIGGER set_alerts_updated_at BEFORE UPDATE ON alerts
      FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_dashboard_prefs_updated_at') THEN
    CREATE TRIGGER set_dashboard_prefs_updated_at BEFORE UPDATE ON user_dashboard_preferences
      FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
  END IF;
END $$;
