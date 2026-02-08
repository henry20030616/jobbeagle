-- ============================================
-- Jobbeagle Shorts - Storage 上傳權限
-- ============================================
-- 使用方式：
-- 1. 到 Supabase Dashboard → Storage → New bucket
-- 2. 名稱填「shorts-videos」→ 勾選 Public → Create bucket
-- 3. 到 SQL Editor，貼上下面這段並執行
-- ============================================

-- 允許匿名上傳（取得影片網址用）
DROP POLICY IF EXISTS "Allow public upload to shorts-videos" ON storage.objects;
CREATE POLICY "Allow public upload to shorts-videos"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'shorts-videos');

-- 允許公開讀取（公開 bucket 通常已可讀，此為明確 SELECT）
DROP POLICY IF EXISTS "Allow public read shorts-videos" ON storage.objects;
CREATE POLICY "Allow public read shorts-videos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'shorts-videos');
