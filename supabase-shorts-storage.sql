-- ============================================
-- Jobbeagle Shorts - Storage 上傳權限
-- ============================================
-- 使用方式：
-- 1. 到 Supabase Dashboard → Storage → New bucket
-- 2. 名稱填「shorts-videos」→ 勾選 Public → Create bucket
-- 3. 到 SQL Editor，貼上下面這段並執行
-- ============================================

-- 允許登入用戶上傳（企業上傳影片）
DROP POLICY IF EXISTS "Allow public upload to shorts-videos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated upload to shorts-videos" ON storage.objects;
CREATE POLICY "Allow authenticated upload to shorts-videos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'shorts-videos');

-- 允許公開讀取（公開 bucket）
DROP POLICY IF EXISTS "Allow public read shorts-videos" ON storage.objects;
CREATE POLICY "Allow public read shorts-videos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'shorts-videos');

-- 允許用戶刪除自己上傳的檔案
DROP POLICY IF EXISTS "Allow owner delete shorts-videos" ON storage.objects;
CREATE POLICY "Allow owner delete shorts-videos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'shorts-videos' AND owner = auth.uid());
