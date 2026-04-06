-- 求職申請記錄表
-- 每次用戶一鍵申請時寫入，供企業端未來管理申請者使用

CREATE TABLE IF NOT EXISTS job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES shorts_videos(id) ON DELETE SET NULL,
  job_title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  applicant_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  applicant_name TEXT NOT NULL,
  applicant_email TEXT NOT NULL,
  applicant_phone TEXT,
  cover_letter TEXT,
  resume_url TEXT,
  resume_file_name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'interview', 'rejected', 'accepted')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_applicant ON job_applications(applicant_user_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_created ON job_applications(created_at DESC);

ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- 求職者可以查看自己的申請記錄
DROP POLICY IF EXISTS "Applicants view own applications" ON job_applications;
CREATE POLICY "Applicants view own applications" ON job_applications
  FOR SELECT USING (auth.uid() = applicant_user_id);

-- 任何人（包括未登入）可以新增申請（允許訪客申請）
DROP POLICY IF EXISTS "Anyone can insert applications" ON job_applications;
CREATE POLICY "Anyone can insert applications" ON job_applications
  FOR INSERT WITH CHECK (true);

-- 企業用戶可以查看投遞到自己職缺的申請
-- 需要透過 shorts_videos 的 company_user_id 來比對
DROP POLICY IF EXISTS "Company users view their job applications" ON job_applications;
CREATE POLICY "Company users view their job applications" ON job_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM shorts_videos
      WHERE shorts_videos.id = job_applications.job_id
      AND shorts_videos.company_user_id = auth.uid()
    )
  );

-- 企業可以更新申請狀態（例如改 status、加備註）
DROP POLICY IF EXISTS "Company users update application status" ON job_applications;
CREATE POLICY "Company users update application status" ON job_applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM shorts_videos
      WHERE shorts_videos.id = job_applications.job_id
      AND shorts_videos.company_user_id = auth.uid()
    )
  );
