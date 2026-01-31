-- 測試自動保存功能的 SQL 查詢
-- 在 Supabase SQL Editor 中執行這些查詢來驗證自動保存是否正常工作

-- ==========================================
-- 1. 檢查表結構（確認必要欄位都存在）
-- ==========================================
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'analysis_reports'
ORDER BY ordinal_position;

-- 預期結果應該包含：
-- - id (uuid)
-- - user_id (uuid)
-- - job_title (text)
-- - job_description (text)
-- - resume_file_name (text)
-- - resume_type (text)
-- - analysis_data (jsonb)
-- - content (text)
-- - created_at (timestamp with time zone)

-- ==========================================
-- 2. 檢查最近的報告記錄
-- ==========================================
SELECT 
    id,
    user_id,
    job_title,
    resume_file_name,
    created_at,
    LENGTH(content) as content_length,
    (analysis_data IS NOT NULL) as has_analysis_data
FROM analysis_reports
ORDER BY created_at DESC
LIMIT 10;

-- 這會顯示最近 10 份報告
-- 檢查：
-- - user_id 是否填入（不是 NULL）
-- - job_title 是否正確
-- - created_at 時間是否正確
-- - has_analysis_data 應該是 true

-- ==========================================
-- 3. 檢查當前登入用戶的報告
-- ==========================================
SELECT 
    id,
    job_title,
    created_at,
    resume_file_name
FROM analysis_reports
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 10;

-- 這會顯示當前登入用戶的最近 10 份報告
-- 這應該和前端"近期分析報告"顯示的內容一致

-- ==========================================
-- 4. 檢查 RLS (Row Level Security) policies
-- ==========================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'analysis_reports';

-- 預期應該看到：
-- - "Users can only see their own reports" (SELECT)
-- - "Users can only insert their own reports" (INSERT)
-- - "Users can only update their own reports" (UPDATE)
-- - "Users can only delete their own reports" (DELETE)

-- ==========================================
-- 5. 檢查表是否啟用了 RLS
-- ==========================================
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'analysis_reports';

-- rowsecurity 應該是 true

-- ==========================================
-- 6. 統計報告數量（按用戶）
-- ==========================================
SELECT 
    user_id,
    COUNT(*) as report_count,
    MIN(created_at) as first_report,
    MAX(created_at) as last_report
FROM analysis_reports
GROUP BY user_id
ORDER BY report_count DESC;

-- 這會顯示每個用戶有多少份報告

-- ==========================================
-- 7. 檢查最近 5 分鐘內的報告
-- ==========================================
SELECT 
    id,
    user_id,
    job_title,
    created_at,
    (NOW() - created_at) as age
FROM analysis_reports
WHERE created_at > NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC;

-- 如果剛生成報告，應該會在這裡看到

-- ==========================================
-- 8. 檢查是否有空的 user_id（需要修復）
-- ==========================================
SELECT 
    id,
    job_title,
    created_at
FROM analysis_reports
WHERE user_id IS NULL
ORDER BY created_at DESC
LIMIT 10;

-- 如果有結果，表示有些報告沒有關聯用戶
-- 這些報告不會在"近期分析報告"中顯示
-- 需要手動關聯或刪除

-- ==========================================
-- 9. 檢查 analysis_data 結構
-- ==========================================
SELECT 
    id,
    job_title,
    jsonb_typeof(analysis_data) as data_type,
    jsonb_object_keys(analysis_data) as keys
FROM analysis_reports
WHERE id = (SELECT id FROM analysis_reports ORDER BY created_at DESC LIMIT 1);

-- 檢查最新報告的 analysis_data 結構
-- 應該包含：basic_analysis, salary_analysis, reviews_analysis 等

-- ==========================================
-- 10. 測試插入權限（如果失敗，說明 RLS 有問題）
-- ==========================================
-- 注意：這會實際插入一筆測試數據
-- 測試完成後記得刪除

/*
INSERT INTO analysis_reports (
    user_id,
    job_title,
    job_description,
    resume_file_name,
    resume_type,
    analysis_data,
    content,
    created_at
) VALUES (
    auth.uid(),
    '測試職位',
    '測試職缺描述',
    'test_resume.pdf',
    'file',
    '{"test": true}'::jsonb,
    '測試內容',
    NOW()
);

-- 如果成功，會返回插入的記錄
-- 然後刪除測試數據：
DELETE FROM analysis_reports 
WHERE job_title = '測試職位' 
AND user_id = auth.uid();
*/

-- ==========================================
-- 11. 診斷：找出為什麼報告沒有顯示
-- ==========================================

-- Step 1: 檢查當前用戶 ID
SELECT auth.uid() as current_user_id;

-- Step 2: 檢查總共有多少報告
SELECT COUNT(*) as total_reports FROM analysis_reports;

-- Step 3: 檢查當前用戶有多少報告
SELECT COUNT(*) as my_reports 
FROM analysis_reports 
WHERE user_id = auth.uid();

-- Step 4: 如果 total_reports > 0 但 my_reports = 0
-- 表示報告沒有正確關聯用戶 ID
-- 需要檢查後端保存邏輯

-- Step 5: 如果都是 0，表示報告根本沒保存到數據庫
-- 檢查後端日誌是否有錯誤訊息
