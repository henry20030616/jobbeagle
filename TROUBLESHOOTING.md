# Google OAuth 故障排除指南

## 常見問題與解決方案

### 1. 錯誤：`"Unsupported provider: provider is not enabled"`

**原因**：Google OAuth Provider 未在 Supabase 中啟用

**解決步驟**：

1. **登入 Supabase Dashboard**
   - 前往 https://app.supabase.com/
   - 選擇您的專案

2. **啟用 Google Provider**
   - 左側選單 → **Authentication** → **Providers**
   - 找到 **Google** 並點擊
   - 切換 **Enable Google provider** 為 **開啟**

3. **設定 OAuth 憑證**
   - 您需要先在 Google Cloud Console 建立 OAuth 憑證
   - 詳細步驟請參考 `GOOGLE_OAUTH_SETUP.md`

4. **填入憑證**
   - 在 Supabase Dashboard 的 Google Provider 設定頁面
   - 貼上 **Client ID (for OAuth)**
   - 貼上 **Client Secret (for OAuth)**
   - 點擊 **Save**

### 2. 錯誤：`"redirect_uri_mismatch"`

**原因**：Google Cloud Console 中的重新導向 URI 設定不正確

**解決步驟**：

1. **檢查 Supabase 專案 URL**
   - 格式：`https://YOUR_PROJECT_ID.supabase.co`
   - 可以在 Supabase Dashboard 的專案設定中找到

2. **更新 Google Cloud Console 設定**
   - 前往 [Google Cloud Console](https://console.cloud.google.com/)
   - 選擇您的專案
   - **API 和服務** → **憑證**
   - 點擊您的 OAuth 2.0 用戶端 ID
   - 在 **已授權的重新導向 URI** 中添加：
     ```
     https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback
     ```
   - 確保完全匹配，包括 `https://` 和結尾的 `/auth/v1/callback`
   - 點擊 **儲存**

### 3. 錯誤：`"invalid_client"`

**原因**：Client ID 或 Client Secret 不正確

**解決步驟**：

1. **檢查 Supabase Dashboard 中的憑證**
   - 前往 **Authentication** → **Providers** → **Google**
   - 確認 Client ID 和 Client Secret 是否正確貼上
   - 注意：不要有多餘的空格或換行

2. **重新複製憑證**
   - 從 Google Cloud Console 重新複製
   - 確保完整複製，沒有遺漏任何字符

### 4. 登入後沒有跳轉回網站

**原因**：Callback 路由可能有問題

**檢查項目**：

1. **確認 Callback 路由存在**
   - 檔案路徑：`app/auth/callback/route.ts`
   - 應該存在且可訪問

2. **檢查環境變數**
   - 確認 `.env.local` 中有：
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
     ```

3. **檢查瀏覽器控制台**
   - 打開開發者工具（F12）
   - 查看 Console 和 Network 標籤
   - 尋找錯誤訊息

### 5. 本地開發環境問題

**如果使用 localhost**：

1. **Google Cloud Console 設定**
   - 在 **已授權的 JavaScript 來源** 中添加：
     ```
     http://localhost:3000
     ```
   - 在 **已授權的重新導向 URI** 中添加：
     ```
     https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback
     ```
   - 注意：重新導向 URI 必須是 Supabase 的 URL，不是 localhost

2. **Supabase 設定**
   - 在 Supabase Dashboard → **Authentication** → **URL Configuration**
   - 確認 **Site URL** 設定為：`http://localhost:3000`
   - 在 **Redirect URLs** 中添加：`http://localhost:3000/**`

### 6. 調試技巧

**啟用詳細日誌**：

1. **瀏覽器控制台**
   - 打開開發者工具（F12）
   - 查看 Console 標籤
   - 現在登入按鈕會輸出詳細的調試信息

2. **檢查 Network 請求**
   - 在 Network 標籤中
   - 尋找對 Supabase 的請求
   - 檢查狀態碼和回應內容

3. **Supabase Dashboard 日誌**
   - 前往 **Logs** → **Auth Logs**
   - 查看認證相關的日誌

### 7. 驗證設定是否正確

**檢查清單**：

- [ ] Google Cloud Console 中已建立 OAuth 2.0 憑證
- [ ] Google Cloud Console 中的重新導向 URI 正確設定
- [ ] Supabase Dashboard 中 Google Provider 已啟用
- [ ] Supabase Dashboard 中 Client ID 和 Secret 已正確填入
- [ ] 環境變數 `.env.local` 已正確設定
- [ ] Callback 路由 `app/auth/callback/route.ts` 存在
- [ ] 瀏覽器控制台沒有其他錯誤

### 8. 仍然無法解決？

**請提供以下信息**：

1. 瀏覽器控制台的完整錯誤訊息
2. Network 標籤中的相關請求（特別是 Supabase 的請求）
3. Supabase Dashboard 中 Google Provider 的設定截圖（隱藏敏感信息）
4. 您是否已經完成所有設定步驟

## 快速檢查命令

在專案根目錄執行：

```bash
# 檢查環境變數是否設定
node -e "console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ 已設定' : '❌ 未設定'); console.log('KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ 已設定' : '❌ 未設定');"
```

注意：這需要在 `.env.local` 文件存在的情況下執行。
