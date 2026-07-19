-- Subscribers must burn monthly Snapshot / Guide balances (no unlimited 9999 bypass).
-- Aligns RPC with marketed Standard (100+5) / Advanced (300+15) allowances.

CREATE OR REPLACE FUNCTION public.decrement_job_fit_snapshot_credit(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  remaining INTEGER;
BEGIN
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

-- Keep legacy wrappers pointing at the fixed functions
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

REVOKE ALL ON FUNCTION public.decrement_job_fit_snapshot_credit(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.decrement_job_fit_snapshot_credit(UUID) TO service_role;
REVOKE ALL ON FUNCTION public.decrement_interview_strategy_guide_credit(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.decrement_interview_strategy_guide_credit(UUID) TO service_role;
REVOKE ALL ON FUNCTION public.decrement_lite_credit(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.decrement_lite_credit(UUID) TO service_role;
REVOKE ALL ON FUNCTION public.decrement_full_credit(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.decrement_full_credit(UUID) TO service_role;
