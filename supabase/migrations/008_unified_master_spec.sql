-- =============================================================
-- JobBeagle Migration 008 — Unified Master Production Spec (2026)
-- profiles, referrals, lite/full credits, report schema extensions
-- =============================================================

-- 1. User profiles (entitlements + Stripe)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  full_name TEXT,
  avatar_url TEXT,
  membership_tier TEXT NOT NULL DEFAULT 'free'
    CHECK (membership_tier IN ('free', 'standard_sub', 'advanced_sub')),
  available_lite_credits INT NOT NULL DEFAULT 3,
  available_full_credits INT NOT NULL DEFAULT 0,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  device_fingerprint TEXT,
  referral_code TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  CONSTRAINT profiles_lite_credits_nonneg CHECK (available_lite_credits >= 0),
  CONSTRAINT profiles_full_credits_nonneg CHECK (available_full_credits >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_fingerprint
  ON public.profiles (device_fingerprint)
  WHERE device_fingerprint IS NOT NULL AND device_fingerprint <> '';

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer
  ON public.profiles (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 2. Referrals (activation milestone)
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  referee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  is_activated BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer
  ON public.referrals (referrer_id);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view referrals they are part of" ON public.referrals;
CREATE POLICY "Users can view referrals they are part of"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

-- 3. Extend analysis_reports for lite/full spec
ALTER TABLE public.analysis_reports
  ADD COLUMN IF NOT EXISTS linkedin_job_id TEXT,
  ADD COLUMN IF NOT EXISTS company_name TEXT,
  ADD COLUMN IF NOT EXISTS raw_jd_text TEXT,
  ADD COLUMN IF NOT EXISTS resume_snapshot_text TEXT,
  ADD COLUMN IF NOT EXISTS report_type TEXT DEFAULT 'lite'
    CHECK (report_type IN ('lite', 'full')),
  ADD COLUMN IF NOT EXISTS is_single_drop BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS report_json JSONB;

-- Backfill report_json from legacy report column
UPDATE public.analysis_reports
SET report_json = report
WHERE report_json IS NULL AND report IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reports_job_user
  ON public.analysis_reports (linkedin_job_id, user_id)
  WHERE linkedin_job_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reports_single_drop_cleanup
  ON public.analysis_reports (is_single_drop, created_at)
  WHERE is_single_drop = TRUE;

-- 4. Update orders plan_type constraint
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_plan_type_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_plan_type_check CHECK (
  plan_type IN (
    'basic_overage',
    'premium_report',
    'monthly_subscription',
    'single_lite',
    'single_full',
    'standard_subscription',
    'advanced_subscription'
  )
);

-- 5. RPC: decrement lite credit
CREATE OR REPLACE FUNCTION public.decrement_lite_credit(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  remaining INTEGER;
  tier TEXT;
BEGIN
  SELECT membership_tier INTO tier FROM profiles WHERE id = p_user_id;
  IF tier IN ('standard_sub', 'advanced_sub') THEN
    RETURN 9999;
  END IF;

  UPDATE profiles
  SET available_lite_credits = available_lite_credits - 1,
      updated_at = NOW()
  WHERE id = p_user_id AND available_lite_credits > 0
  RETURNING available_lite_credits INTO remaining;

  IF NOT FOUND THEN RETURN -1; END IF;
  RETURN remaining;
END;
$$;

REVOKE ALL ON FUNCTION public.decrement_lite_credit(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.decrement_lite_credit(UUID) TO service_role;

-- 6. RPC: decrement full credit
CREATE OR REPLACE FUNCTION public.decrement_full_credit(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  remaining INTEGER;
BEGIN
  UPDATE profiles
  SET available_full_credits = available_full_credits - 1,
      updated_at = NOW()
  WHERE id = p_user_id AND available_full_credits > 0
  RETURNING available_full_credits INTO remaining;

  IF NOT FOUND THEN RETURN -1; END IF;
  RETURN remaining;
END;
$$;

REVOKE ALL ON FUNCTION public.decrement_full_credit(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.decrement_full_credit(UUID) TO service_role;

-- 7. RPC: add credits (purchases / referrals)
CREATE OR REPLACE FUNCTION public.increment_profile_credits(
  p_user_id UUID,
  p_lite INT DEFAULT 0,
  p_full INT DEFAULT 0
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
  SET
    available_lite_credits = available_lite_credits + GREATEST(p_lite, 0),
    available_full_credits = available_full_credits + GREATEST(p_full, 0),
    updated_at = NOW()
  WHERE id = p_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_profile_credits(UUID, INT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_profile_credits(UUID, INT, INT) TO service_role;

-- 8. RPC: activate referral milestone (+1 lite to referrer)
CREATE OR REPLACE FUNCTION public.activate_referral_milestone(p_referee_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ref_row RECORD;
BEGIN
  SELECT * INTO ref_row
  FROM referrals
  WHERE referee_id = p_referee_id AND is_activated = FALSE
  LIMIT 1;

  IF NOT FOUND THEN RETURN FALSE; END IF;

  UPDATE referrals SET is_activated = TRUE WHERE id = ref_row.id;

  PERFORM increment_profile_credits(ref_row.referrer_id, 1, 0);
  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.activate_referral_milestone(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.activate_referral_milestone(UUID) TO service_role;

-- 9. RPC: hard delete expired single-drop reports (CCPA)
CREATE OR REPLACE FUNCTION public.purge_expired_single_drop_reports()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM analysis_reports
  WHERE is_single_drop = TRUE
    AND created_at < NOW() - INTERVAL '30 days';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

REVOKE ALL ON FUNCTION public.purge_expired_single_drop_reports() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purge_expired_single_drop_reports() TO service_role;

-- 10. Auto-create profile on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code TEXT;
BEGIN
  code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  INSERT INTO public.profiles (id, full_name, avatar_url, referral_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url',
    code
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();
