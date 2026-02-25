-- ============================================================
-- Migration 020 — Renommage des plans (solo→starter, entreprise→pro)
-- ============================================================

-- 1. Temporairement élargir la contrainte pour accepter les deux nommages
ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_plan_check;

-- 2. Renommer les valeurs existantes
UPDATE public.user_profiles SET plan = 'starter' WHERE plan = 'solo';
UPDATE public.user_profiles SET plan = 'pro'     WHERE plan = 'entreprise';

-- 3. Mettre à jour la contrainte avec les nouvelles valeurs
ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_plan_check
  CHECK (plan IN ('starter', 'cabinet', 'pro'));

-- 4. Mettre à jour la valeur par défaut
ALTER TABLE public.user_profiles
  ALTER COLUMN plan SET DEFAULT 'starter';

-- 5. Mettre à jour la limite de factures pour starter (300 au lieu de 500)
UPDATE public.user_profiles
  SET factures_limit = 300
  WHERE plan = 'starter' AND factures_limit = 500;

-- 6. Mettre à jour le trigger de création de compte
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, plan, factures_limit, max_users)
  VALUES (NEW.id, 'starter', 300, 1)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- END Migration 020
-- ============================================================
