-- ============================================
-- Jobbeagle Supabase Database Schema
-- ============================================
-- 完整版本 - 包含所有必要的表、索引、RLS 策略
-- 请在 Supabase SQL Editor 中执行此脚本
-- ============================================

-- ============================================
-- 1. 分析報告表 (analysis_reports)
-- ============================================
-- 存储 AI 生成的分析报告
CREATE TABLE IF NOT EXISTS analysis_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  job_title TEXT,
  job_description TEXT,
  resume_file_name TEXT,
  resume_type TEXT CHECK (resume_type IN ('text', 'file')),
  analysis_data JSONB NOT NULL,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. 履歷歷史表 (resume_history)
-- ============================================
-- 存储用户上传的履历文件
CREATE TABLE IF NOT EXISTS resume_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('text', 'file')),
  content TEXT NOT NULL,
  mime_type TEXT,
  file_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. 創建索引 (Indexes)
-- ============================================
-- 提升查询性能

-- analysis_reports 索引
CREATE INDEX IF NOT EXISTS idx_analysis_reports_user_id ON analysis_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_reports_created_at ON analysis_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analysis_reports_user_created ON analysis_reports(user_id, created_at DESC);

-- resume_history 索引
CREATE INDEX IF NOT EXISTS idx_resume_history_user_id ON resume_history(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_history_created_at ON resume_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resume_history_user_created ON resume_history(user_id, created_at DESC);

-- ============================================
-- 4. 啟用行級安全 (Row Level Security)
-- ============================================
ALTER TABLE analysis_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_history ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. 刪除舊策略（如果存在）
-- ============================================
-- 先删除可能存在的旧策略，避免冲突
DROP POLICY IF EXISTS "Allow all operations on analysis_reports" ON analysis_reports;
DROP POLICY IF EXISTS "Allow all operations on resume_history" ON resume_history;
DROP POLICY IF EXISTS "Users can only see their own reports" ON analysis_reports;
DROP POLICY IF EXISTS "Users can only insert their own reports" ON analysis_reports;
DROP POLICY IF EXISTS "Users can only update their own reports" ON analysis_reports;
DROP POLICY IF EXISTS "Users can only delete their own reports" ON analysis_reports;
DROP POLICY IF EXISTS "Users can only see their own resume history" ON resume_history;
DROP POLICY IF EXISTS "Users can only insert their own resume history" ON resume_history;
DROP POLICY IF EXISTS "Users can only update their own resume history" ON resume_history;
DROP POLICY IF EXISTS "Users can only delete their own resume history" ON resume_history;

-- ============================================
-- 6. 創建 RLS 策略 (Policies)
-- ============================================

-- analysis_reports 策略
-- SELECT: 用户只能查看自己的报告，或未登录用户创建的报告（user_id IS NULL）
CREATE POLICY "Users can select their own reports" ON analysis_reports
  FOR SELECT
  USING (
    auth.uid() = user_id 
    OR user_id IS NULL
  );

-- INSERT: 用户只能插入自己的报告
CREATE POLICY "Users can insert their own reports" ON analysis_reports
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    OR user_id IS NULL
  );

-- UPDATE: 用户只能更新自己的报告
CREATE POLICY "Users can update their own reports" ON analysis_reports
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: 用户只能删除自己的报告
CREATE POLICY "Users can delete their own reports" ON analysis_reports
  FOR DELETE
  USING (auth.uid() = user_id);

-- resume_history 策略
-- SELECT: 用户只能查看自己的履历历史
CREATE POLICY "Users can select their own resume history" ON resume_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: 用户只能插入自己的履历历史
CREATE POLICY "Users can insert their own resume history" ON resume_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: 用户只能更新自己的履历历史
CREATE POLICY "Users can update their own resume history" ON resume_history
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: 用户只能删除自己的履历历史
CREATE POLICY "Users can delete their own resume history" ON resume_history
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 7. 創建更新時間觸發器 (Optional)
-- ============================================
-- 自動更新 updated_at 欄位
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 為 analysis_reports 創建觸發器
DROP TRIGGER IF EXISTS update_analysis_reports_updated_at ON analysis_reports;
CREATE TRIGGER update_analysis_reports_updated_at
  BEFORE UPDATE ON analysis_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. 驗證腳本
-- ============================================
-- 執行後可以運行以下查詢驗證：

-- 檢查表是否存在
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('analysis_reports', 'resume_history');

-- 檢查 RLS 是否啟用
-- SELECT tablename, rowsecurity FROM pg_tables 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('analysis_reports', 'resume_history');

-- 檢查策略是否存在
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename IN ('analysis_reports', 'resume_history');

-- ============================================
-- 完成！
-- ============================================
