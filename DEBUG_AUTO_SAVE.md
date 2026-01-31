# 自動保存報告調試指南

## 問題：報告沒有自動保存到"近期分析報告"

## 已修復的問題

### 1. 刷新機制改進
**之前的問題：**
- 刷新依賴於 `onReportGenerated` 條件
- 條件判斷不正確，導致刷新不觸發

**修復方案：**
- 使用 `useRef` 追蹤前一次的 loading 狀態
- 當 `isLoading` 從 `true` 變為 `false` 時自動刷新
- 不再依賴外部回調函數

```typescript
const prevLoadingRef = useRef(isLoading);

useEffect(() => {
  // 當 isLoading 從 true 變為 false 時（報告生成完成）
  if (prevLoadingRef.current && !isLoading) {
    setTimeout(() => {
      loadRecentReports(); // 2秒後刷新
    }, 2000);
  }
  prevLoadingRef.current = isLoading;
}, [isLoading]);
```

### 2. 增強日誌記錄
添加了詳細的控制台日誌，便於調試：

**後端日誌：**
- ✅ `[DB Success] 報告已保存到數據庫`
- ❌ `[DB Error] 儲存失敗: [錯誤訊息]`
- ❌ `[DB Error] 錯誤詳情: [JSON]`

**前端日誌：**
- 🔄 `[InputForm] 報告生成完成，2秒後刷新列表...`
- 📊 `[InputForm] 開始查詢分析報告...`
- ✅ `[InputForm] 成功載入 X 份報告`
- ❌ `[InputForm] 無法載入分析報告: [錯誤]`

## 調試步驟

### 步驟 1：檢查是否已登入
```
1. 打開瀏覽器控制台 (F12)
2. 生成報告前查看是否有登入狀態
3. 查找日誌：
   ✅ 正常：無 "用戶未登入" 警告
   ❌ 異常：看到 "⚠️ [InputForm] 用戶未登入，無法載入報告"
```

**解決方案：** 先登入再生成報告

### 步驟 2：檢查數據庫保存
```
1. 生成報告
2. 查看控制台日誌
3. 尋找：
   ✅ "✅ [DB Success] 報告已保存到數據庫"
   ❌ "❌ [DB Error] 儲存失敗"
```

**如果看到保存失敗：**
- 檢查錯誤訊息
- 確認數據庫表是否存在 `user_id` 欄位
- 執行 `migrate-add-missing-fields.sql` 遷移腳本

### 步驟 3：檢查自動刷新
```
1. 報告生成完成後
2. 等待 2-3 秒
3. 查找日誌：
   🔄 "[InputForm] 報告生成完成，2秒後刷新列表..."
   🔄 "[InputForm] 開始刷新報告列表..."
   📊 "[InputForm] 開始查詢分析報告..."
   ✅ "[InputForm] 成功載入 X 份報告"
```

**如果沒有看到刷新日誌：**
- 檢查 `isLoading` 狀態是否正確更新
- 確認沒有 JavaScript 錯誤

### 步驟 4：檢查數據庫查詢
```
1. 查看刷新日誌後的結果
2. 查找：
   ✅ "[InputForm] 成功載入 X 份報告"
   ❌ "[InputForm] 無法載入分析報告"
```

**如果查詢失敗：**
- 檢查錯誤詳情
- 確認 RLS policies 設置正確
- 檢查用戶權限

### 步驟 5：手動驗證數據庫
```sql
-- 在 Supabase Dashboard 執行
SELECT id, job_title, created_at, user_id
FROM analysis_reports
ORDER BY created_at DESC
LIMIT 10;
```

檢查：
- ✅ 是否有新記錄
- ✅ `user_id` 是否正確
- ✅ `job_title` 是否正確
- ✅ `created_at` 時間是否正確

## 常見問題與解決方案

### Q1: 看到 "用戶未登入" 警告
**原因：** 未登入或登入已過期
**解決：** 點擊右上角 "登出" 然後重新登入

### Q2: 看到 "儲存失敗" 錯誤
**可能原因：**
1. 數據庫表缺少 `user_id` 欄位
2. RLS policies 配置錯誤
3. 網絡問題

**解決步驟：**
```sql
-- 1. 檢查表結構
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'analysis_reports';

-- 2. 如果缺少欄位，執行遷移
-- 在 Supabase SQL Editor 執行 migrate-add-missing-fields.sql

-- 3. 檢查 RLS policies
SELECT * FROM pg_policies 
WHERE tablename = 'analysis_reports';
```

### Q3: 報告保存成功但列表沒刷新
**可能原因：**
1. 刷新時機太早（數據庫還沒完成保存）
2. 查詢條件不正確
3. 前端狀態更新失敗

**解決：**
- 增加等待時間（已設為 2 秒）
- 檢查控制台是否有 JavaScript 錯誤
- 手動點擊"近期分析報告"按鈕刷新

### Q4: 數據庫有記錄但前端顯示為空
**可能原因：**
1. `user_id` 不匹配
2. RLS policies 阻止查詢
3. 數據格式問題

**解決：**
```sql
-- 檢查記錄的 user_id
SELECT user_id, job_title, created_at 
FROM analysis_reports 
ORDER BY created_at DESC 
LIMIT 5;

-- 檢查當前登入用戶 ID
SELECT auth.uid();

-- 確認兩者是否匹配
```

## 完整測試流程

### 測試前準備
1. ✅ 確認已登入
2. ✅ 打開瀏覽器控制台 (F12)
3. ✅ 清空控制台日誌

### 測試步驟
1. 填寫職缺資訊
2. 上傳履歷
3. 點擊"啟動 AI 戰略分析"
4. 觀察控制台日誌
5. 等待報告生成完成
6. 繼續等待 2-3 秒
7. 點擊"近期分析報告"按鈕
8. 確認新報告出現在列表頂部

### 預期日誌順序
```
🚀 [API Start] 開始處理分析請求
🤖 [Gemini] 準備發送請求...
✅ [Gemini] 成功取得回應
✅ [Parsing] JSON 解析成功
🏁 [API End] AI 分析完成
✅ [DB Success] 報告已保存到數據庫
✅ [Frontend] 報告生成成功，已自動保存到"近期分析報告"
🔄 [InputForm] 報告生成完成，2秒後刷新列表...
🔄 [InputForm] 開始刷新報告列表...
📊 [InputForm] 開始查詢分析報告...
✅ [InputForm] 成功載入 X 份報告
```

## 快速排查清單

- [ ] 用戶已登入
- [ ] 控制台無 JavaScript 錯誤
- [ ] 看到 "報告已保存到數據庫" 日誌
- [ ] 看到 "報告生成完成，2秒後刷新列表" 日誌
- [ ] 看到 "成功載入 X 份報告" 日誌
- [ ] 數據庫表有 `user_id` 欄位
- [ ] RLS policies 設置正確
- [ ] 手動查詢數據庫有新記錄

## 需要幫助？

如果以上步驟都無法解決問題：

1. **收集日誌**
   - 複製完整的控制台日誌
   - 截圖報告生成過程

2. **檢查數據庫**
   - 執行上述 SQL 查詢
   - 記錄結果

3. **提供信息**
   - 是否登入
   - 錯誤訊息
   - 控制台日誌
   - 數據庫查詢結果
