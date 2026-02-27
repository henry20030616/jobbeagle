# Vercel 環境變數檢查清單

## 問題診斷
即使本地 API Key 有效，如果 Vercel 環境變數未設定或錯誤，線上部署就會失敗。

## 檢查步驟

### 1. 確認本地環境變數
你的 `.env.local` 中有：
```
GOOGLE_GEMINI_API_KEY=AIzaSyBZGYzydNZT_wfPprgQSfe5cbyiCkAkHtc
```

### 2. 檢查 Vercel 環境變數（重要！）
1. 前往：https://vercel.com/dashboard
2. 選擇 `jobbeagle` 專案
3. 進入 **Settings** → **Environment Variables**
4. 確認是否有設定 `GOOGLE_GEMINI_API_KEY`
5. 確認值是否為：`AIzaSyBZGYzydNZT_wfPprgQSfe5cbyiCkAkHtc`

### 3. 如果 Vercel 沒有設定環境變數
1. 在 Vercel Dashboard → Settings → Environment Variables
2. 點擊 **Add New**
3. 輸入：
   - **Key**: `GOOGLE_GEMINI_API_KEY`
   - **Value**: `AIzaSyBZGYzydNZT_wfPprgQSfe5cbyiCkAkHtc`
   - **Environment**: 選擇 `Production`, `Preview`, `Development`（或全部）
4. 點擊 **Save**
5. **重要**：重新部署專案（Redeploy）

### 4. 檢查 Vercel 部署日誌
1. 前往 Vercel Dashboard → Deployments
2. 點擊最新的部署
3. 查看 **Build Logs** 和 **Function Logs**
4. 搜尋 `GEMINI_API_KEY` 或 `Config Error`
5. 如果看到 "找不到 GEMINI_API_KEY"，表示環境變數未設定

## 常見問題

### 問題 1: 環境變數已設定但還是失敗
- **原因**：需要重新部署
- **解決**：在 Vercel Dashboard 點擊 **Redeploy**

### 問題 2: 環境變數名稱不一致
- **本地使用**：`GOOGLE_GEMINI_API_KEY`
- **Vercel 必須設定**：`GOOGLE_GEMINI_API_KEY` 或 `GEMINI_API_KEY`
- **檢查代碼**：`app/api/analyze/route.ts` 第 140 行會檢查兩個名稱

### 問題 3: 配額用盡（429 錯誤）
- **即使環境變數正確，配額用盡也會失敗**
- **解決**：檢查 Google Cloud Console 的配額設定

## 快速檢查命令
在 Vercel 部署日誌中搜尋：
- `🔑 [Config] API Key 存在` → 環境變數已設定
- `❌ [Config Error] 找不到 GEMINI_API_KEY` → 環境變數未設定
