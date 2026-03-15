# Gemini 模型升級筆記

## 📅 升級日期：2026-03-08

### 🔄 升級內容

將所有 Gemini 模型統一升級為：**`gemini-3.1-flash-lite-preview`**

**舊版本**：
- ❌ `gemini-2.0-flash-lite`
- ❌ `gemini-2.5-flash-lite`

**新版本**：
- ✅ `gemini-3.1-flash-lite-preview`

---

## 🏗️ 架構重構：集中式配置管理

為了避免未來需要手動修改多個檔案，建立了**集中式模型配置系統**：

### TypeScript 配置

📁 **`constants/models.ts`**
```typescript
export const GEMINI_ANALYSIS_MODEL = 'gemini-3.1-flash-lite-preview';
export const GEMINI_VIDEO_MODEL = 'gemini-3.1-flash-lite-preview';
export const GEMINI_DEFAULT_MODEL = 'gemini-3.1-flash-lite-preview';
```

**使用方式**：
```typescript
import { GEMINI_ANALYSIS_MODEL } from '@/constants/models';

const model = GEMINI_ANALYSIS_MODEL;  // ✅ 使用常數
```

### Python 配置

📁 **`video-generator/config.py`**
```python
GEMINI_MODEL = "gemini-3.1-flash-lite-preview"

def get_gemini_url(model: str = GEMINI_MODEL) -> str:
    return f"{GEMINI_API_BASE}/{model}:generateContent"
```

**使用方式**：
```python
from config import get_gemini_url

self.gemini_url = get_gemini_url()  # ✅ 使用函數生成 URL
```

---

## 📝 修改的檔案清單

### 核心 API 路由
1. ✅ `app/api/analyze/route.ts` - 職缺分析 API
2. ✅ `app/api/shorts/route.ts` - 短影片生成 API

### 服務層
3. ✅ `jobbeagle.live/services/geminiService.ts` - Gemini 服務
4. ✅ `video-generator/video_engine.py` - 影片生成引擎

### 工具與測試
5. ✅ `test-connection.ts` - 連線測試工具

### UI 組件（註解更新）
6. ✅ `components/shorts/CreatorStudio.tsx`
7. ✅ `jobbeagle.live/components/CreatorStudio.tsx`

### 文檔
8. ✅ `README.md` - 技術架構說明

### 新增配置檔案
9. ✨ `constants/models.ts` - TypeScript 模型常數
10. ✨ `video-generator/config.py` - Python 模型配置

---

## 🎯 未來升級流程

### 下次收到 Google 遷徙通知時

**以前**（需要改 8+ 個檔案）：
```bash
# ❌ 需要逐一修改每個檔案
app/api/analyze/route.ts
app/api/shorts/route.ts
test-connection.ts
...（還有很多）
```

**現在**（只需改 2 個檔案）：
```bash
# ✅ 只需修改配置檔案
constants/models.ts          # TypeScript 專案
video-generator/config.py    # Python 專案
```

### 具體步驟

1. **修改 TypeScript 配置**：
   ```typescript
   // constants/models.ts
   export const GEMINI_ANALYSIS_MODEL = 'gemini-新版本名稱';
   ```

2. **修改 Python 配置**：
   ```python
   # video-generator/config.py
   GEMINI_MODEL = "gemini-新版本名稱"
   ```

3. **提交並推送**：
   ```bash
   git add constants/models.ts video-generator/config.py
   git commit -m "chore: upgrade Gemini model to 新版本"
   git push origin main
   ```

4. **完成！** Vercel 會自動部署

---

## ✅ 驗證清單

升級後請確認：

- [ ] 職缺分析功能正常運作
- [ ] 短影片生成功能正常運作
- [ ] 測試連線工具正常運作
- [ ] 無 TypeScript 編譯錯誤
- [ ] Vercel 部署成功
- [ ] 正式網站功能正常

---

## 📊 影響範圍

### 影響的功能
- ✅ 職缺分析（主要功能）
- ✅ 面試準備建議
- ✅ 短影片腳本生成
- ✅ API 連線測試

### 不影響的功能
- ✅ 履歷上傳
- ✅ Supabase 資料庫
- ✅ UI 介面
- ✅ 瀏覽器插件

---

## 🔐 注意事項

### API Key
- 確保 `.env.local` 中的 `GEMINI_API_KEY` 仍然有效
- 如果遇到 `400 Bad Request`，可能需要更新 API Key

### 模型相容性
- `gemini-3.1-flash-lite-preview` 是預覽版，未來可能調整
- Google 正式發布穩定版後，可能需要再次升級為 `gemini-3.1-flash-lite`

### 成本
- Flash-Lite 系列為低成本模型
- 新版本可能有不同的計價方式，請參考 Google AI Studio 定價

---

## 🚀 已完成

- ✅ 所有程式碼已升級為 `gemini-3.1-flash-lite-preview`
- ✅ 建立集中式配置管理系統
- ✅ 更新所有文檔和註解
- ✅ 已推送到 GitHub
- ✅ Vercel 自動部署中（約 2-3 分鐘）

---

**下次升級將會輕鬆 10 倍！** 🎉
