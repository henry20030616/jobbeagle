-- =====================================================
-- job_applications：狀態改為僅 unread / read（在 Supabase SQL Editor 貼上整份執行一次即可）
-- 執行前：建議先備份；執行後：等 Vercel 部署完成再測一鍵申請
-- 若曾執行過失敗，請把錯誤訊息貼給開發者，勿重複亂刪表
-- =====================================================

-- 1. Add new column with default 'unread'
ALTER TABLE job_applications
  ADD COLUMN IF NOT EXISTS status_v2 TEXT NOT NULL DEFAULT 'unread'
  CHECK (status_v2 IN ('unread', 'read'));

-- 2. Copy existing status: treat anything other than 'pending' as 'read'
UPDATE job_applications
  SET status_v2 = CASE WHEN status = 'pending' THEN 'unread' ELSE 'read' END;

-- 3. Drop old column and rename
ALTER TABLE job_applications DROP COLUMN IF EXISTS status;
ALTER TABLE job_applications RENAME COLUMN status_v2 TO status;

-- 4. Add application_message column if not exists
ALTER TABLE job_applications
  ADD COLUMN IF NOT EXISTS application_message TEXT;

-- 5. Add cover_letter_url column if not exists
ALTER TABLE job_applications
  ADD COLUMN IF NOT EXISTS cover_letter_url TEXT;

-- 6. Add cover_letter_file_name column if not exists
ALTER TABLE job_applications
  ADD COLUMN IF NOT EXISTS cover_letter_file_name TEXT;

-- Done
SELECT 'job_applications status updated to unread/read' AS result;
