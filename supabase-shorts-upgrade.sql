-- ============================================================
-- Jobbeagle Shorts Upgrade Migration
-- 在 Supabase SQL Editor 執行此檔案
-- ============================================================

-- 1. 追蹤企業 (followed_companies)
CREATE TABLE IF NOT EXISTS followed_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, company_name)
);
ALTER TABLE followed_companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own follows" ON followed_companies;
CREATE POLICY "Users manage own follows" ON followed_companies
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. 儲存職缺 (saved_jobs)
CREATE TABLE IF NOT EXISTS saved_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id TEXT NOT NULL,
  job_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, job_id)
);
ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own saved jobs" ON saved_jobs;
CREATE POLICY "Users manage own saved jobs" ON saved_jobs
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. 企業帳號資料 (company_profiles)
CREATE TABLE IF NOT EXISTS company_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  company_name TEXT NOT NULL,
  logo_url TEXT,
  description TEXT,
  website TEXT,
  contact_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Company profiles public read" ON company_profiles;
CREATE POLICY "Company profiles public read" ON company_profiles
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users manage own company profile" ON company_profiles;
CREATE POLICY "Users manage own company profile" ON company_profiles
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. shorts_videos 補欄位 (若尚未有)
ALTER TABLE shorts_videos ADD COLUMN IF NOT EXISTS apply_url TEXT;
ALTER TABLE shorts_videos ADD COLUMN IF NOT EXISTS company_user_id UUID REFERENCES auth.users(id);
