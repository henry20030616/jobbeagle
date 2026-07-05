-- =============================================================
-- Jobbeagle DB Migration 004 — PLG Monetization & Growth
-- Run in Supabase Dashboard → SQL Editor
-- =============================================================

-- 0. usage_limits
CREATE TABLE IF NOT EXISTS usage_limits (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash     TEXT NOT NULL,
  date        DATE NOT NULL,
  count       INTEGER NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (ip_hash, date)
);

CREATE INDEX IF NOT EXISTS idx_usage_limits_ip_date
  ON usage_limits (ip_hash, date);

ALTER TABLE usage_limits ENABLE ROW LEVEL SECURITY;

-- 1. analysis_reports.is_premium
ALTER TABLE analysis_reports
  ADD COLUMN IF NOT EXISTS is_premium BOOLEAN NOT NULL DEFAULT false;

-- 2. orders
CREATE TABLE IF NOT EXISTS orders (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_id          UUID REFERENCES analysis_reports(id) ON DELETE SET NULL,
  plan_type          TEXT NOT NULL,
  amount             NUMERIC(10, 2) NOT NULL,
  currency           TEXT NOT NULL DEFAULT 'usd',
  status             VARCHAR(32) NOT NULL DEFAULT 'pending',
  stripe_session_id  TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  metadata           JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT orders_status_check CHECK (
    status IN ('pending', 'succeeded', 'failed', 'canceled', 'refunded')
  ),
  CONSTRAINT orders_plan_type_check CHECK (
    plan_type IN ('basic_overage', 'premium_report', 'monthly_subscription')
  )
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_report_id ON orders (report_id) WHERE report_id IS NOT NULL;

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid() = user_id);

-- 3. user_rewards
CREATE TABLE IF NOT EXISTS user_rewards (
  user_id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  bonus_credits   INTEGER NOT NULL DEFAULT 0,
  referral_code   TEXT UNIQUE,
  referred_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_rewards_bonus_nonneg CHECK (bonus_credits >= 0)
);

ALTER TABLE user_rewards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own rewards" ON user_rewards;
CREATE POLICY "Users can view own rewards" ON user_rewards FOR SELECT USING (auth.uid() = user_id);

-- 4. decrement_bonus_credit RPC
CREATE OR REPLACE FUNCTION public.decrement_bonus_credit(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  remaining INTEGER;
BEGIN
  UPDATE user_rewards
  SET bonus_credits = bonus_credits - 1
  WHERE user_id = p_user_id AND bonus_credits > 0
  RETURNING bonus_credits INTO remaining;
  IF NOT FOUND THEN RETURN -1; END IF;
  RETURN remaining;
END;
$$;

REVOKE ALL ON FUNCTION public.decrement_bonus_credit(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.decrement_bonus_credit(UUID) TO service_role;
