# JobBeagle 瀏覽器插件

一鍵抓取 104 和 LinkedIn 職缺並發送到 JobBeagle 進行 AI 分析。

## 功能特色

- ✅ 支援 104 人力銀行
- ✅ 支援 LinkedIn
- ✅ 一鍵抓取完整職缺內容
- ✅ 自動發送到 JobBeagle 分析
- ✅ 無需手動複製貼上

## 安裝方式

### Chrome / Edge

1. 打開瀏覽器，進入擴充功能頁面
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`

2. 開啟右上角的「開發人員模式」

3. 點擊「載入未封裝項目」

4. 選擇 `browser-extension` 資料夾

5. 插件安裝完成！

### 圖示說明

目前插件使用 emoji 圖示（🐶）。如果需要正式圖示，請將以下圖片放入 `browser-extension` 資料夾：
- `icon16.png` (16x16)
- `icon48.png` (48x48)
- `icon128.png` (128x128)

## 使用方式

1. 瀏覽 104 或 LinkedIn 的職缺頁面

2. 點擊瀏覽器工具列的 JobBeagle 圖示

3. 點擊「抓取職缺並分析」按鈕

4. 插件會自動：
   - 抓取職缺完整內容
   - 發送到 JobBeagle 伺服器
   - 開啟分析頁面

5. 在分析頁面上傳履歷即可開始分析

## 開發模式

修改 `popup.js` 中的 API endpoint：

```javascript
// 生產環境
const API_ENDPOINT = 'https://www.jobbeagle.com/api/extension-capture';

// 開發環境
const API_ENDPOINT = 'http://localhost:3000/api/extension-capture';
```

## 隱私保護

- ✅ 插件只在職缺頁面運行
- ✅ 不會收集個人瀏覽記錄
- ✅ 只抓取職缺公開資訊
- ✅ 數據僅用於 AI 分析

## 技術支援

如有問題，請訪問：https://www.jobbeagle.com
