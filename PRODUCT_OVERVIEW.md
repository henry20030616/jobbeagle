# JobBeagle — 產品與技術現況總覽

> **用途：** 把本文件貼給 Gemini（或其他顧問），完整說明網站現況，並討論「還缺什麼、該優先改善什麼」。  
> **基準日：** 2026-07-11  
> **正式網域：** https://www.jobbeagle.com  
> **程式庫：** GitHub `henry20030616/jobbeagle`（`main`）  
> **企業架構／Cursor Rules 原文：** `ENTERPRISE_ARCHITECTURE.md`（規則檔在 `.cursor/rules/jobbeagle-*.mdc`）

---

## 1. 一句話定位

**JobBeagle** 是給求職者用的 **AI 職缺分流／獵頭級職缺分析** 產品：從職缺網一鍵抓取（或手動貼上）JD + 履歷 → 產出 **Lite Snapshot** 或 **Full Intel** 報告 → 用額度制收費（Lemon Squeezy）。

目前產品重心偏向 **美國求職市場**（英文 JD、US tech recruiter 視角、Indeed / ZipRecruiter / Glassdoor），同時仍保留台灣 **104** 與多語 UI。

---

## 2. 目標使用者與價值主張

| 面向 | 現況 |
|------|------|
| **主要用戶** | 求職者（尤其美區科技／專業職） |
| **次要用戶** | 雇主（Shorts 職缺短影片招募） |
| **核心痛點** | JD 又長又雜、難判斷適不適合、缺談判與面試情報 |
| **價值主張** | 快速「值不值得投」分流 + 匹配分數 + 薪酬定位 + 缺口 + 面試準備；Full 再加即時網搜情報 |
| **差異化** | Chrome 外掛多站抓取 → Pre-Flight 確認 → 再扣額度分析（責任轉移給使用者確認資料） |

---

## 3. 主要功能與內容

### 3.1 求職者主流程（核心產品）

```
職缺頁（外掛）或首頁貼 JD
        ↓
  /pre-flight 確認公司／職稱／JD／履歷
        ↓
  選擇 Lite 或 Full → 登入（Google）
        ↓
  POST /api/analyze（扣額度 → Gemini → 報告）
        ↓
  LiteReportDashboard / FullReportDashboard
```

| 功能 | 說明 |
|------|------|
| **手動貼 JD** | 首頁 `/`：貼職缺描述 + 貼／上傳履歷（文字／PDF／DOCX） |
| **Chrome 外掛抓取** | 工具列圖示一鍵抓取 → 伺服器簽發 `sid` → 開 Pre-Flight |
| **Pre-Flight** | `/pre-flight`：確認抓取內容、貼履歷、選 Lite/Full、Launch |
| **Lite Snapshot** | 快速匹配分數、FLSA、Radford 薪酬矩陣、優勢／缺口、STAR 起手式；**無網搜** |
| **Full Intel** | 文化／評價情報、STAR 題庫、談判腳本等；**Gemini Pro + Google Search grounding** |
| **歷史紀錄** | 登入後可看過去分析（依 report_type） |
| **額度／付費牆** | 免費終身 3 次 Lite；用完顯示 `QuotaPaywallCard` |
| **Checkout** | Lemon Squeezy：單次 Lite/Full、月訂 Standard/Advanced |
| **推薦裂變** | `?ref=` 推薦碼；首次 Lite 後激活 |
| **帳戶刪除** | CCPA 被遺忘權：`/api/account/delete` |
| **報告保存** | 分析報告存 Supabase；single-drop 類 30 天 cron 清除 |

### 3.2 Lite vs Full（報告內容差異）

| | **Lite** | **Full** |
|--|----------|----------|
| **模型** | `gemini-2.5-flash-lite` | `gemini-2.5-pro` |
| **網搜** | 無 | Google Search grounding |
| **典型輸出** | match score、hard requirements、strengths/gaps、Radford 薪酬、FLSA、簡短 STAR | 文化／Glassdoor 類情報、完整 STAR、談判腳本等 |
| **額度池** | `lite_credits` | `full_credits`（分開扣） |
| **定價錨點** | 單次 $3 | 單次 $9.99 |

