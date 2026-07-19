-- Career Context floors for fit + offer targeting (Spec gap B7/B8)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS career_context jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.profiles.career_context IS
  'User career floors: target_level, location_or_remote, work_auth, target_tc, walk_away_tc, non_negotiables, signature_strengths';
