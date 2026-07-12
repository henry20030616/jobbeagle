-- =============================================================
-- Migration 010 — Unify terminology: job_fit_snapshot / interview_strategy_guide
-- =============================================================

-- 1. Profiles credit columns (rename from lite/full)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles'
      AND column_name = 'available_lite_credits'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles'
      AND column_name = 'available_job_fit_snapshot_credits'
  ) THEN
    ALTER TABLE public.profiles
      RENAME COLUMN available_lite_credits TO available_job_fit_snapshot_credits;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles'
      AND column_name = 'available_full_credits'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles'
      AND column_name = 'available_interview_strategy_guide_credits'
  ) THEN
    ALTER TABLE public.profiles
      RENAME COLUMN available_full_credits TO available_interview_strategy_guide_credits;
  END IF;
END $$;

-- Ensure columns exist even on fresh DBs that somehow skipped rename
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS available_job_fit_snapshot_credits INT NOT NULL DEFAULT 3;
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS available_interview_strategy_guide_credits INT NOT NULL DEFAULT 0;

-- 2. Report type values — drop check BEFORE rewriting rows
ALTER TABLE public.analysis_reports DROP CONSTRAINT IF EXISTS analysis_reports_report_type_check;

UPDATE public.analysis_reports
SET report_type = 'job_fit_snapshot'
WHERE report_type IS NULL OR report_type = 'lite';

UPDATE public.analysis_reports
SET report_type = 'interview_strategy_guide'
WHERE report_type = 'full';

ALTER TABLE public.analysis_reports
  ADD CONSTRAINT analysis_reports_report_type_check
  CHECK (report_type IN (
    'job_fit_snapshot',
    'interview_strategy_guide',
    'lite',
    'full'
  ));

ALTER TABLE public.analysis_reports
  ALTER COLUMN report_type SET DEFAULT 'job_fit_snapshot';

-- 3. Orders plan_type — allow new names (keep legacy)
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_plan_type_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_plan_type_check CHECK (
  plan_type IN (
    'basic_overage',
    'premium_report',
    'monthly_subscription',
    'single_lite',
    'single_full',
    'standard_subscription',
    'advanced_subscription',
    'single_job_fit_snapshot',
    'single_interview_strategy_guide'
  )
);

-- 4. RPCs — new names + legacy wrappers
CREATE OR REPLACE FUNCTION public.decrement_job_fit_snapshot_credit(p_user_id UUID)
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
  SET available_job_fit_snapshot_credits = available_job_fit_snapshot_credits - 1,
      updated_at = NOW()
  WHERE id = p_user_id AND available_job_fit_snapshot_credits > 0
  RETURNING available_job_fit_snapshot_credits INTO remaining;

  IF NOT FOUND THEN RETURN -1; END IF;
  RETURN remaining;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_interview_strategy_guide_credit(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  remaining INTEGER;
BEGIN
  UPDATE profiles
  SET available_interview_strategy_guide_credits = available_interview_strategy_guide_credits - 1,
      updated_at = NOW()
  WHERE id = p_user_id AND available_interview_strategy_guide_credits > 0
  RETURNING available_interview_strategy_guide_credits INTO remaining;

  IF NOT FOUND THEN RETURN -1; END IF;
  RETURN remaining;
END;
$$;

-- Legacy aliases call new functions
CREATE OR REPLACE FUNCTION public.decrement_lite_credit(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.decrement_job_fit_snapshot_credit(p_user_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_full_credit(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.decrement_interview_strategy_guide_credit(p_user_id);
END;
$$;

DROP FUNCTION IF EXISTS public.increment_profile_credits(UUID, INT, INT);

CREATE OR REPLACE FUNCTION public.increment_profile_credits(
  p_user_id UUID,
  p_job_fit_snapshot INT DEFAULT 0,
  p_interview_strategy_guide INT DEFAULT 0
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
  SET
    available_job_fit_snapshot_credits =
      available_job_fit_snapshot_credits + GREATEST(p_job_fit_snapshot, 0),
    available_interview_strategy_guide_credits =
      available_interview_strategy_guide_credits + GREATEST(p_interview_strategy_guide, 0),
    updated_at = NOW()
  WHERE id = p_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.decrement_job_fit_snapshot_credit(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.decrement_job_fit_snapshot_credit(UUID) TO service_role;
REVOKE ALL ON FUNCTION public.decrement_interview_strategy_guide_credit(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.decrement_interview_strategy_guide_credit(UUID) TO service_role;
REVOKE ALL ON FUNCTION public.decrement_lite_credit(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.decrement_lite_credit(UUID) TO service_role;
REVOKE ALL ON FUNCTION public.decrement_full_credit(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.decrement_full_credit(UUID) TO service_role;
REVOKE ALL ON FUNCTION public.increment_profile_credits(UUID, INT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_profile_credits(UUID, INT, INT) TO service_role;