### 3.3 Chrome 外掛（v1.2.0）

| 項目 | 內容 |
|------|------|
| **名稱** | JobBeagle - Headhunter-Level Job Triage |
| **版本** | **1.2.0**（Manifest V3） |
| **支援網站** | LinkedIn、**Indeed**、**ZipRecruiter**、**Glassdoor**、台灣 104 |
| **架構** | `background.js`（點擊 → 注入 → POST capture → 開分頁）+ `scrape-page.js`（各站 scraper） |
| **Handoff** | `POST /api/extension-capture` → 簽名 `sid`（約 30 分鐘）→ `/pre-flight?sid=` |
| **安裝方式** | 尚未上架 Chrome Web Store；開發者模式「載入未封裝」 |

### 3.4 Shorts／雇主（次要產品線）

| 功能 | 路徑／API |
|------|-----------|
| 職缺短影片 Feed | `/shorts` |
| 雇主上傳／發布 | `/shorts/upload`、`/api/shorts/*` |
| 公司頁 | `/shorts/company/[id]` |
| 雇主登入／後台 | `/employer/login`、`/employer/dashboard` |
| 應徵通知 | Resend email（若有設定） |
| AI 腳本輔助 | Gemini 產短影片腳本／視覺描述 |

> 與「獵頭級 JD 分析」是同一帳號體系，但產品敘事上較像第二條線。

### 3.5 其他頁面

- `/privacy`、`/terms` — 法律頁  
- `/auth/callback` — Google OAuth 回調  

---

## 4. 商業模式與額度

### 4.1 免費層

- **終身 3 次 Lite**（`FREE_LIFETIME_LITE_CREDITS = 3`）
- **不會**每日／每月重置
- Full 預設 **0**
- 新帳號有裝置指紋（Sybil）防護邏輯

### 4.2 付費方案（Lemon Squeezy，USD）

| 方案 | 價格 | 內容 |
|------|------|------|
| Single Lite | $3 | +1 Lite |
| Single Full | $9.99 | +1 Full |
| Standard 訂閱 | $19.99/月 | 100 Lite + 10 Full |
| Advanced 訂閱 | $39.99/月 | 300 Lite + 30 Full |

（程式內仍留有舊方案別名以相容 webhook／歷史資料。）

### 4.3 扣款時機（分析 API）

1. 需登入  
2. 檢查額度（不足 → 402 `PAYMENT_REQUIRED`）  
3. 可選 24h 快取命中則不重複扣（實作細節以 `app/api/analyze` 為準）  
4. 先扣額度再呼叫 AI；失敗可退回  

---

## 5. 技術堆棧

### 5.1 前端／應用

| 層 | 技術 |
|----|------|
| Framework | **Next.js 15**（App Router） |
| UI | **React 19** + **Tailwind CSS 3** |
| 語言 | **TypeScript 5** |
| 圖示／圖表 | lucide-react、recharts |
| PDF／履歷 | jspdf、html2canvas、mammoth（DOCX） |

### 5.2 後端／基礎設施

| 層 | 技術 |
|----|------|
| Hosting | **Vercel**（production：jobbeagle.com） |
| Auth + DB | **Supabase**（Auth Google OAuth + PostgreSQL + Storage） |
| AI | **Google Gemini** via `@google/genai` |
| 金流 | **Lemon Squeezy**（Checkout + Webhook） |
| Email | **Resend**（選用） |
| Analytics | Google Analytics（`NEXT_PUBLIC_GA_MEASUREMENT_ID`） |
| Cron | Vercel Cron → `/api/cron/purge-reports` |

### 5.3 AI 模型設定（`constants/models.ts`）

| 用途 | 實際 model id |
|------|----------------|
| Lite 分析 | `gemini-2.5-flash-lite` |
| Full 分析 | `gemini-2.5-pro`（+ Google Search） |
| Token 預檢 | `gemini-2.5-flash-lite` |
| Shorts 腳本 | 同 Lite 模型 |

