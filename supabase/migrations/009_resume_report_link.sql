-- =============================================================
-- JobBeagle Migration 009 — Resume versions linked to reports
-- Auto-archive resumes on analyze; soft-delete; 90-day single-drop purge
-- =============================================================

-- 1. Ensure resume_history exists (legacy installs)
CREATE TABLE IF NOT EXISTS public.resume_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'file')),
  content TEXT NOT NULL,
  mime_type TEXT,
  file_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.resume_history ENABLE ROW LEVEL SECURITY;

-- 2. Resume versioning columns
ALTER TABLE public.resume_history
  ADD COLUMN IF NOT EXISTS content_hash TEXT,
  ADD COLUMN IF NOT EXISTS label TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual_save',
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE UNIQUE INDEX IF NOT EXISTS idx_resume_history_user_hash
  ON public.resume_history (user_id, content_hash)
  WHERE content_hash IS NOT NULL AND content_hash <> '';

CREATE INDEX IF NOT EXISTS idx_resume_history_user_active
  ON public.resume_history (user_id, last_used_at DESC NULLS LAST)
  WHERE deleted_at IS NULL;

-- Soft-delete: users update own rows; keep delete for hard-remove if needed
DROP POLICY IF EXISTS "Users can select their own resume history" ON public.resume_history;
DROP POLICY IF EXISTS "Users can only see their own resume history" ON public.resume_history;
CREATE POLICY "Users can select their own resume history"
  ON public.resume_history FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own resume history" ON public.resume_history;
DROP POLICY IF EXISTS "Users can only insert their own resume history" ON public.resume_history;
CREATE POLICY "Users can insert their own resume history"
  ON public.resume_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own resume history" ON public.resume_history;
CREATE POLICY "Users can update their own resume history"
  ON public.resume_history FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own resume history" ON public.resume_history;
DROP POLICY IF EXISTS "Users can only delete their own resume history" ON public.resume_history;
CREATE POLICY "Users can delete their own resume history"
  ON public.resume_history FOR DELETE
  USING (auth.uid() = user_id);

-- 3. Link reports → resume versions
ALTER TABLE public.analysis_reports
  ADD COLUMN IF NOT EXISTS resume_id UUID REFERENCES public.resume_history(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_analysis_reports_resume_id
  ON public.analysis_reports (resume_id)
  WHERE resume_id IS NOT NULL;

-- 4. Free single-drop retention: 30 → 90 days
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
    AND created_at < NOW() - INTERVAL '90 days';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

REVOKE ALL ON FUNCTION public.purge_expired_single_drop_reports() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purge_expired_single_drop_reports() TO service_role;
