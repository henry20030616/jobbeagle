# 自動保存報告機制說明

## 功能概述

每次生成分析報告時，系統會**自動保存**報告到"近期分析報告"，無需手動操作。

## 自動保存流程

### 1. 用戶操作
```
用戶填寫職缺資訊 → 上傳履歷 → 點擊「啟動 AI 戰略分析」
```

### 2. 後端處理 (app/api/analyze/route.ts)

```typescript
// AI 生成報告後
const report = await generateReport();

// 立即返回報告給用戶（不等待數據庫保存）
return NextResponse.json({ report });

// 異步保存到數據庫（不阻塞響應）
supabase
  .from('analysis_reports')
  .insert({
    job_title: report.basic_analysis?.job_title,
    job_description: jobDescription,
    analysis_data: report,
    user_id: user.id,
    created_at: new Date().toISOString()
  })
  .then(() => console.log('✅ 報告已保存'))
  .catch(e => console.error('❌ 保存失敗:', e));
```

**關鍵特點：**
- ✅ 異步保存，不阻塞用戶看到報告
- ✅ 自動關聯用戶 ID
- ✅ 自動記錄時間戳
- ✅ 包含完整報告數據

### 3. 前端刷新 (components/InputForm.tsx)

```typescript
// 監聽報告生成完成
useEffect(() => {
  if (!isLoading) { // 當生成完成時
    // 延遲 2 秒刷新列表（確保數據庫保存完成）
    const timer = setTimeout(() => {
      loadRecentReports(); // 重新載入報告列表
    }, 2000);
    return () => clearTimeout(timer);
  }
}, [isLoading]);
```

**刷新時機：**
- ✅ 報告生成完成後 2 秒
- ✅ 自動重新載入列表
- ✅ 新報告出現在"近期分析報告"頂部

## 保存的數據

每份報告包含以下信息：

| 字段 | 說明 | 範例 |
|------|------|------|
| `id` | 唯一識別碼 | UUID |
| `user_id` | 用戶 ID | UUID |
| `job_title` | 職位標題 | "資深軟體工程師" |
| `job_description` | 完整職缺描述 | 原始 JD 內容 |
| `resume_file_name` | 履歷檔名 | "resume.pdf" |
| `analysis_data` | 完整分析報告 | JSON 對象 |
| `created_at` | 創建時間 | "2026-01-18T10:30:00Z" |

## 查看保存的報告

### 方法 1：點擊「近期分析報告」按鈕
1. 找到「近期分析報告」按鈕（藍色圓形按鈕）
2. 點擊查看最近 10 份報告
3. 點擊任一報告即可查看完整內容

### 方法 2：在首頁查看
- 報告生成後會自動顯示
- 可以直接查看或下載

## 自動清理機制

- **容量限制**：最多保存 10 份報告
- **清理規則**：超過 10 份時，最舊的報告會被新報告覆蓋
- **排序方式**：按時間倒序（最新的在最上面）

## 常見問題

### Q: 為什麼我看不到剛生成的報告？
**A:** 可能的原因：
1. **等待時間不足**：系統需要 2 秒來保存和刷新，請稍等
2. **未登入**：只有登入用戶的報告才會保存
3. **保存失敗**：檢查瀏覽器控制台是否有錯誤訊息
4. **數據庫問題**：確認 Supabase 連接正常

### Q: 報告會永久保存嗎？
**A:** 
- 系統保存最近 10 份報告
- 超過 10 份時，最舊的會被自動移除
- 如需永久保存，請使用「下載儲存報告」功能

### Q: 未登入時生成的報告會保存嗎？
**A:** 
- 不會保存到"近期分析報告"
- 但仍可在當前頁面查看和下載
- 建議先登入再生成報告

### Q: 如何確認報告已保存？
**A:** 
1. 查看瀏覽器控制台（F12）
2. 尋找日誌：`✅ [DB Success] 報告已保存`
3. 或：`✅ [Frontend] 報告生成成功，已自動保存到"近期分析報告"`

### Q: 保存失敗怎麼辦？
**A:** 
1. 檢查是否已登入
2. 檢查網絡連接
3. 刷新頁面重試
4. 檢查 Supabase 連接狀態
5. 查看控制台錯誤訊息

## 技術細節

### 異步保存的優點
1. **不阻塞用戶**：用戶立即看到報告，無需等待保存
2. **更好的性能**：保存操作在背景執行
3. **更快的響應**：減少 API 響應時間

### 自動刷新機制
```typescript
// 使用 useEffect 監聽 loading 狀態
useEffect(() => {
  if (!isLoading) { // 生成完成
    setTimeout(() => {
      loadRecentReports(); // 2 秒後刷新
    }, 2000);
  }
}, [isLoading]);
```

### 數據庫查詢
```sql
-- 載入最近 10 份報告
SELECT id, job_title, created_at, analysis_data
FROM analysis_reports
WHERE user_id = $1
ORDER BY created_at DESC
LIMIT 10;
```

## 相關文件

- `app/api/analyze/route.ts` - 後端保存邏輯
- `components/InputForm.tsx` - 前端刷新邏輯
- `supabase-schema.sql` - 數據庫結構
- `migrate-add-missing-fields.sql` - 數據庫遷移腳本

## 測試建議

### 手動測試步驟
1. 登入帳號
2. 生成一份分析報告
3. 等待 3-5 秒
4. 點擊「近期分析報告」按鈕
5. 確認新報告出現在列表頂部

### 檢查點
- [ ] 報告出現在列表中
- [ ] 顯示正確的職位標題
- [ ] 顯示正確的時間
- [ ] 點擊可以查看完整報告
- [ ] 控制台無錯誤訊息
