# 🚀 快速開始 - 5 分鐘上手

## 步驟 1：製作圖示（30秒）

```bash
cd browser-extension

# 線上轉換 icon.svg 為 PNG（訪問以下網址）
# https://cloudconvert.com/svg-to-png
# 分別製作 16x16、48x48、128x128 三個尺寸

# 或使用 ImageMagick（如果已安裝）
convert icon.svg -resize 16x16 icon16.png
convert icon.svg -resize 48x48 icon48.png
convert icon.svg -resize 128x128 icon128.png
```

**注意**：如果沒有圖示檔案，插件仍可運行，會使用預設圖示。

---

## 步驟 2：安裝插件（1分鐘）

### Chrome / Edge

1. 打開 `chrome://extensions/`（Chrome）或 `edge://extensions/`（Edge）
2. 開啟右上角「**開發人員模式**」
3. 點擊「**載入未封裝項目**」
4. 選擇 `browser-extension` 資料夾
5. 完成！確認版本為 **1.1.0**（含 Side Panel + POST 傳輸）

**提示**：點擊瀏覽器右上角的 🧩 圖示，將 JobBeagle 釘選到工具列。每次更新程式後請在此頁點 **重新載入**。

---

## 步驟 3：測試插件（2分鐘）

### 測試環境

確保開發伺服器正在運行：
```bash
npm run dev
```

### 修改測試配置

編輯 `popup.js` 第 3 行：
```javascript
const WEBSITE_URL = 'http://localhost:3001';  // 本地測試
```

### 開始測試

1. 訪問一個 **104 職缺**頁面
   - 例如：https://www.104.com.tw/job/7zzzz

2. 點擊瀏覽器工具列的 **JobBeagle 圖示**

3. 點擊「**📋 抓取職缺並分析**」

4. 應該會：
   - ✅ 自動開啟 `localhost:3001`
   - ✅ 職缺描述欄位自動填充
   - ✅ 顯示完整的職缺資訊

5. **上傳履歷** → 點擊「**啟動 AI 戰略分析**」

---

## 步驟 4：發佈到生產環境（1分鐘）

### 修改配置

編輯 `popup.js` 第 3 行：
```javascript
const WEBSITE_URL = 'https://www.jobbeagle.com';  // 正式網站
```

### 重新載入插件

1. 回到 `chrome://extensions/`
2. 找到 JobBeagle 插件
3. 點擊「🔄」重新載入
4. 完成！

### 測試正式環境

在實際的 104 或 LinkedIn 職缺頁面測試一次。

---

## 📋 功能確認清單

安裝完成後，請確認：

- [ ] 插件圖示出現在工具列
- [ ] 在 104 職缺頁面點擊插件，顯示「已檢測到職缺頁面」
- [ ] 點擊「抓取職缺並分析」後，自動開啟 JobBeagle
- [ ] 職缺描述欄位自動填充內容
- [ ] 原有的手動輸入功能仍然正常
- [ ] 在非職缺頁面，插件顯示錯誤提示

---

## 🎉 完成！

現在你可以：
1. 在 104/LinkedIn 瀏覽職缺
2. 一鍵抓取並分析
3. 不再需要手動複製貼上！

**效率提升 10 倍！** 🚀

---

## 💡 提示

- 第一次使用時，瀏覽器可能會詢問權限，請點擊「允許」
- 如果抓取內容不完整，可以手動補充或使用原本的複製貼上方式
- LinkedIn 職缺需要登入才能看到完整內容
- 插件只在職缺頁面運作，不會影響其他網頁

---

需要協助？查看 `INSTALL.md` 或 `TESTING.md` 獲取更多資訊。
