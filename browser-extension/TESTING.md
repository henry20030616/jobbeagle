# 測試插件

## 🧪 本地測試流程

### 1. 準備環境

確保你的 Next.js 開發伺服器正在運行：
```bash
npm run dev
```

應該會顯示：
```
- Local:        http://localhost:3001
```

### 2. 修改插件配置

編輯 `popup.js`，將網址改為本地：

```javascript
// 第 3-4 行
const WEBSITE_URL = 'http://localhost:3001';
// 開發環境使用這個
```

### 3. 安裝插件

1. 打開 `chrome://extensions/`
2. 啟用「開發人員模式」
3. 點擊「載入未封裝項目」
4. 選擇 `browser-extension` 資料夾

### 4. 測試抓取功能

#### 測試 104

1. 訪問任一 104 職缺，例如：
   ```
   https://www.104.com.tw/job/7zzzz
   ```

2. 點擊插件圖示

3. 應該顯示：「✅ 已檢測到職缺頁面」

4. 點擊「抓取職缺並分析」

5. 檢查：
   - [ ] 是否開啟了 `localhost:3001`
   - [ ] 職缺描述欄位是否自動填充
   - [ ] 內容是否完整（標題、公司、描述等）

#### 測試 LinkedIn

1. 訪問任一 LinkedIn 職缺，例如：
   ```
   https://www.linkedin.com/jobs/view/123456789
   ```

2. 執行相同測試流程

3. **注意**：LinkedIn 需要登入才能看完整內容

### 5. 調試技巧

#### 查看插件 Console

1. 在 `chrome://extensions/` 頁面
2. 找到 JobBeagle 插件
3. 點擊「檢查視圖」→「popup.html」
4. 會打開 DevTools，可以看到 console.log 輸出

#### 查看網頁 Console

在 JobBeagle 網站頁面：
1. 按 `F12` 打開 DevTools
2. 查看 Console 標籤
3. 搜尋 `[Extension]` 關鍵字

### 6. 常見問題

#### 抓取到的內容為空

**原因**：網站的 HTML 結構可能改變

**解決**：
1. 打開 `popup.js`
2. 找到 `extractJobData()` 函數
3. 使用瀏覽器 DevTools 檢查實際的 CSS 選擇器
4. 更新選擇器

#### URL 參數沒有傳遞

**原因**：瀏覽器安全限制

**解決**：
- 檢查 `manifest.json` 的 `host_permissions`
- 確認網站 URL 正確
- 嘗試使用 localStorage 方案（已實作）

---

## ✅ 測試檢查清單

開發完成後，請確認：

- [ ] 插件在 104 職缺頁面可正常運作
- [ ] 插件在 LinkedIn 職缺頁面可正常運作
- [ ] 抓取的內容包含：標題、公司、描述
- [ ] 自動開啟 JobBeagle 網站
- [ ] 職缺描述自動填充到表單
- [ ] 原有的手動輸入功能仍然正常
- [ ] 在非職缺頁面，插件會提示錯誤
- [ ] Console 沒有錯誤訊息

---

## 🚢 發佈前準備

### 1. 切換為生產環境

```javascript
const WEBSITE_URL = 'https://www.jobbeagle.com';
```

### 2. 製作正式圖示

參考 `ICONS.md` 製作 16x16、48x48、128x128 三個尺寸

### 3. 測試生產環境

在實際網站上測試一次完整流程

### 4. 準備發佈（可選）

如果要發佈到 Chrome Web Store：
- 準備宣傳圖片（1280x800, 640x400）
- 撰寫詳細說明
- 準備隱私政策文件
- 支付一次性費用（$5 USD）

---

**開發愉快！** 🎉
