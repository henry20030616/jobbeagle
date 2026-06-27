-- ============================================================
-- Jobbeagle DB Patch 002 — 重建 analysis_reports（正確 schema）
-- 舊表格使用 analysis_data NOT NULL（錯誤），此 patch 強制重建
-- 執行方式：Supabase Dashboard → SQL Editor → 貼上執行
-- ============================================================

DROP TABLE IF EXISTS analysis_reports CASCADE;

CREATE TABLE analysis_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_title TEXT,
  job_description_preview TEXT,
  score INTEGER,
  report JSONB NOT NULL,
  language TEXT DEFAULT 'zh',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE analysis_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own analysis reports" ON analysis_reports;
CREATE POLICY "Users can view own analysis reports"
  ON analysis_reports FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own analysis reports" ON analysis_reports;
CREATE POLICY "Users can insert own analysis reports"
  ON analysis_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_analysis_reports_user_created
  ON analysis_reports (user_id, created_at DESC);
