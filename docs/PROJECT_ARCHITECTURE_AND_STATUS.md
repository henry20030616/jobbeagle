# JobBeagle 專案完整架構與現況報告

（盤點日期：2026-11-07｜僅程式庫與設定盤點，未改碼）

---

## 1. 整體系統架構與頁面進度

### 1.1 技術棧與部署

| 項目 | 版本／現況 |
|---|---|
| Next.js | `^15.1.0`（App Router） |
| React | `^19.2.1` |
| TypeScript | `^5.8.2` |
| Tailwind CSS | `^3.4.1` |
| Supabase | `@supabase/supabase-js` `^2.47.10`、`@supabase/ssr` `^0.8.0` |
| Gemini SDK | `@google/genai` `^1.31.0` |
| Anthropic SDK | `@anthropic-ai/sdk` `^1.3.0` |
| 其他 | Recharts、mammoth（DOCX）、html2canvas／jspdf、Resend、Lucide、Vercel Analytics／Speed Insights |
| 測試 | Vitest、Playwright |
| 部署 | **Vercel**（production；`vercel.json` 含 Cron） |
| CI | **GitHub Actions** `.github/workflows/ci.yml`：lint、unit/api、generated-code-gate、build、e2e smoke |
| 網域 | `https://www.jobbeagle.com` |
| Chrome 擴充 | MV3，`browser-extension/`，公開版 **1.3.2**（Chrome Web Store 已上架） |

AI 模型常數（`constants/models.ts`）：

- Snapshot：`gemini-3.1-flash-lite`（閉卷、無 Search、不用 Claude）
- Guide 情報：`gemini-3.1-pro-preview` + `googleSearch`
- Guide 撰寫：`claude-sonnet-5-5`（無 Search；缺 `ANTHROPIC_API_KEY` 時 fallback Gemini Pro）

### 1.2 前端路由（`app/**/page.tsx`）

| 路由 | 定位 | 完成度 |
|---|---|---|
| `/` | 首頁：貼 JD／履歷、選 Snapshot／Guide、啟動分析、額度不足付費牆 | **真實流程**（呼叫 `/api/analyze`、PayPal checkout） |
| `/confirm` | 外掛 handoff Pre-Flight 確認後分析 | **真實** |
| `/pre-flight` | 外掛落地／確認頁入口 | **真實** |
| `/report` | 正式報告（session 載入） | **真實**（Guide 使用報告內橫向分頁） |
| `/samples` | Snapshot／Guide **樣本報告** | **靜態 fixture**（`lib/sample-reports.ts`），非即時 AI |
| `/account` | 帳戶、額度、訂閱取消、Career Context 入口 | **真實**（Supabase + billing API） |
| `/account/danger` | 危險操作／刪帳相關 | **真實**（接 delete／deactivate） |
| `/career-context` | 職涯條件（薪資底線等）寫入 profile | **真實**（`career_context` 欄位） |
| `/extension` | 外掛下載／Chrome Web Store 導流 | **真實行銷頁** |
| `/privacy`、`/terms` | 法務 | **真實內容** |
| `/shorts`、`/shorts/upload`、`/shorts/company/[id]` | 職缺短影音 | **功能碼在**；首頁 banner 預設隱藏（`isHomepageShortsBannerEnabled=false`）；可用 `NEXT_PUBLIC_SHORTS_ENABLED=false` 凍結 |
| `/employer/login`、`/employer/dashboard` | 企業 Shorts 後台 | **真實影片 CRUD**；與 Shorts 產品綁定，非主轉換漏斗 |

> 無獨立 `/checkout` 頁：結帳走 API 導向 PayPal。

### 1.3 後端 API（`app/api/**`）

| 端點 | 功能 | 完成度 |
|---|---|---|
| `POST /api/analyze` | 核心分析、扣點、存報告 | **真實** |
| `POST /api/extension-capture` | 外掛上傳職缺文字、簽發 handoff `sid` | **真實** |
| `POST /api/job-url` | 伺服器抓 **公開 ATS** HTML（Greenhouse／Lever） | **真實，範圍窄** |
| `GET/POST /api/checkout` | 建立 PayPal 訂單／訂閱 | **真實** |
| `POST /api/payment/webhook` | PayPal webhook 驗簽＋入帳 | **真實（程式完整）** |
| `GET /api/payment/paypal-return` | 付款返回補 fulfill | **真實** |
| `GET/POST /api/account/*` | 訂閱、取消、billing portal、停用／啟用、刪帳 | **真實** |
| `/api/profile`、`/api/resumes`、`/api/reports/[id]` | 個人檔、履歷庫、報告 | **真實** |
| `/api/shorts/*` | 短影音 CRUD／觀看／應徵 | **真實（次產品）** |
| `GET /api/cron/purge-reports` | 清除過期單次報告 | **真實 + Vercel Cron** |
| `/api/health`、`/api/check-env` | 健康／環境檢查 | **運維用** |

### 1.4 必答重點：Chrome 擴充

