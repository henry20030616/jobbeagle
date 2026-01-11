# Google OAuth 設定指南

## 問題
錯誤訊息：`"Unsupported provider: provider is not enabled"`

這表示 Google OAuth 尚未在 Supabase 專案中啟用。

## 解決步驟

### 1. 在 Google Cloud Console 建立 OAuth 憑證

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 選擇或建立一個專案
3. 啟用 **Google+ API**：
   - 左側選單 → **API 和服務** → **程式庫**
   - 搜尋 "Google+ API" 並啟用
4. 建立 OAuth 2.0 憑證：
   - 左側選單 → **API 和服務** → **憑證**
   - 點擊 **建立憑證** → **OAuth 用戶端 ID**
   - 應用程式類型選擇 **網頁應用程式**
   - 名稱：`JobBeagle`（或您喜歡的名稱）
   - **已授權的 JavaScript 來源**：
     ```
     http://localhost:3000
     https://your-domain.com  （如果是生產環境）
     ```
   - **已授權的重新導向 URI**：
     ```
     https://YOUR_SUPABASE_PROJECT_ID.supabase.co/auth/v1/callback
     ```
   - 點擊 **建立**
   - **複製** `用戶端 ID` 和 `用戶端密鑰`

### 2. 在 Supabase Dashboard 啟用 Google Provider

1. 登入 [Supabase Dashboard](https://app.supabase.com/)
2. 選擇您的專案
3. 左側選單 → **Authentication** → **Providers**
4. 找到 **Google** 並點擊
5. 啟用 Google provider：
   - 切換 **Enable Google provider** 為開啟
   - 貼上從 Google Cloud Console 複製的：
     - **Client ID (for OAuth)**
     - **Client Secret (for OAuth)**
6. 點擊 **Save**

### 3. 驗證設定

1. 重新整理您的網頁
2. 點擊 **Google** 登入按鈕
3. 應該會跳轉到 Google 登入頁面

## 注意事項

- **重新導向 URI 必須正確**：格式為 `https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback`
- **本地開發**：確保 `http://localhost:3000` 已加入已授權的 JavaScript 來源
- **生產環境**：記得將您的生產網域也加入已授權的來源和重新導向 URI

## 常見問題

### Q: 還是無法登入？
A: 檢查：
1. Google Cloud Console 中的重新導向 URI 是否正確
2. Supabase Dashboard 中的 Client ID 和 Secret 是否正確貼上
3. 瀏覽器控制台是否有其他錯誤訊息

### Q: 如何找到我的 Supabase Project ID？
A: 在 Supabase Dashboard 的專案設定中，或查看您的 Supabase URL：
- URL 格式：`https://YOUR_PROJECT_ID.supabase.co`
- Project ID 就是 `YOUR_PROJECT_ID` 部分
