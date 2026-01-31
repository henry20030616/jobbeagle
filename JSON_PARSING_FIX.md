# JSON 解析錯誤修復指南

## 問題說明

"AI Generated Invalid JSON" 錯誤發生在 Gemini API 返回的內容無法被正確解析為 JSON 時。這可能由以下原因造成：

1. **Gemini API 返回的內容包含額外文字**
   - API 可能在 JSON 前後添加了說明文字
   - 可能包含 Markdown 代碼塊標記 (```json)

2. **JSON 格式不完整**
   - 缺少閉合括號
   - 包含無效的字符或編碼問題
   - 尾隨逗號等語法錯誤

3. **JSON 結構不完整**
   - 缺少必要字段
   - 數據被截斷

## 已實施的修復

### 1. 強化的 JSON 解析邏輯 (`app/api/analyze/route.ts`)

改進的解析流程包括：

- ✅ **移除 Markdown 標記**：自動清理 ```json 和 ``` 標記
- ✅ **移除前綴文字**：自動找到第一個 `{` 並移除之前的文字
- ✅ **移除後綴文字**：自動找到最後一個 `}` 並移除之後的文字
- ✅ **括號匹配修復**：自動檢測並修復不匹配的括號
- ✅ **尾隨逗號修復**：自動移除無效的尾隨逗號
- ✅ **結構驗證**：驗證必要字段是否存在
- ✅ **詳細錯誤日誌**：記錄完整的錯誤信息以便調試

### 2. 改進的 Prompt (`SYSTEM_INSTRUCTION`)

在系統提示中添加了明確的 JSON 格式要求：

```
# CRITICAL JSON FORMAT REQUIREMENTS
1. Output MUST be valid JSON only - Do NOT include any text before or after the JSON object.
2. No Markdown code blocks - Do NOT wrap the JSON in ```json``` or ``` markers.
3. No explanatory text - Do NOT add comments, explanations, or any text outside the JSON structure.
4. Valid JSON syntax - Ensure all strings are properly quoted, all brackets are matched, and there are no trailing commas.
5. Complete structure - The JSON must include ALL required fields.
```

### 3. 改進的錯誤顯示 (`app/page.tsx`)

- ✅ **友好的錯誤訊息**：顯示清晰的錯誤說明
- ✅ **調試建議**：提供具體的故障排除步驟
- ✅ **詳細日誌**：在瀏覽器控制台記錄完整錯誤信息

## 如何調試

### 檢查瀏覽器控制台

1. 打開開發者工具 (F12)
2. 切換到 **Console** 標籤
3. 查找以下日誌：
   - `❌ [Parsing Error] JSON 解析失敗！`
   - `--- 原始文字開頭 ---`
   - `--- 原始文字結尾 ---`
   - `--- 清理後的文字 ---`

### 檢查服務器日誌

如果使用 Vercel 或其他平台，檢查服務器日誌中的：
- `🔍 [Parsing] 開始解析 JSON...`
- `📏 [Parsing] 原始文字長度:`
- `✅ [Parsing] JSON 解析成功` 或 `❌ [Parsing Error]`

## 如果問題持續發生

### 1. 檢查 Gemini API Key

確認環境變量中的 `GEMINI_API_KEY` 或 `GOOGLE_GEMINI_API_KEY` 是否正確設置。

### 2. 檢查 API 配額

確認 Gemini API 的配額是否充足，沒有達到限制。

### 3. 檢查輸入內容

- 職缺描述是否過長？
- 履歷文件是否過大（超過 4MB）？
- 內容是否包含特殊字符？

### 4. 重試

有時是暫時性問題，可以：
- 稍等片刻後重試
- 檢查網絡連接
- 確認 Gemini API 服務狀態

### 5. 簡化輸入測試

嘗試使用較短的職缺描述和履歷進行測試，確認是否是內容長度導致的問題。

## 技術細節

### JSON 解析流程

```typescript
1. 移除 Markdown 標記 (```json, ```)
2. 找到第一個 { 和最後一個 }
3. 提取中間的 JSON 內容
4. 修復常見語法錯誤（尾隨逗號、括號不匹配）
5. 驗證 JSON 結構完整性
6. 解析並驗證必要字段
```

### 錯誤處理

- 如果解析失敗，返回詳細錯誤信息
- 包含原始文字的前 1000 字符供調試
- 提供具體的錯誤訊息和建議

## 相關文件

- `app/api/analyze/route.ts` - API 路由和 JSON 解析邏輯
- `app/page.tsx` - 前端錯誤顯示
- `SYSTEM_INSTRUCTION` - Gemini API 的系統提示
