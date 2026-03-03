-- ============================================================
-- 027 : Onboarding wizard & Settings — colonnes supplémentaires
-- user_profiles : infos entreprise, profil, notifications
-- ============================================================

-- Informations entreprise
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS raison_sociale TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS forme_juridique TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS siret TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS tva_numero TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS regime_tva TEXT DEFAULT 'franchise';
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS adresse_siege TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS code_ape TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS iban TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS couleur_principale TEXT DEFAULT '#22D3A5';
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS mentions_legales TEXT;

-- Informations cabinet
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS nb_dossiers_cabinet INTEGER DEFAULT 0;

-- Suivi onboarding par étape
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS onboarding_step INTEGER NOT NULL DEFAULT 1;

-- Informations personnelles
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS prenom TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS nom TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Europe/Paris';

-- Préférences notifications
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS notif_email_relances BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS notif_email_factures BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS notif_email_digest TEXT NOT NULL DEFAULT 'weekly';

-- Contrainte CHECK séparée pour notif_email_digest
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_profiles_notif_email_digest_check'
  ) THEN
    ALTER TABLE public.user_profiles
      ADD CONSTRAINT user_profiles_notif_email_digest_check
      CHECK (notif_email_digest IN ('never', 'daily', 'weekly', 'monthly'));
  END IF;
END $$;

-- Index pour les paramètres settings
CREATE INDEX IF NOT EXISTS idx_user_profiles_settings
  ON public.user_profiles(id, raison_sociale, prenom, nom);
