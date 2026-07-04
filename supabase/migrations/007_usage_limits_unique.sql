-- Ensure usage_limits upsert works (onConflict: ip_hash,date)
CREATE TABLE IF NOT EXISTS usage_limits (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash     TEXT NOT NULL,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  count       INTEGER NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'usage_limits' AND column_name = 'date'
  ) THEN
    ALTER TABLE usage_limits ADD COLUMN date DATE NOT NULL DEFAULT CURRENT_DATE;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_usage_limits_ip_hash_date
  ON usage_limits (ip_hash, date);
