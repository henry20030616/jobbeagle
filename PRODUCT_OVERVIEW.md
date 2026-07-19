# JobBeagle — 網站現況完整介紹

> **基準日：** 2026-07-18  
> **正式網域：** https://www.jobbeagle.com  
> **程式庫：** GitHub `henry20030616/jobbeagle`（分支 `main`）  
> **用途：** 可貼給 Gemini／顧問，完整說明目前網站現況（不含特定任務指派）。

---

## 1. 一句話定位

**JobBeagle** 是給求職者用的 **AI 職缺分流／獵頭級職缺分析 SaaS**：從職缺網一鍵抓取（或手動貼上）JD + 履歷 → 產出 **Job Fit Snapshot** 或 **Interview Strategy Guide** → 以額度制收費。

- **市場重心：** 美國求職市場（英文 JD、US recruiter 視角）
- **金流：** **Lemon Squeezy only**（已棄用 Stripe）
- **品牌：** `Job`（白）+ `beagle`（藍）

---

## 2. 目標使用者與價值

| 面向 | 現況 |
|------|------|
| 主要用戶 | 求職者（尤其美區科技／專業職） |
| 次要用戶 | 雇主（Shorts 職缺短影片；非主投資線） |
| 痛點 | JD 又長又雜、難判斷適不適合投、缺薪酬與面試情報 |
| 價值 | 「值不值得投」分流 + 匹配分數 + 薪酬定位 + 缺口 + 面試準備 |
| 差異化 | Chrome 外掛多站抓取 → `/confirm` 確認資料 → 再扣額度分析 |

---

## 3. 產品術語

| 顯示名稱 | API / DB code | 舊別名（相容） |
|----------|---------------|----------------|
| **Job Fit Snapshot** | `job_fit_snapshot` | Lite |
| **Interview Strategy Guide** | `interview_strategy_guide` | Full |

短標籤：Snapshot / Strategy Guide（中文：匹配快照／面試策略）。

---

## 4. 核心使用者流程

```
職缺頁（Chrome 外掛）或首頁手動貼 JD
        ↓
  /confirm 確認公司／職稱／JD／履歷
  （舊路徑 /pre-flight 會 redirect 到 /confirm）
        ↓
  選擇 Snapshot 或 Strategy Guide → Google 登入
        ↓
  POST /api/analyze（檢查額度 → 扣額度 → Gemini → 存報告）
        ↓
  Snapshot 或 Strategy Guide 報告畫面
        ↓
  額度不足 → 付費牆 → Lemon Squeezy Checkout
```

### 4.1 首頁 `/`

三步驟：

1. **Job Information** — 貼完整職缺（需含公司名、職稱、內文），或用 Chrome 外掛抓取
2. **My Resume** — 上傳履歷（PDF／DOCX／文字）；Saved Resumes 庫
3. **Report type** — 選 Snapshot 或 Strategy Guide；額度顯示如  
   `Credits: Snapshot (n) + Strategy Guide (n) →`（連到 `/account`）

另支援：公開 ATS（Greenhouse／Lever）嘗試自動抓頁；LinkedIn 等需外掛或手動貼全文。

### 4.2 確認頁 `/confirm`

- 外掛 handoff 用簽名 `sid`（短時效）
- 確認 JD、選履歷、選報告類型、Launch
- 帳戶停用時會提示，且無法分析／結帳

### 4.3 兩種報告

| | **Job Fit Snapshot** | **Interview Strategy Guide** |
|--|----------------------|------------------------------|
| 模型 | `gemini-3.1-flash-lite` | `gemini-3.1-pro-preview`（單次完整產出，**不**先跑 Lite） |
| 網搜 | 無 | Google Search grounding |
| 內容 | 匹配分數、硬性條件、優劣勢／缺口、薪酬定位、簡短面試準備 | Snapshot 層 + 即時情報、STAR 題庫、談判腳本等（同一 Pro 回應） |
| 額度池 | Snapshot credits | Strategy Guide credits（分開扣） |
| 單次價 | $3 | $9.99 |

模型定義：`constants/models.ts`。

---

## 5. Chrome 外掛

| 項目 | 內容 |
|------|------|
| 名稱 | JobBeagle - Headhunter-Level Job Triage |
| 版本 | **1.3.0**（Manifest V3） |
| 支援站 | LinkedIn、Indeed、ZipRecruiter、Glassdoor、GovernmentJobs、台灣 104 |
| 流程 | 點工具列 → scrape → `POST /api/extension-capture` → 開 `/confirm?sid=…` |
| 商店 | **尚未送審 Chrome Web Store**（刻意暫緩）；本機「載入未封裝」 |
| 更新後 | 使用者需到 `chrome://extensions` 重新載入 |

草稿素材：`browser-extension/STORE_LISTING.md`。

---

## 6. 帳戶與合規

| 功能 | 說明 |
|------|------|
| 登入 | Google OAuth（Supabase）；分析／付款需登入 |
| `/account` | 額度、方案、帳單、推薦、停用／重新啟用、硬刪帳戶 |
| 停用 | `deactivated_at`；停用後無法 analyze／checkout |
| 硬刪 | `POST /api/account/delete`（CCPA） |
| 法律頁 | `/privacy`、`/terms` |
| 報告保存 | Supabase；部分類型約 30 天 cron 清除 |

