-- Migration 012: User session limits per plan
-- Tracks concurrent device sessions to enforce Solo=1, Cabinet=5, Entreprise=∞

CREATE TABLE IF NOT EXISTS user_sessions (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token  TEXT        NOT NULL UNIQUE,  -- device-unique UUID (localStorage)
  last_active    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fast lookups
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id     ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_active ON user_sessions(last_active);

-- RLS: users manage only their own sessions
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own sessions" ON user_sessions;
CREATE POLICY "Users manage own sessions" ON user_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Update max_users to NULL for entreprise plan (NULL = unlimited)
-- Solo default = 1 (already set in 011), Cabinet = 5, Entreprise = NULL
ALTER TABLE user_profiles
  ALTER COLUMN max_users DROP NOT NULL;

-- Function to purge sessions inactive for > 20 minutes
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM user_sessions
  WHERE last_active < NOW() - INTERVAL '20 minutes';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Auto-purge via trigger on INSERT (cleanup stale rows for the same user)
CREATE OR REPLACE FUNCTION trigger_cleanup_user_sessions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM user_sessions
  WHERE user_id = NEW.user_id
    AND last_active < NOW() - INTERVAL '20 minutes';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS cleanup_on_session_insert ON user_sessions;
CREATE TRIGGER cleanup_on_session_insert
  AFTER INSERT ON user_sessions
  FOR EACH ROW EXECUTE FUNCTION trigger_cleanup_user_sessions();
