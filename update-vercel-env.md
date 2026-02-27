# 更新 Vercel 環境變數指南

## 問題
Vercel 環境變數中的 API Key 與本地不一致：
- 本地：`AIzaSyBZGY...byiCkAkHtc`
- Vercel：`AIzaSyAwwr...UEMmH4prig` ❌

## 解決步驟

### 1. 前往 Vercel Dashboard
https://vercel.com/dashboard → jobbeagle → Settings → Environment Variables

### 2. 更新 `GOOGLE_GEMINI_API_KEY`
- 值：`AIzaSyBZGYzydNZT_wfPprgQSfe5cbyiCkAkHtc`
- Environment：Production, Preview, Development（全部）

### 3. 重新部署
Deployments → 最新部署 → Redeploy

### 4. 驗證
訪問：https://www.jobbeagle.com/api/check-env
確認 prefix 為 `AIzaSyBZGY...`