---

## 7. 商業模式與定價

### 免費

- 終身 **3 次 Job Fit Snapshot**（不按日／月重置）
- Strategy Guide 預設 **0**
- 有裝置指紋等反濫用邏輯

### 付費（Lemon Squeezy，USD）

| 方案 | 價格 | 內容 |
|------|------|------|
| Single Snapshot | $3 | +1 Snapshot |
| Single Strategy Guide | $9.99 | +1 Strategy Guide |
| Standard 訂閱 | $19.99/月 | 100 Snapshot + 5 Strategy Guide |
| Advanced 訂閱 | $39.99/月 | 300 Snapshot + 15 Strategy Guide |

推薦裂變：`?ref=` 推薦碼；好友完成條件後發放獎勵。

**金流注意：** 程式已移除 Stripe；收款／提款走 Lemon Squeezy。

---

## 8. 技術堆棧

| 層 | 技術 |
|----|------|
| App | Next.js 15（App Router）、React 19、TypeScript 5、Tailwind |
| Host | Vercel → jobbeagle.com |
| Auth / DB / Storage | Supabase（Google OAuth、Postgres、RLS、Storage） |
| AI | Google Gemini（`@google/genai`） |
| 金流 | Lemon Squeezy |
| Email（選用） | Resend |
| Analytics（選用） | Google Analytics |
| 測試 | Vitest；Playwright（e2e 可選） |

### 主要 API

| API | 用途 |
|-----|------|
| `POST /api/analyze` | 核心分析（auth、額度、rate limit、Gemini、存檔） |
| `POST/GET /api/extension-capture` | 外掛 handoff |
| `POST/GET /api/checkout` | 建立結帳／方案 |
| `POST /api/payment/webhook` | 發放額度（驗簽＋等冪） |
| `/api/account/*` | 帳戶讀取／停用／啟用／刪除 |
| `/api/resumes` | 履歷庫 |
| `GET /api/reports/[id]` | 讀報告 |
| `GET /api/cron/purge-reports` | 清除過期報告 |
| `/api/shorts/*` | Shorts 相關 |

### 安全重點

- analyze／extension-capture 有 rate limit
- webhook 先驗簽再改額度；訂單不重複發放
- 服務端金鑰不上 Client；RLS 開啟
- 外掛 scraper 失敗可降級為手動貼 JD

---

## 9. 次要產品線：Shorts／雇主

路徑含 `/shorts`、`/shorts/upload`、`/employer/*`。  
**策略上非優先**；主投資線是「外掛 → confirm → 分析 → 付費」。首頁 Shorts banner 目前暫時隱藏。

---

## 10. 系統架構簡圖

```
┌──────────────────┐    scrape     ┌─────────────────────────────┐
│ Chrome Extension │ ────────────► │ LinkedIn / Indeed / Zip /   │
│     v1.3.0       │               │ Glassdoor / GovJobs / 104   │
└────────┬─────────┘               └─────────────────────────────┘
         │ POST /api/extension-capture
         ▼
┌──────────────────┐    sid     ┌──────────────┐
│ Next.js (Vercel) │◄──────────►│   /confirm   │
└────────┬─────────┘            └──────┬───────┘
         │                             │ POST /api/analyze
         ├─────────────────────────────▼────────────────┐
         │                    Google Gemini             │
         ├──────────────────── Supabase Auth + DB       │
         └──────────────────── Lemon Squeezy Checkout   │
```

---

## 11. 已完成與刻意不做

### 已完成

- 雙報告產品 + Dashboard
- Google 登入、額度、付費牆、Lemon Squeezy 四方案
- 外掛多站 → `/confirm`
- 帳戶管理（停用／硬刪）、推薦、法律頁
- Rate limit、webhook 安全、報告 purge
- Stripe 已從程式移除

### 刻意不做／暫緩

| 項目 | 說明 |
|------|------|
| Chrome Web Store 送審 | 暫緩；正式公開時再送審 |
| Stripe | 不接回；只用 Lemon Squeezy |
| LinkedIn OAuth 登入 | 只抓職缺，不用來登入 |
| Shorts 當主產品 | 低優先 |
| 兩種報告合併同一畫面 | 目前分開選、分開扣額度 |

---

## 12. 關鍵檔案索引

| 主題 | 路徑 |
|------|------|
| 產品術語 | `constants/report-products.ts` |
| 模型 | `constants/models.ts` |
| 額度 | `constants/credits.ts` |
| 定價 | `constants/checkout-plans.ts` |
| 首頁漏斗 | `components/InputForm.tsx` |
| 確認頁 | `app/confirm/page.tsx` |
| 帳戶頁 | `app/account/page.tsx` |
| 分析 API | `app/api/analyze/route.ts` |
| Prompt | `lib/prompts/`、`lib/gemini-analyze.ts` |
| 外掛 | `browser-extension/` |

---

## 13. 現況總結

JobBeagle 是已上線的 **Next.js 15 + Supabase + Gemini + Lemon Squeezy** 求職分析 SaaS。核心是 **額度制 Job Fit Snapshot／Interview Strategy Guide**，搭配 **Chrome 外掛多站抓取 → `/confirm`**。市場敘事偏美國職缺網；Shorts 為次要線；Chrome Web Store 尚未送審。
