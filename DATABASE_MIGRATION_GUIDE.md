# 数据库迁移指南

## 问题说明

近期產生的分析報告沒有顯示在首頁的原因是：**數據庫表結構與代碼使用的字段不匹配**。

### 缺失的字段

`analysis_reports` 表缺少以下字段：
- `user_id` - 用戶ID（用於關聯用戶和報告）
- `job_title` - 職位標題（用於顯示在首頁）
- `analysis_data` - 分析數據（JSON格式，存儲完整報告）
- `content` - 原始內容（存儲AI生成的原始文本）

`resume_history` 表缺少：
- `user_id` - 用戶ID（用於關聯用戶和履歷）

## 解決方案

### 步驟 1: 執行數據庫遷移

1. 登入 Supabase Dashboard
2. 進入 **SQL Editor**
3. 執行以下遷移腳本：

```sql
-- 執行 migrate-add-missing-fields.sql 中的內容
```

或者直接複製 `migrate-add-missing-fields.sql` 文件的內容到 SQL Editor 執行。

### 步驟 2: 驗證遷移結果

執行以下查詢確認字段已添加：

```sql
-- 檢查 analysis_reports 表的字段
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'analysis_reports'
ORDER BY ordinal_position;

-- 檢查 resume_history 表的字段
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'resume_history'
ORDER BY ordinal_position;
```

應該能看到以下字段：
- `user_id` (uuid)
- `job_title` (text)
- `analysis_data` (jsonb)
- `content` (text)

### 步驟 3: 測試功能

1. 重新啟動應用程序（如果正在運行）
2. 登入帳號
3. 生成一份新的分析報告
4. 檢查首頁是否顯示新生成的報告

## 如果遷移後仍有問題

### 檢查事項

1. **RLS 策略是否正確**
   - 確認 RLS policies 已正確設置
   - 用戶應該能看到自己的報告

2. **用戶是否已登入**
   - 只有登入用戶的報告才會顯示在首頁
   - 未登入時生成的報告不會顯示

3. **檢查瀏覽器控制台**
   - 打開開發者工具 (F12)
   - 查看 Console 是否有錯誤訊息
   - 查看 Network 標籤，確認 API 請求是否成功

4. **檢查 Supabase 日誌**
   - 在 Supabase Dashboard 中查看 Logs
   - 確認是否有數據庫錯誤

### 手動驗證數據

執行以下查詢檢查數據是否正確保存：

```sql
-- 查看最近的報告（替換 YOUR_USER_ID）
SELECT id, job_title, created_at, user_id
FROM analysis_reports
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC
LIMIT 5;
```

## 注意事項

- 遷移不會影響現有數據（如果有的話）
- 如果 `report_data` 字段存在，會自動重命名為 `analysis_data`
- 遷移後，新生成的報告會自動包含所有必要字段
- 舊報告如果缺少 `user_id`，可能不會顯示在首頁（這是預期行為）

## 需要幫助？

如果遷移後仍有問題，請檢查：
1. 瀏覽器控制台的錯誤訊息
2. Supabase Dashboard 的 Logs
3. 確認 RLS policies 設置正確
