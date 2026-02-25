-- ============================================================
-- Migration 019 — Import universel intelligent (Feature 3)
-- Table d'historique des imports
-- ============================================================

CREATE TABLE IF NOT EXISTS public.import_history (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name        TEXT NOT NULL,
  file_size        INTEGER,
  detected_type    TEXT NOT NULL DEFAULT 'unknown'
                   CHECK (detected_type IN (
                     'facture_ocr', 'releve_bancaire',
                     'fec_import', 'excel_batch', 'unknown'
                   )),
  status           TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'processing', 'completed', 'error')),
  processed_count  INTEGER NOT NULL DEFAULT 0,
  error_count      INTEGER NOT NULL DEFAULT 0,
  errors           JSONB NOT NULL DEFAULT '[]',
  result_summary   JSONB NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_import_history_user_date
  ON public.import_history(user_id, created_at DESC);

ALTER TABLE public.import_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "import_history_select_own"
  ON public.import_history FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "import_history_insert_own"
  ON public.import_history FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "import_history_update_own"
  ON public.import_history FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- END Migration 019
-- ============================================================
