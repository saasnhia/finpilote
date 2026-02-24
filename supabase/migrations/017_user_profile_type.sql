-- ============================================================
-- 017 : Profil utilisateur adaptatif (cabinet / entreprise)
-- + tracking onboarding
-- ============================================================

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS profile_type TEXT
    NOT NULL DEFAULT 'cabinet'
    CHECK (profile_type IN ('cabinet', 'entreprise'));

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN
    NOT NULL DEFAULT false;

-- Les utilisateurs existants ne doivent pas repasser par l'onboarding
-- Tous les profils déjà créés → onboarding_completed = true
UPDATE public.user_profiles
  SET onboarding_completed = true
  WHERE onboarding_completed = false;

-- Index pour les checks middleware (subscription + onboarding)
CREATE INDEX IF NOT EXISTS idx_user_profiles_onboarding
  ON public.user_profiles(id, subscription_status, onboarding_completed, profile_type);
