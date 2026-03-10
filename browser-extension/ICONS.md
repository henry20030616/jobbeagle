# 圖示製作說明

插件需要 3 個尺寸的圖示檔案：
- `icon16.png` (16x16 像素)
- `icon48.png` (48x48 像素)
- `icon128.png` (128x128 像素)

## 🎨 方式 1：使用現有的 SVG（推薦）

我們已經提供了 `icon.svg` 檔案，你可以：

### 線上轉換：
1. 訪問 https://cloudconvert.com/svg-to-png
2. 上傳 `icon.svg`
3. 設定輸出尺寸（依序製作 16x16, 48x48, 128x128）
4. 下載並重新命名為對應檔名

### 使用 ImageMagick（命令列）：
```bash
# 在 browser-extension 目錄下執行
convert icon.svg -resize 16x16 icon16.png
convert icon.svg -resize 48x48 icon48.png
convert icon.svg -resize 128x128 icon128.png
```

---

## 🎨 方式 2：使用線上設計工具

### Canva
1. 訪問 https://www.canva.com
2. 建立自訂尺寸（128x128）
3. 設計圖示（建議：米格魯狗 + JobBeagle 文字）
4. 下載為 PNG
5. 使用線上工具調整為其他尺寸

### Figma
1. 建立 128x128 的 Frame
2. 設計圖示
3. 匯出為 PNG（可一次匯出多個尺寸）

---

## 🎨 方式 3：使用 Emoji（臨時方案）

如果暫時沒有圖示，插件會使用 emoji 🐶 作為預設圖示。

---

## 💡 設計建議

### 配色
- 主色：`#667eea` (紫藍色)
- 次色：`#764ba2` (紫色)
- 文字：白色

### 元素
- 可愛的米格魯狗（與品牌形象一致）
- JobBeagle 文字（可選，小尺寸時可省略）
- 簡潔明瞭，一眼就能認出

### 注意事項
- 背景建議使用漸層（紫藍色 → 紫色）
- 圖示要在小尺寸（16x16）時也清晰可辨
- 使用圓角（24px）與現代化設計語言
