-- =============================================================
-- JobBeagle Migration 012 — Soft account deactivate
-- profiles.deactivated_at: when set, block analyze / checkout
-- =============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ NULL;

COMMENT ON COLUMN public.profiles.deactivated_at IS
  'When set, account is soft-deactivated (no analyze/checkout). Clear to reactivate.';

CREATE INDEX IF NOT EXISTS idx_profiles_deactivated_at
  ON public.profiles (deactivated_at)
  WHERE deactivated_at IS NOT NULL;
