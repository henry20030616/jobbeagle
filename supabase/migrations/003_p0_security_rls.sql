-- =============================================================
-- Jobbeagle DB Migration 003 — P0 Security & RLS
-- 執行方式：Supabase Dashboard → SQL Editor → New query → 貼上 → Run
-- =============================================================

-- ────────────────────────────────────────────────────────────
-- 1. shorts_videos: add moderation_status column
-- ────────────────────────────────────────────────────────────
ALTER TABLE shorts_videos
  ADD COLUMN IF NOT EXISTS moderation_status TEXT NOT NULL DEFAULT 'approved';

-- ────────────────────────────────────────────────────────────
-- 2. shorts_videos: enable RLS + policies
-- ────────────────────────────────────────────────────────────
ALTER TABLE shorts_videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Video visibility"              ON shorts_videos;
DROP POLICY IF EXISTS "Anyone can view published videos" ON shorts_videos;
DROP POLICY IF EXISTS "Companies can manage own videos" ON shorts_videos;
DROP POLICY IF EXISTS "Company can insert own videos"   ON shorts_videos;
DROP POLICY IF EXISTS "Company can update own videos"   ON shorts_videos;
DROP POLICY IF EXISTS "Company can delete own videos"   ON shorts_videos;

-- Public: only published + approved; owners can also see their own drafts
CREATE POLICY "Video visibility"
  ON shorts_videos FOR SELECT
  USING (
    (is_published = true AND moderation_status = 'approved')
    OR (auth.uid() IS NOT NULL AND auth.uid() = company_user_id)
  );

CREATE POLICY "Company can insert own videos"
  ON shorts_videos FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = company_user_id);

CREATE POLICY "Company can update own videos"
  ON shorts_videos FOR UPDATE
  USING  (auth.uid() = company_user_id)
  WITH CHECK (auth.uid() = company_user_id);

CREATE POLICY "Company can delete own videos"
  ON shorts_videos FOR DELETE
  USING (auth.uid() = company_user_id);

-- ────────────────────────────────────────────────────────────
-- 3. job_applications: enable RLS + policies
-- ────────────────────────────────────────────────────────────
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View job applications"                ON job_applications;
DROP POLICY IF EXISTS "Anyone can insert application"        ON job_applications;
DROP POLICY IF EXISTS "Employers can update application status" ON job_applications;

-- Applicants see their own; employers see apps for their jobs
CREATE POLICY "View job applications"
  ON job_applications FOR SELECT
  USING (
    auth.uid()::text = applicant_user_id
    OR auth.uid() IN (
      SELECT company_user_id FROM shorts_videos
      WHERE id::text = job_applications.job_id
    )
  );

-- Anyone (including anonymous visitors) can submit an application
CREATE POLICY "Anyone can insert application"
  ON job_applications FOR INSERT
  WITH CHECK (true);

-- Employers can mark applications as read/reviewed
CREATE POLICY "Employers can update application status"
  ON job_applications FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT company_user_id FROM shorts_videos
      WHERE id::text = job_applications.job_id
    )
  );

-- ────────────────────────────────────────────────────────────
-- 4. job_applications: deduplicate then add unique index
-- ────────────────────────────────────────────────────────────

-- Remove duplicate rows keeping only the earliest application
-- per (applicant_email, job_id) pair.
DELETE FROM job_applications a
USING job_applications b
WHERE a.job_id IS NOT NULL
  AND a.applicant_email = b.applicant_email
  AND a.job_id = b.job_id
  AND a.created_at > b.created_at;

DROP INDEX IF EXISTS unique_application_per_email_job;
CREATE UNIQUE INDEX unique_application_per_email_job
  ON job_applications (applicant_email, job_id)
  WHERE job_id IS NOT NULL;

-- ────────────────────────────────────────────────────────────
-- 5. company_profiles: enable RLS + policies
-- ────────────────────────────────────────────────────────────
ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view company profiles"      ON company_profiles;
DROP POLICY IF EXISTS "Users can manage own company profile"  ON company_profiles;
DROP POLICY IF EXISTS "Users can insert own company profile"  ON company_profiles;
DROP POLICY IF EXISTS "Users can update own company profile"  ON company_profiles;
DROP POLICY IF EXISTS "Users can delete own company profile"  ON company_profiles;

CREATE POLICY "Anyone can view company profiles"
  ON company_profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own company profile"
  ON company_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own company profile"
  ON company_profiles FOR UPDATE
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own company profile"
  ON company_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- 6. saved_jobs: enable RLS
-- ────────────────────────────────────────────────────────────
ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own saved jobs" ON saved_jobs;
CREATE POLICY "Users can manage own saved jobs"
  ON saved_jobs FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- 7. followed_companies: enable RLS
-- ────────────────────────────────────────────────────────────
ALTER TABLE followed_companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own follows" ON followed_companies;
CREATE POLICY "Users can manage own follows"
  ON followed_companies FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
