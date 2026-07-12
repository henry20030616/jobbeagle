-- =============================================================
-- JobBeagle Migration 011 — Lock profile entitlement mutations
-- Prevent authenticated clients from minting / editing credits.
-- Credits / tier changes: service_role + SECURITY DEFINER RPCs only.
-- =============================================================

-- 1) Remove broad client UPDATE (previously allowed any column on own row)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Optional: display-only self-update (no entitlement columns)
DROP POLICY IF EXISTS "Users can update own profile display" ON public.profiles;
CREATE POLICY "Users can update own profile display"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 2) Column privileges: authenticated/anon cannot UPDATE entitlement columns
REVOKE UPDATE ON TABLE public.profiles FROM anon, authenticated;

GRANT UPDATE (
  full_name,
  avatar_url,
  updated_at
) ON TABLE public.profiles TO authenticated;

-- Keep SELECT for own-row RLS
GRANT SELECT ON TABLE public.profiles TO authenticated;

-- service_role retains full DML (Supabase default); re-assert explicitly
GRANT ALL ON TABLE public.profiles TO service_role;

-- 3) Defense-in-depth trigger: block entitlement changes unless server role.
-- Must NOT be SECURITY DEFINER — that would make current_user always postgres
-- and bypass the check. Use auth.role() / session_user instead.
CREATE OR REPLACE FUNCTION public.protect_profile_entitlements()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  is_server BOOLEAN;
BEGIN
  is_server :=
    COALESCE(auth.role(), '') = 'service_role'
    OR COALESCE(current_setting('request.jwt.claim.role', true), '') = 'service_role'
    OR session_user IN ('postgres', 'supabase_admin');

  IF is_server THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.membership_tier IS DISTINCT FROM OLD.membership_tier
       OR NEW.available_job_fit_snapshot_credits IS DISTINCT FROM OLD.available_job_fit_snapshot_credits
       OR NEW.available_interview_strategy_guide_credits IS DISTINCT FROM OLD.available_interview_strategy_guide_credits
       OR NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id
       OR NEW.stripe_subscription_id IS DISTINCT FROM OLD.stripe_subscription_id
       OR NEW.device_fingerprint IS DISTINCT FROM OLD.device_fingerprint
       OR NEW.referral_code IS DISTINCT FROM OLD.referral_code
    THEN
      RAISE EXCEPTION 'profile entitlements are server-managed only'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_block_client_credit_writes ON public.profiles;
DROP FUNCTION IF EXISTS public.profiles_block_client_credit_writes();

DROP TRIGGER IF EXISTS trg_protect_profile_entitlements ON public.profiles;
CREATE TRIGGER trg_protect_profile_entitlements
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.protect_profile_entitlements();

-- 4) Re-assert credit RPCs are service_role-only
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'decrement_job_fit_snapshot_credit'
  ) THEN
    REVOKE ALL ON FUNCTION public.decrement_job_fit_snapshot_credit(UUID) FROM PUBLIC;
    GRANT EXECUTE ON FUNCTION public.decrement_job_fit_snapshot_credit(UUID) TO service_role;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'decrement_interview_strategy_guide_credit'
  ) THEN
    REVOKE ALL ON FUNCTION public.decrement_interview_strategy_guide_credit(UUID) FROM PUBLIC;
    GRANT EXECUTE ON FUNCTION public.decrement_interview_strategy_guide_credit(UUID) TO service_role;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'decrement_lite_credit'
  ) THEN
    REVOKE ALL ON FUNCTION public.decrement_lite_credit(UUID) FROM PUBLIC;
    GRANT EXECUTE ON FUNCTION public.decrement_lite_credit(UUID) TO service_role;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'decrement_full_credit'
  ) THEN
    REVOKE ALL ON FUNCTION public.decrement_full_credit(UUID) FROM PUBLIC;
    GRANT EXECUTE ON FUNCTION public.decrement_full_credit(UUID) TO service_role;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'increment_profile_credits'
      AND pg_get_function_identity_arguments(p.oid) = 'uuid, integer, integer'
  ) THEN
    REVOKE ALL ON FUNCTION public.increment_profile_credits(UUID, INT, INT) FROM PUBLIC;
    GRANT EXECUTE ON FUNCTION public.increment_profile_credits(UUID, INT, INT) TO service_role;
  END IF;
END;
$$;
