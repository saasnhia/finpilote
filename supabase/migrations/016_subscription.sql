-- ============================================================
-- 016 : Abonnement annuel SaaS (Solo / Cabinet / Entreprise)
-- ============================================================
-- Ajoute les colonnes subscription_* à user_profiles.
-- subscription_status DEFAULT 'inactive' → accès bloqué par défaut.
-- Pour activer : UPDATE user_profiles SET subscription_status = 'active' ...
-- ============================================================

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS subscription_status TEXT
    NOT NULL DEFAULT 'inactive'
    CHECK (subscription_status IN ('active', 'inactive', 'trial', 'cancelled'));

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS subscription_plan TEXT
    CHECK (subscription_plan IN ('solo', 'cabinet', 'entreprise'));

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ;

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Index pour les checks de souscription en middleware
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription
  ON public.user_profiles(id, subscription_status);