**支援站台（manifest + scrape-page.js）**  
LinkedIn、Indeed、ZipRecruiter、**Glassdoor（職缺頁）**、GovernmentJobs／SchoolJobs、**104.com.tw**，外加 `jobbeagle.com` handoff。

**傳什麼**  
在**使用者當前分頁**注入腳本讀 **DOM**，組成 `pageTitle`、`pageUrl`、`rawText`、職稱／公司等，`POST /api/extension-capture`。是 **職缺正文文字**，不是「只傳網址給後端再爬」。

**不裝外掛、只貼 LinkedIn 網址？**  
`/api/job-url` **明確拒絕** LinkedIn／Indeed／Glassdoor 等（`blocked_board`），只允許 Greenhouse／Lever 公開頁。前端分類也會擋，避免送伺服器爬。  
**後端抓不動 LinkedIn 防爬蟲**；正確路徑是：外掛抓 DOM，或使用者**貼完整職缺文字**。

---

## 2. 商業模式、定價與 PayPal 金流閉環

### 2.1 定價（程式寫死，USD；`constants/checkout-plans.ts`）

| 方案 | 金額 | 類型 | 額度 |
|---|---|---|---|
| Fit Snapshot 單次 | **$9.99** | 點數／單次買斷 | Snapshot +1 |
| Interview Guide 單次 | **$14.99** | 點數／單次買斷 | Guide +1 |
| Standard 訂閱 | **$19.99／月** | 訂閱 | 50 Snapshot + 5 Guide |
| Advanced 訂閱 | **$39.99／月** | 訂閱 | 100 Snapshot + 15 Guide |
| 贊助 | ≥$0.50（可自訂） | 捐助 | 不發報告額度 |

免費層：終身 **3 次 Snapshot**，Guide 預設 **0**（`constants/credits.ts`）。  
定價標籤為 **USD**；程式未另訂 TWD 價目表。

模式總結：**雙軌產品 + 信用點數 + 可選月訂**，不是「同一份報告先遮罩再解鎖」為主。

### 2.2 Snapshot vs Guide 切分（必答）

| | Fit Snapshot | Interview Guide |
|---|---|---|
| 前置 | 有 Snapshot 點數即可 | 需 Guide 點數（免費通常為 0） |
| AI | Flash-Lite 閉卷 | Snapshot 層 + Pro/Search 情報 + Claude 撰寫 |
| 內容 | 適配分數、應徵建議、關鍵字、市場薪資帶等 | 另含薪資落點、公司／職位評價、真題庫、談判等 |

**權限**：`POST /api/analyze` 在扣點前 `canAffordReport`；不足回 **402 `PAYMENT_REQUIRED`** → 前端 `QuotaPaywallCard`。  
**不是**主要靠前端把完整 Guide 遮起來；沒點數就不會跑 Guide 管線。  
（遺留 `maskPremiumReportFields` 存在，但現行主路徑是 **點數閘門 + 雙產品**。）

Snapshot UI 上「升級 Guide 可解鎖…」屬**產品升級提示**，不是把已產出 Guide JSON 藏欄位。

### 2.3 PayPal 閉環（必答）

程式已具備：

1. `/api/checkout` 建訂單／訂閱  
2. Webhook：`verifyPayPalWebhook` → `fulfillOrder`（`increment_profile_credits`、更新 `membership_tier`、訂單 `succeeded`、冪等）  
3. `/api/payment/paypal-return` 返回時補 fulfill  

結論：邏輯上可 **自動加點解鎖後續分析**；「100%」仍依賴正式環境 **`PAYPAL_ENVIRONMENT=live`、Webhook ID、金鑰同步到 Vercel**。單次 Guide 購買是加 **未來可跑次數**，不是自動把舊報告改寫成 Guide（除非帶 `report_id` 的特定路徑把 `is_premium` 打開）。

---

## 3. 外部資料獲取與合規架構（必答）

| 來源類型 | 做法 |
|---|---|
| Glassdoor／Blind／Reddit 等評價、薪資、面試題 | **無自架爬蟲**。Guide 情報模組用 Gemini Pro + **`tools: [{ googleSearch: {} }]`**（Google Search grounding），再改寫／引用 URL |
| 合規收緊（近期） | 禁止長篇照抄；優先官方資料集敘述；Search 失敗則降為預測題／清來源；存檔前檢查連結 404／410 |
| 外掛 Glassdoor | 只讀**職缺刊登頁** DOM，不登入爬評論區 |
| Snapshot | **禁止** Search／網路工具 |

**不是** SerpAPI 等第三方搜尋 SDK；**不是**「只靠模型參數記憶假裝有網頁」為設計目標（有 Search 時應 grounding；失敗時會降級並標限制）。

---

## 4. AI 分析管線與單次成本結構

### 4.1 流程（履歷 + JD → 報告）