> 註：文件／註解有時寫「Gemini 3.1」，**實際呼叫以 `constants/models.ts` 為準**。換模型只需改該檔並 redeploy。

### 5.4 測試與品質

- Unit / API：`Vitest`（`npm test`）  
- E2E：`Playwright`（`npm run test:e2e`）  
- Lint：ESLint + `eslint-config-next`

### 5.5 主要 API 一覽

| API | 用途 |
|-----|------|
| `POST /api/analyze` | 核心分析（auth、額度、Gemini、存檔） |
| `POST/GET /api/extension-capture` | 外掛 handoff `sid` |
| `POST/GET /api/checkout` | 建立 LS checkout／方案列表 |
| `POST /api/payment/webhook` | LS webhook 發放額度 |
| `GET /api/profile` | 使用者 profile／額度 |
| `GET /api/reports/[id]` | 讀取報告 |
| `POST /api/account/delete` | 硬刪帳戶 |
| `GET /api/cron/purge-reports` | 清除過期報告 |
| `GET /api/check-env` | 環境變數健康檢查 |
| `/api/shorts/*` | Shorts 上傳／發布／應徵／觀看 |

### 5.6 資料（Supabase，概念）

- `profiles` — 額度、會員層級、指紋等  
- `analysis_reports` — Lite/Full／舊版報告  
- `referrals` — 推薦  
- Shorts 相關表 + Storage bucket（影片）  
- 訂單／訂閱狀態由 webhook 寫回  

### 5.7 環境變數類別（不含密鑰值）

- **Supabase：** `NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`、`SUPABASE_SERVICE_ROLE_KEY`  
- **Gemini：** `GEMINI_API_KEY` 或 `GOOGLE_GEMINI_API_KEY`  
- **Lemon Squeezy：** API key、store id、webhook secret、各 `VARIANT_*`、test mode  
- **外掛／Cron：** `CRON_SECRET`、可選 `EXTENSION_HANDOFF_SECRET`  
- **其他：** `RESEND_API_KEY`、`NEXT_PUBLIC_GA_MEASUREMENT_ID`  
- **遺留：** Stripe 相關變數／`lib/stripe.ts` 視為死碼（已改 LS）

---

## 6. 系統架構簡圖

```
┌─────────────────┐     scrape      ┌──────────────────┐
│ Chrome Extension│ ───────────────► │ LinkedIn/Indeed/ │
│     v1.2.0      │                  │ Zip/Glassdoor/104│
└────────┬────────┘                  └──────────────────┘
         │ POST /api/extension-capture
         ▼
┌─────────────────┐     sid      ┌─────────────────┐
│  Next.js (Vercel)│◄───────────►│   /pre-flight   │
│  App Router      │             └────────┬────────┘
└────────┬────────┘                      │ POST /api/analyze
         │                               ▼
         │                    ┌─────────────────────┐
         ├───────────────────►│ Google Gemini API   │
         │                    └─────────────────────┘
         ├───────────────────►│ Supabase Auth + DB  │
         └───────────────────►│ Lemon Squeezy       │
```

---

## 7. 已完成 vs 刻意不做／已知落差

### 7.1 已上線／已實作（摘要）

- Lite / Full 雙報告 + UI dashboard  
- Google 登入強制分析  
- 誘餌定價四方案 + LS webhook  
- 外掛 → Pre-Flight 責任轉移  
- 終身 3 Lite + 付費牆  
- 推薦碼、帳戶刪除、報告 30 天清除  
- Shorts 基礎流程  
- 美國主流職缺站外掛支援（v1.2.0）

### 7.2 刻意不做或與舊規格落差

| 項目 | 說明 |
|------|------|
| LinkedIn OAuth 登入 | 僅 Google；LinkedIn 只做「抓職缺」不做登入 |
| Stripe | 已棄用，改 Lemon Squeezy |
| Chrome Web Store 上架 | 尚未；需手動 load unpacked |
| Lite+Full 合併同一畫面 | 目前兩種報告分開 |
| 雇主獨立完整 Hub | 偏 Shorts；舊 dashboard 有 legacy 模式 |
| 「所有職缺網」 | 不可能一次做完；採主流站白名單 |

