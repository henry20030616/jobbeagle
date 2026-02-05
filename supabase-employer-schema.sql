-- ============================================
-- Jobbeagle Shorts - 企业会员数据库 Schema
-- ============================================
-- 企业会员登录和视频管理系统
-- 请在 Supabase SQL Editor 中执行此脚本
-- ============================================

-- ============================================
-- 1. 企业表 (companies)
-- ============================================
-- 存储企业会员信息
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  company_name TEXT NOT NULL,
  company_email TEXT,
  company_website TEXT,
  company_logo_url TEXT,
  description TEXT,
  industry TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. 视频表 (shorts_videos)
-- ============================================
-- 存储企业上传的招聘视频
CREATE TABLE IF NOT EXISTS shorts_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  job_title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  location TEXT,
  salary TEXT,
  description TEXT NOT NULL,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  logo_url TEXT,
  tags TEXT[] DEFAULT '{}',
  contact_email TEXT,
  is_published BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. 创建索引 (Indexes)
-- ============================================

-- companies 索引
CREATE INDEX IF NOT EXISTS idx_companies_user_id ON companies(user_id);
CREATE INDEX IF NOT EXISTS idx_companies_created_at ON companies(created_at DESC);

-- shorts_videos 索引
CREATE INDEX IF NOT EXISTS idx_shorts_videos_company_id ON shorts_videos(company_id);
CREATE INDEX IF NOT EXISTS idx_shorts_videos_is_published ON shorts_videos(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_shorts_videos_created_at ON shorts_videos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shorts_videos_company_published ON shorts_videos(company_id, is_published, created_at DESC);

-- ============================================
-- 4. 启用行级安全 (Row Level Security)
-- ============================================
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE shorts_videos ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. 删除旧策略（如果存在）
-- ============================================
DROP POLICY IF EXISTS "Users can manage their own company" ON companies;
DROP POLICY IF EXISTS "Users can view all companies" ON companies;
DROP POLICY IF EXISTS "Companies can manage their own videos" ON shorts_videos;
DROP POLICY IF EXISTS "Anyone can view published videos" ON shorts_videos;

-- ============================================
-- 6. 创建 RLS 策略 (Policies)
-- ============================================

-- companies 策略
-- SELECT: 所有人可以查看企业信息（用于显示在视频上）
CREATE POLICY "Anyone can view companies" ON companies
  FOR SELECT
  USING (true);

-- INSERT: 用户只能创建自己的企业资料
CREATE POLICY "Users can create their own company" ON companies
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: 用户只能更新自己的企业资料
CREATE POLICY "Users can update their own company" ON companies
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: 用户只能删除自己的企业资料
CREATE POLICY "Users can delete their own company" ON companies
  FOR DELETE
  USING (auth.uid() = user_id);

-- shorts_videos 策略
-- SELECT: 所有人可以查看已发布的视频，企业可以查看自己的所有视频
CREATE POLICY "Anyone can view published videos" ON shorts_videos
  FOR SELECT
  USING (
    is_published = true 
    OR EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.id = shorts_videos.company_id 
      AND companies.user_id = auth.uid()
    )
  );

-- INSERT: 只有企业会员可以上传视频
CREATE POLICY "Companies can insert their own videos" ON shorts_videos
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.id = shorts_videos.company_id 
      AND companies.user_id = auth.uid()
    )
  );

-- UPDATE: 企业只能更新自己的视频
CREATE POLICY "Companies can update their own videos" ON shorts_videos
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.id = shorts_videos.company_id 
      AND companies.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.id = shorts_videos.company_id 
      AND companies.user_id = auth.uid()
    )
  );

-- DELETE: 企业只能删除自己的视频
CREATE POLICY "Companies can delete their own videos" ON shorts_videos
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.id = shorts_videos.company_id 
      AND companies.user_id = auth.uid()
    )
  );

-- ============================================
-- 7. 创建更新时间触发器
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为 companies 创建触发器
DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 为 shorts_videos 创建触发器
DROP TRIGGER IF EXISTS update_shorts_videos_updated_at ON shorts_videos;
CREATE TRIGGER update_shorts_videos_updated_at
  BEFORE UPDATE ON shorts_videos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 完成！
-- ============================================
