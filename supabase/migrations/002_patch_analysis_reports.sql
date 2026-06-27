-- ============================================================
-- Jobbeagle DB Patch 002
-- 修復 analysis_reports 表缺失欄位（因 001 的 CREATE TABLE IF NOT EXISTS 被跳過）
-- 執行方式：Supabase Dashboard → SQL Editor → 貼上執行
-- ============================================================

-- 補上缺失的欄位（IF NOT EXISTS 保證重複執行無副作用）
ALTER TABLE analysis_reports
  ADD COLUMN IF NOT EXISTS report JSONB;

ALTER TABLE analysis_reports
  ADD COLUMN IF NOT EXISTS job_description_preview TEXT;

ALTER TABLE analysis_reports
  ADD COLUMN IF NOT EXISTS job_title TEXT;

ALTER TABLE analysis_reports
  ADD COLUMN IF NOT EXISTS score INTEGER;

ALTER TABLE analysis_reports
  ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'zh';

-- 確保 RLS 已啟用
ALTER TABLE analysis_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own analysis reports" ON analysis_reports;
CREATE POLICY "Users can view own analysis reports"
  ON analysis_reports FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own analysis reports" ON analysis_reports;
CREATE POLICY "Users can insert own analysis reports"
  ON analysis_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 補建 index（IF NOT EXISTS 保證安全）
CREATE INDEX IF NOT EXISTS idx_analysis_reports_user_created
  ON analysis_reports (user_id, created_at DESC);