### 7.3 已知產品／技術風險（討論用）

1. **外掛脆弱性：** 各站 DOM 常改 → scraper 易壞（LinkedIn 已反覆修過）  
2. **抓取品質：** 易混入廣告／頁尾；需持續 trim  
3. **未上架商店：** 安裝摩擦大，不利美國獲客  
4. **額度 0 體驗：** 免費用完即牆，轉換漏斗是否夠清楚  
5. **雙產品線注意力：** Shorts vs 核心分析是否該收斂  
6. **README／行銷文案過時：** 仍寫舊模型名、舊外掛範圍  
7. **Stripe 死碼／舊方案：** 增加維護噪音  
8. **模型升級路徑：** 需人工改 `constants/models.ts` 並驗證 schema  
9. **i18n：** 多語存在但產品主敘事已轉美國英文市場  
10. **機構管理的 Chrome：** 權限／外掛政策可能擋使用者  

---

## 8. 建議給 Gemini 的討論題目（可直接複製）

請 Gemini 依本文件回答時，可附上下列問題：

1. **產品聚焦：** 美國求職者核心流程 vs Shorts 雇主線，短期該砍／凍哪一條？  
2. **獲客：** 沒有 Chrome Web Store 時，最有效的安裝與激活路徑？  
3. **定價：** $3 / $9.99 / $19.99 / $39.99 對美國求職者是否合理？免費 3 Lite 是否太少或太多？  
4. **差異化：** 相對 Teal、Jobscan、ChatGPT 自助分析，JobBeagle 該強化哪 3 個賣點？  
5. **外掛策略：** 白名單站（LinkedIn/Indeed/Zip/Glassdoor）夠不夠？下一批該加誰（Greenhouse/Lever/Wellfound/Monster）？  
6. **報告品質：** Lite 該更短更「決策導向」，還是更像完整顧問報告？  
7. **信任與合規：** 抓取職缺網 ToS、履歷隱私、CCPA 還缺什麼披露？  
8. **技術債優先序：** 清 Stripe 死碼、統一文案、外掛自動回歸測試、模型 A/B，哪個 ROI 最高？  
9. **轉換漏斗：** Pre-Flight → 付費牆之間，文案與 UX 怎麼改最能提升付費？  
10. **Roadmap 90 天：** 請排出 P0/P1/P2 改善清單（含「不要做」清單）。

---

## 9. 給顧問的「現況一句話」

JobBeagle 是已上線的 **Next.js 15 + Supabase + Gemini + Lemon Squeezy** 求職分析 SaaS，核心是 **額度制 Lite/Full 報告** 與 **Chrome 外掛多站抓取 → Pre-Flight**；市場敘事正從台灣轉向 **美國主流職缺網**，同時帶有一條尚未完全收斂的 **Shorts 雇主短影片** 產品線。最大執行風險在 **外掛穩定性、商店分發、付費轉換與產品焦點**。

---

## 10. 關鍵檔案索引（方便工程討論）

| 主題 | 路徑 |
|------|------|
| 額度常數 | `constants/credits.ts` |
| 模型 | `constants/models.ts` |
| 定價 | `constants/checkout-plans.ts` |
| 分析 API | `app/api/analyze/route.ts` |
| 外掛 handoff | `app/api/extension-capture/route.ts`、`lib/extension-handoff.ts` |
| Gemini 呼叫 | `lib/gemini-analyze.ts`、`lib/prompts/` |
| Pre-Flight UI | `app/pre-flight/page.tsx` |
| 外掛 | `browser-extension/`（`manifest.json` v1.2.0） |
| 型別 | `types.ts` |
| 規格落差紀錄 | `SPEC_REMAINING.md` |
| 部署檢查 | `DEPLOY_CHECKLIST.md` |

---

*本文件由 repo 現況整理，若與線上行為不符，以 GitHub `main` + 正式站行為為準。*
