# 確認 API Key 對應的專案

## 從 Google AI Studio 看到的資訊：
- **API Key**: `AlzaSyBZGYzydNZT_wfPprgQSfe5cbyiCkAkHtc`
- **Project number**: `774684982419`

## 確認步驟：

### 方法 1: 在 Google Cloud Console 中查看專案詳情
1. 前往：https://console.cloud.google.com/home/dashboard
2. 分別點擊每個 jobbeagle 專案
3. 在專案詳情頁面查看 "Project number"
4. 找到 Project number 為 `774684982419` 的專案

### 方法 2: 根據帳單狀態判斷
根據帳單頁面：
- **`gen-lang-client-0459682640`** - ✅ 有帳單帳戶（付費狀態）
- **`gen-lang-client-0292265367`** - ❌ 已停用計費功能
- **`jobbeagle`** - ❌ 已停用計費功能

**建議選擇：`gen-lang-client-0459682640`**
- 這是唯一有付費帳單的 jobbeagle 專案
- 符合你說的「API 帳號是付費狀態」

### 方法 3: 直接測試
1. 在 Google Cloud Console 選擇 `gen-lang-client-0459682640`
2. 前往：https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas
3. 檢查配額設定
4. 如果配額設定正確，就是這個專案

## 下一步：
選擇 `gen-lang-client-0459682640` 專案後：
1. 檢查配額設定：https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas
2. 查看使用量：https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/metrics
3. 確認 Vercel 環境變數是否正確設定