1. 驗證登入、JD、履歷解析、Sybil／限流  
2. **扣點** → 呼叫模型 → 失敗則退點  
3. **Snapshot**：1 次 Flash-Lite JSON（品質不合格可再 1 次 retry）  
4. **Guide**（與 Snapshot **並行**）：  
   - 並行：履歷調整（Claude）、薪資 Search、公司 Search、題目 Search  
   - 來源連結探活  
   - 並行：答題（Claude）、談判（Claude）  
5. 合併 overlay → 寫入 `analysis_reports`  

### 4.2 一次完整 Guide 約呼叫幾次 LLM？

約 **6～8+ 次**（非單一巨型 JSON）：

- Snapshot：1（+最多 1 retry）  
- Guide wave-1：4（1 Claude 寫作 + 3 Gemini Pro+Search）  
- Guide wave-2：2 Claude  
- 各模組失敗時可能再 retry／Search→無 Search  

Snapshot alone：通常 **1～2** 次 Flash-Lite。

### 4.3 Caching

`analyze` 回應固定 `cached: false`。  
**沒有**「同公司／同職缺跨用戶共用情報快取」的產品級 cache；僅有履歷庫去重、報告歷史。每次付費／扣點分析大致重跑管線。

粗成本印象：Guide ≫ Snapshot（Pro+Search ×3 + Claude ×3 + Snapshot）。

---

## 5. 資料庫（Supabase）與排程

### 5.1 主要表／概念（migrations 001–013）

| 物件 | 用途 |
|---|---|
| `profiles` | 使用者權益：`membership_tier`、`available_job_fit_snapshot_credits`、`available_interview_strategy_guide_credits`、referral、fingerprint、`career_context`、停用時間等。額度欄位 **僅 service_role／RPC** 可改 |
| `analysis_reports` | 報告 JSON、`report_type`、職缺／履歷快照、`resume_id`、`is_single_drop`、`is_premium` 等 |
| `resumes`（履歷庫） | 與報告連結（migration 009） |
| `orders` | PayPal 訂單／訂閱履約 |
| `referrals` | 推薦里程碑 |
| 其他 | Shorts／影片相關表、用量／bonus 等歷史遷移 |

Auth：Supabase Auth（Google OAuth）。RLS 開啟；信用點數有 entitlement 鎖（011）。

### 5.2 Cron 與 GitHub Actions（必答）

| 機制 | 工作 |
|---|---|
| **Vercel Cron** `0 3 * * *` → `GET /api/cron/purge-reports` | Bearer `CRON_SECRET`；RPC `purge_expired_single_drop_reports`（約 30 天單次報告清理／CCPA） |
| **GitHub Actions CI** | lint、單元／API 測、generated-code-gate、build、Playwright smoke——**不做業務資料排程** |

---

## 6. 假資料／Mock 與上線收費阻礙

### 6.1 哪些是寫死樣本？（必答）

| 表面 | 資料性質 |
|---|---|
| `/samples` | **整份硬編碼**樣本（`getSampleSnapshotReport`／`getSampleStrategyGuideReport`），含薪資、公司評價、面試題、談判等——**刻意展示用** |
| `/report` | **真實分析結果**（瀏覽器 session／DB），非 samples fixture |
| 首頁行銷文案、比對表常數 | 靜態文案，不是動態報告 |

若正式付費後 `/report` 某欄空白，多半是該次模組失敗／Search 降級，不是讀到 samples 假資料。

### 6.2 推美國市場正式收費：優先級前 3 大 Blockers（必答）

1. **Gemini（及必要時 Anthropic）生產額度／帳單穩定**  
   實務已出現 `RESOURCE_EXHAUSTED`／預付額度耗盡 → 付費用戶等 2 分鐘後失敗。無穩定 AI 供應＝無法交貨。

2. **Guide 交付時間與可靠性**  
   多段 Pro+Search + Claude，常 **1–3 分鐘**；需監控超時（`maxDuration` 180s）、失敗退點、客服話術；否則「付了錢卻交不出完整指南」。

3. **職缺輸入依賴外掛或貼文，伺服器無法破 LinkedIn**  
   美國主力流量在 LinkedIn：必須外掛轉換或極清楚的「貼完整 JD」UX；只貼 URL **會失敗**，易造成付費前流失或客訴。

**營運層另需確認（程式有、環境要對）**：PayPal live webhook 持續入帳、`ANTHROPIC_API_KEY` 在 Vercel、隱私／來源免責文案與商店政策一致。

---

## 顧問用一句話摘要

JobBeagle 是 **Next.js 15 + Supabase + PayPal** 的美國求職決策 SaaS：免費／低價 **Fit Snapshot（Flash-Lite）** 與付費 **Interview Guide（Gemini Pro+Search 情報 + Claude 撰寫）**；擴充讀 DOM 餵 JD，**不伺服器爬 LinkedIn／Glassdoor 評論**；金流與扣點邏輯在碼內閉環；**最大上線風險是 AI 帳單／Guide 時延，以及 LinkedIn 必須靠外掛或貼文。**
