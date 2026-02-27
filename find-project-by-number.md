# 如何找到 Project number 774684982419 對應的專案

## 問題說明
- Google AI Studio 顯示的 Project number: `774684982419`
- Google Cloud Console 帳單頁面只顯示 Project ID，不顯示 Project number
- 需要找到 Project number `774684982419` 對應的專案

## 解決方法

### 方法 1: 在 Google Cloud Console 查看專案詳情
1. 前往：https://console.cloud.google.com/home/dashboard
2. 點擊專案選擇器（頂部顯示目前專案的地方）
3. 分別點擊每個 jobbeagle 專案：
   - `gen-lang-client-0459682640`
   - `gen-lang-client-0292265367`
   - `jobbeagle`
4. 進入專案後，在專案資訊頁面查看 "Project number"
5. 找到 Project number 為 `774684982419` 的專案

### 方法 2: 使用 gcloud CLI（如果有安裝）
```bash
gcloud projects list --format="table(projectId,name,projectNumber)"
```
這會列出所有專案及其 Project number

### 方法 3: 透過 API 查詢（需要認證）
可以使用 Google Cloud API 來查詢專案資訊

## 快速檢查
由於 Project number `774684982419` 不在帳單頁面的三個 jobbeagle 專案中，可能：
1. 這個 API Key 屬於另一個專案（不在帳單頁面顯示）
2. 需要在 Google Cloud Console 中搜尋所有專案

## 建議
先檢查 `gen-lang-client-0459682640`（唯一有付費帳單的），如果 Project number 不匹配，再檢查其他專案。
