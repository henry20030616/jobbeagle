# 🔧 更新 Vercel 環境變數 - 詳細步驟

## 問題
Vercel 環境變數中的 API Key 與本地不一致：
- ✅ 本地正確：`AIzaSyBZGY...byiCkAkHtc`
- ❌ Vercel 錯誤：`AIzaSyAwwr...UEMmH4prig`

## 📋 更新步驟（5分鐘完成）

### 步驟 1: 打開 Vercel Dashboard
1. 前往：https://vercel.com/dashboard
2. 如果還沒登入，請先登入

### 步驟 2: 選擇專案
1. 在專案列表中點擊 **`jobbeagle`** 專案

### 步驟 3: 進入環境變數設定
1. 點擊頂部選單的 **Settings**
2. 在左側選單中點擊 **Environment Variables**

### 步驟 4: 更新 API Key
1. 找到 `GOOGLE_GEMINI_API_KEY` 這個環境變數
2. 點擊右側的 **編輯**（鉛筆圖標）或 **刪除** 後重新新增
3. 如果編輯：
   - 將 Value 欄位中的值改為：`AIzaSyBZGYzydNZT_wfPprgQSfe5cbyiCkAkHtc`
   - 確認 Environment 選擇了 **Production**, **Preview**, **Development**（或全部勾選）
   - 點擊 **Save**
4. 如果刪除後重新新增：
   - 點擊 **Add New**
   - Key: `GOOGLE_GEMINI_API_KEY`
   - Value: `AIzaSyBZGYzydNZT_wfPprgQSfe5cbyiCkAkHtc`
   - Environment: 勾選 **Production**, **Preview**, **Development**
   - 點擊 **Save**

### 步驟 5: 重新部署（重要！）
1. 點擊頂部選單的 **Deployments**
2. 找到最新的部署（最上面那個）
3. 點擊右側的 **...**（三個點）
4. 選擇 **Redeploy**
5. 確認對話框，等待部署完成（約 2-3 分鐘）

### 步驟 6: 驗證
部署完成後，訪問：
```
https://www.jobbeagle.com/api/check-env
```

應該看到：
- `"prefix": "AIzaSyBZGY..."` ✅
- `"suffix": "...byiCkAkHtc"` ✅
- `"GOOGLE_GEMINI_API_KEY": true` ✅

## 🎯 快速連結
- Vercel Dashboard: https://vercel.com/dashboard
- 環境變數設定: https://vercel.com/dashboard → jobbeagle → Settings → Environment Variables
- 檢查 API: https://www.jobbeagle.com/api/check-env

## ⚠️ 注意事項
- 更新環境變數後**必須重新部署**才會生效
- 確保三個環境（Production, Preview, Development）都有設定
- API Key 值：`AIzaSyBZGYzydNZT_wfPprgQSfe5cbyiCkAkHtc`
