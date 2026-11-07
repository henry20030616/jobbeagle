-- Atomic order fulfill: lock row → grant credits → mark succeeded in one transaction.
-- Prevents paypal-return + webhook from double-incrementing credits.

CREATE OR REPLACE FUNCTION public.claim_and_fulfill_order_entitlements(
  p_order_id UUID,
  p_user_id UUID,
  p_job_fit_snapshot INT DEFAULT 0,
  p_interview_strategy_guide INT DEFAULT 0,
  p_membership_tier TEXT DEFAULT NULL,
  p_external_payment_id TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  st TEXT;
BEGIN
  SELECT status INTO st
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN 'missing';
  END IF;

  IF st = 'succeeded' THEN
    RETURN 'idempotent';
  END IF;

  IF GREATEST(COALESCE(p_job_fit_snapshot, 0), 0) > 0
     OR GREATEST(COALESCE(p_interview_strategy_guide, 0), 0) > 0 THEN
    UPDATE public.profiles
    SET
      available_job_fit_snapshot_credits =
        available_job_fit_snapshot_credits + GREATEST(COALESCE(p_job_fit_snapshot, 0), 0),
      available_interview_strategy_guide_credits =
        available_interview_strategy_guide_credits + GREATEST(COALESCE(p_interview_strategy_guide, 0), 0),
      updated_at = NOW()
    WHERE id = p_user_id;
  END IF;

  IF p_membership_tier IS NOT NULL
     AND p_membership_tier IN ('standard_sub', 'advanced_sub') THEN
    UPDATE public.profiles
    SET
      membership_tier = p_membership_tier,
      updated_at = NOW()
    WHERE id = p_user_id;
  END IF;

  UPDATE public.orders
  SET
    status = 'succeeded',
    stripe_payment_intent_id = COALESCE(p_external_payment_id, stripe_payment_intent_id),
    updated_at = NOW()
  WHERE id = p_order_id;

  RETURN 'fulfilled';
END;
$$;

REVOKE ALL ON FUNCTION public.claim_and_fulfill_order_entitlements(UUID, UUID, INT, INT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_and_fulfill_order_entitlements(UUID, UUID, INT, INT, TEXT, TEXT) TO service_role;
