# Jobbeagle - 職位分析米格魯

專家級 AI 職缺戰略分析中心：結合求職專家分析與獵頭視角，助您掌握應對策略。

## 功能特色

- **人才職位匹配分析**：揭示職位隱藏門檻，精準評估核心優勢與缺口
- **薪酬體系與評價深度研究**：提供客觀市場估值、談判籌碼分析及員工真實反饋
- **產業格局與競爭者分析**：從求職專家視角解析公司的市場護城河與未來風險
- **高階面試模擬與對策**：網羅真實考題並提供具備深度邏輯的 STAR 回答引導

## 技術架構

- **前端框架**：Next.js 15 (App Router)
- **UI 框架**：React 19 + Tailwind CSS
- **AI 服務**：Google Gemini 3 Pro
- **資料庫**：Supabase (PostgreSQL)
- **圖表庫**：Recharts

## 安裝步驟

1. **安裝依賴**
   ```bash
   npm install
   ```

2. **設定環境變數**
   
   複製 `.env.example` 並建立 `.env.local`：
   ```bash
   cp .env.example .env.local
   ```
   
   填入以下資訊：
   - `GEMINI_API_KEY`: 您的 Google Gemini API Key
   - `NEXT_PUBLIC_SUPABASE_URL`: 您的 Supabase 專案 URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: 您的 Supabase Anon Key

3. **設定 Supabase 資料庫**
   
   在 Supabase SQL Editor 中執行 `supabase-schema.sql` 檔案中的 SQL 語句，建立所需的資料表。

4. **啟動開發伺服器**
   ```bash
   npm run dev
   ```

   開啟 [http://localhost:3000](http://localhost:3000) 查看應用程式。

## 資料庫結構

### analysis_reports
儲存分析報告的主要資料表：
- `id`: UUID 主鍵
- `job_description`: 職缺描述文字
- `resume_file_name`: 履歷檔案名稱
- `resume_type`: 履歷類型 (text/file)
- `report_data`: 完整的分析報告 JSON 資料
- `created_at`: 建立時間

### resume_history
儲存履歷歷史記錄：
- `id`: UUID 主鍵
- `type`: 履歷類型 (text/file)
- `content`: 履歷內容（Base64 編碼或文字）
- `mime_type`: MIME 類型
- `file_name`: 檔案名稱
- `created_at`: 建立時間

## 專案結構

```
jobbeagle/
├── app/
│   ├── api/
│   │   └── analyze/
│   │       └── route.ts          # Gemini API 端點
│   ├── globals.css               # 全域樣式
│   ├── layout.tsx                # 根布局
│   └── page.tsx                  # 主頁面
├── components/
│   ├── AnalysisDashboard.tsx     # 分析結果儀表板
│   └── InputForm.tsx             # 輸入表單
├── lib/
│   └── supabase.ts               # Supabase 客戶端設定
├── types.ts                      # TypeScript 類型定義
└── supabase-schema.sql           # 資料庫結構 SQL
```

## 使用方式

1. **輸入職缺資訊**：貼上職缺網址或完整描述
2. **上傳履歷**：上傳 PDF 或貼上文字履歷
3. **生成分析**：點擊「啟動 AI 戰略分析」按鈕
4. **查看報告**：系統會生成包含匹配度、薪資分析、市場分析、面試準備等完整報告

## 注意事項

- PDF 檔案大小限制為 4MB
- 分析報告會自動儲存到 Supabase 資料庫
- 履歷歷史記錄會保存在 Supabase 中，方便重複使用

## 授權

本專案為私有專案。
