-- ============================================================
-- Jobbeagle DB Migration 001
-- 執行方式：Supabase Dashboard → SQL Editor → 貼上執行
-- ============================================================

-- 1. shorts_videos：加入影片來源類型欄位
ALTER TABLE shorts_videos
  ADD COLUMN IF NOT EXISTS video_source_type TEXT DEFAULT 'upload';

-- 2. shorts_videos：加入觀看次數欄位
ALTER TABLE shorts_videos
  ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0 NOT NULL;

-- 3. 用於原子性遞增觀看次數的 Postgres 函式（避免 race condition）
CREATE OR REPLACE FUNCTION increment_video_view_count(p_video_id UUID)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE shorts_videos SET view_count = view_count + 1 WHERE id = p_video_id;
$$;

-- 4. analysis_reports 資料表（儲存 P1 分析報告供歷史查閱）
CREATE TABLE IF NOT EXISTS analysis_reports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_title     TEXT,
  job_description_preview TEXT,
  score         INTEGER,
  report        JSONB NOT NULL,
  language      TEXT DEFAULT 'zh',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 5. analysis_reports RLS
ALTER TABLE analysis_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own analysis reports" ON analysis_reports;
CREATE POLICY "Users can view own analysis reports"
  ON analysis_reports FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own analysis reports" ON analysis_reports;
CREATE POLICY "Users can insert own analysis reports"
  ON analysis_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 6. analysis_reports index
CREATE INDEX IF NOT EXISTS idx_analysis_reports_user_created
  ON analysis_reports (user_id, created_at DESC);

-- 7. usage_limits index（可選，僅效能優化；若 usage_limits 欄位名不同可跳過）
-- CREATE INDEX IF NOT EXISTS idx_usage_limits_ip_date
--   ON usage_limits (ip_hash, date);
