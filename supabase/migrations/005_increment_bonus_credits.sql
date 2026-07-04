-- Increment bonus_credits (checkout webhook: basic_overage +1, monthly +30)
CREATE OR REPLACE FUNCTION public.increment_bonus_credits(p_user_id UUID, p_amount INT DEFAULT 1)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_total INTEGER;
BEGIN
  IF p_amount IS NULL OR p_amount < 1 THEN
    RAISE EXCEPTION 'p_amount must be >= 1';
  END IF;

  INSERT INTO public.user_rewards (user_id, bonus_credits)
  VALUES (p_user_id, p_amount)
  ON CONFLICT (user_id) DO UPDATE
  SET bonus_credits = public.user_rewards.bonus_credits + EXCLUDED.bonus_credits
  RETURNING bonus_credits INTO new_total;

  RETURN new_total;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_bonus_credits(UUID, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_bonus_credits(UUID, INT) TO service_role;
