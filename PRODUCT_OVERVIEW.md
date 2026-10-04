# JobBeagle — 網站現況完整介紹

> **基準日：** 2026-09-28  
> **正式網域：** https://www.jobbeagle.com  
> **程式庫：** GitHub `henry20030616/jobbeagle`（分支 `main`，push 後 Vercel 自動部署）  
> **用途：** 可貼給 Gemini／顧問。這不是任務單。  
> **怎麼寫的：** 本版對過程式，不沿用 2026-07-18 那份稿。舊稿把收款寫成 Lemon Squeezy、外掛寫成未上架、首頁寫成三步驟，都已過期。

報告欄位語意見 `docs/REPORT_CONTENT_SPEC_V3.md`（2026-07-19）。若 Spec 的頁籤名稱和下面第 4.3 節不同，**以程式 `lib/report-ui-copy.ts` 的顯示文字為準**。

---

## 1. 一句話定位

**JobBeagle** 是給求職者的 **AI 職缺決策工具**：Chrome 外掛或手動貼上 JD + 履歷 → 產出兩種額度制報告。

1. **Fit Snapshot（適配快照）** — 要不要投。便宜、快、**不看網**。
2. **Interview Guide（面試指南）** — 怎麼面、怎麼談。較貴、較深、**會即時搜網**，且內含完整 Snapshot。

- **市場敘事：** 美國求職（英文 JD、recruiter 視角）
- **介面語言：** en、zh-TW、zh-CN、es、hi、ar
- **收款：** **PayPal**，且本機與正式設定是 `PAYPAL_ENVIRONMENT=live`（不是 sandbox，也不是 Lemon Squeezy）
- **品牌：** `Job`（白）+ `beagle`（藍）

JobBeagle **不是履歷教練**。Snapshot 只解釋匹配／不匹配，不教怎麼改履歷。

---

## 2. 目標使用者與價值

| 面向 | 現況 |
|------|------|
| 主要用戶 | 求職者（尤其美區科技／專業職） |
| 次要用戶 | 雇主短影片（Shorts）。程式預設關閉，不是現在的投資線 |
| 痛點 | JD 又長又雜、難判斷要不要投、缺薪酬與面試情報 |
| 價值 | 分流（投不投）+ 匹配分數 + 薪酬定位 + 面試／談薪腳本 |
| 差異化 | 外掛多站抓 JD → 首頁帶入後再分析；兩種報告分開扣額度，免費路徑不燒貴模型 |

---

## 3. 產品術語

| 使用者看到的 | API / DB code | 舊別名（只為相容，不是新產品） |
|--------------|---------------|--------------------------------|
| Fit Snapshot／適配快照 | `job_fit_snapshot` | Lite |
| Interview Guide／面試指南 | `interview_strategy_guide` | Full |

DB／API code 維持舊值，以免弄壞額度與訂單。正在賣的方案代碼見 `ACTIVE_CHECKOUT_PLAN_TYPES`。

---

## 4. 核心使用者流程

```
職缺頁（Chrome 外掛）或首頁手動貼 JD
        ↓
  外掛：POST /api/extension-capture → 開首頁 /?sid=…
  首頁用 sid 把 JD 填進第 1 步
        ↓
  選報告類型、備妥履歷 → Google 登入
        ↓
  POST /api/analyze（額度檢查 → 扣額度 → Gemini → 存報告）
        ↓
  /report 顯示 Snapshot 或 Guide
        ↓
  額度不足 → QuotaPaywallCard → PayPal Checkout
```

- 舊網址 `/pre-flight` 會 **server redirect** 到 `/confirm`（query 保留）。`/confirm` 仍在，外掛側欄 iframe 會開它。
- 工具列外掛成功後開的是 **首頁 `/?sid=`**（`browser-extension/background.js` 的 `openPreFlight`），不是直接開 `/confirm`。
- 公開 ATS（Greenhouse／Lever）可嘗試從網址抓頁。LinkedIn 等求職板不能靠伺服器硬爬，要外掛或使用者貼全文。

### 4.1 首頁 `/`（四步驟，不是三步）

文案在 `constants/homepage-form-copy.ts`。英文標題：

1. **1. Job Information** — 貼完整 JD（公司名、職稱、條件、職責）。「勿只貼網址或片段」另起一行。
2. **2. My Resume** — 按鈕文案是 **Click to upload Resume**。已存履歷最多 **3** 筆（`RESUME_LIBRARY_LIMIT`）。
3. **3. Report type** — Fit Snapshot、Interview Guide 兩張卡，加上 Compare the two reports。未選是灰虛線；選中是藍實線。每張卡有 sample 連結。額度 pill 連到 `/account`，預設短字，滑過才展開；英文是 **Report credits**。
4. **4. Launch** — 送出鈕文案 **AI Strategy Analysis**。外框是 slate 灰漸層欄；按鈕本體 indigo。JD 或履歷不足時變淡不可按。

桌面字級放大（`homepage-font-large`），全寬加左右 gutter，不是置中小島。特色標題與 hero 那句 Expert-level tagline 同級。手機把特色收成預設關閉的手風琴，標題是 **Jobbeagle advantages**／**Jobbeagle 優點**。

### 4.2 範例頁 `/samples`

- `/samples?type=job_fit_snapshot` 或 `interview_strategy_guide`
- 左欄：通知框、Fit Snapshot、Interview Guide、Compare the two reports
- 通知框：目前報告名稱 + 左箭頭 + 依介面語言顯示（英文 **Analyze now with AI**、繁中／簡中 **立刻AI分析**）。顏色與 Compare 相同（深底、淺灰邊）。沒有 SAMPLE 字樣與 sparkles
- 兩個報告切換框：顏色對齊 **首頁第 4 步欄**（slate 漸層），不是第 3 步的藍框／虛線卡
- 右欄用正式報告元件加 sample 資料。外框 `border-blue-500`。報告本體仍可有 SAMPLE 浮水印

比較 overlay（首頁與 samples 共用）：

- 副標兩行（Snapshot 一句、Guide 一句）
- 字級比先前 overlay 小約 20%（`.compare-font-large`）
- 視窗外緣與框內都有留白；左右比上下更寬
- Fit Snapshot 欄靠右，靠近 Interview Guide
- 有的功能：綠色勾在文字前面、垂直置中、大小跟字一樣，後面不要破折號。沒有的功能仍用「—」
- 單次價：$3 / $9.99

### 4.3 兩種報告

| | Fit Snapshot | Interview Guide |
|--|--------------|-----------------|
| 模型 | `gemini-3.1-flash-lite` | `gemini-3.1-pro-preview`（一次產出，不先跑 Flash） |
| 網路 | 禁止 Search | Google Search grounding 可以 |
| 結論 | 要不要投：分數、Apply Decision、五維、閉卷薪酬粗估 | 怎麼面、怎麼談；內含完整 Snapshot |
| 引用 | 不要求網址 | 網頁聲明要有出處；後端驗 URL |
| 單價 | $3 | $9.99 |
| 額度 | Snapshot credits | Guide credits（分開扣） |

定義：`constants/models.ts`。分析：`lib/gemini-analyze.ts`。

Guide 上方橫向頁籤（英文顯示，`lib/report-ui-copy.ts`；內部 id 仍是 snapshot / hiring / interview / salary / provenance）：

1. Snapshot
2. Role & team
3. Company truth
4. Interview & offer
5. Evidence chain

預設開在 Snapshot。繁中對應：快照、職位與團隊、公司真相、面試與談薪、證據鏈。

零幻覺：不發明經歷、簽證、雇主 offer，或沒有來源的面試題。沒有情報就留空／標限制，不要編。STAR 與答辯只用履歷上的事實。

`/account` 與 `/career-context` 可填個人底線（層級、地點、工作授權、目標 TC、walk-away）。分析時注入，offer 敘述要尊重這些底線。

---

## 5. Chrome 外掛

| 項目 | 現況（對過 `browser-extension/manifest.json`） |
|------|-----------------------------------------------|
| 名稱 | JobBeagle - Headhunter-Level Job Triage |
| 版本 | **1.3.2**（Manifest V3） |
| 商店 | **已公開**。https://chromewebstore.google.com/detail/jobbeagle-headhunter-leve/pceknhembhfnljhpajkpdbihfbpfolpm |
| 站內安裝 | `/extension` 一鍵進商店；zip 只是備用 |
| 支援站 | LinkedIn、Indeed、ZipRecruiter、Glassdoor、GovernmentJobs／SchoolJobs、台灣 104 |
| 工具列流程 | scrape → `POST /api/extension-capture` → 新分頁開 `https://www.jobbeagle.com/?sid=…` |
| 側欄 | iframe 開 `/confirm?sid=…&embedded=1` |
| 失敗 | 降級成手動貼 JD，不要讓 service worker 崩掉 |
| 改外掛後 | 使用者自己到 `chrome://extensions` 重新載入 |

---

## 6. 帳戶與合規

| 功能 | 說明 |
|------|------|
| 登入 | Supabase Google OAuth。分析與結帳要登入 |
| `/account` | 額度、四檔方案、PayPal 帳單入口、取消訂閱、推薦、停用／重新啟用 |
| 停用 | `deactivated_at` 後不能 analyze／checkout |
| 硬刪 | `POST /api/account/delete`（profile、報告、履歷檔；CCPA）。另有 `/account/danger` |
| 法律 | `/privacy`、`/terms`。付款處理者寫的是 **PayPal**，不是 Lemon Squeezy |
| 報告保存 | Supabase；`/api/cron/purge-reports` 清過期 |
| 額度寫入 | 客戶端不可改 credits／`membership_tier`。只經 service role、SECURITY DEFINER RPC，或已驗簽的 PayPal webhook |

新帳號：終身 **3** 次 Fit Snapshot（`FREE_LIFETIME_JOB_FIT_SNAPSHOT_CREDITS`），Interview Guide **0**（`lib/profiles.ts`）。不按日／月重置。有裝置指紋等反濫用。

---

## 7. 定價與金流

**收款路徑是 PayPal。** 對過的程式：

- `POST /api/checkout` → `createPayPalCheckout`（`lib/paypal.ts`）
- 訂單列 `payment_provider: 'paypal'`
- 回來：`/api/payment/paypal-return`
- 發額度：`POST /api/payment/webhook` 先呼叫 PayPal `verify-webhook-signature`，通過才 `fulfillOrder`
- 單次事件：`PAYMENT.CAPTURE.COMPLETED`、`PAYMENT.SALE.COMPLETED`
- 訂閱事件：`BILLING.SUBSCRIPTION.ACTIVATED`，以及失敗、取消、過期、暫停
- 帳單入口：live 時 `https://www.paypal.com/myaccount/autopay/`
- 同一筆訂單不發兩次

環境變數：`PAYPAL_CLIENT_ID`、`PAYPAL_CLIENT_SECRET`、`PAYPAL_ENVIRONMENT`、`PAYPAL_WEBHOOK_ID`、`PAYPAL_PLAN_STANDARD_SUB`、`PAYPAL_PLAN_ADVANCED_SUB`。  
2026-09-28 本機 `.env.local`：`PAYPAL_ENVIRONMENT=live`，client、webhook、兩個訂閱 plan id 都有。`PAYPAL_ENVIRONMENT` 不是 `live` 時程式走 sandbox。

Stripe、Lemon Squeezy、Paddle **不是現在的收款路徑**。程式裡已沒有 Lemon Squeezy 結帳。不要把它們寫成現況，也不要建議接回去。

### 正在賣的四檔（USD）

| 方案 code | 價格 | 內容 |
|-----------|------|------|
| `single_job_fit_snapshot` | $3 | +1 Snapshot |
| `single_interview_strategy_guide` | $9.99 | +1 Guide |
| `standard_subscription` | $19.99/月 | 100 Snapshot + 5 Guide |
| `advanced_subscription` | $39.99/月 | 300 Snapshot + 15 Guide |

同價舊名 `single_lite`、`single_full`、`basic_overage` 會對到現在的 $3 / $9.99，不再另開一檔。$4.99 與 $8.99 已從結帳方案拿掉。`author_sponsor` 是帳戶頁小費，不進這四檔、不加點數。對外漏斗只講上面四檔。

推薦：`?ref=`。

---

## 8. 技術堆疊

| 層 | 技術 |
|----|------|
| App | Next.js 15 App Router、React 19、TypeScript 5、Tailwind |
| Host | Vercel → www.jobbeagle.com |
| Auth / DB / Storage | Supabase（Google OAuth、Postgres、RLS、Storage）。專案 ref `yvzorfeespljbitxxufo` |
| AI | `@google/genai` |
| 金流 | PayPal（live） |
| Email（選用） | Resend |
| Analytics（選用） | Google Analytics |
| 測試 | Vitest；Playwright 可選。改程式要過 `npm run gate:generated` |

### 主要路由

| 路徑 | 用途 |
|------|------|
| `/` | 四步驟漏斗；也接收外掛 `?sid=` |
| `/confirm` | 確認頁；舊 `/pre-flight` 轉來這裡；外掛側欄 iframe |
| `/report` | 分析結果 |
| `/samples` | 兩種報告範例 + 比較 |
| `/account`、`/account/danger` | 帳戶與刪除 |
| `/extension` | 安裝外掛 |
| `/privacy`、`/terms` | 法律 |
| `/career-context` | 個人底線 |
| `/shorts`、`/employer/*` | 短影片。`isShortsEnabled()` 只有 `NEXT_PUBLIC_SHORTS_ENABLED=true` 才開。首頁 banner `isHomepageShortsBannerEnabled()` **寫死 false** |

### 主要 API

| API | 用途 |
|-----|------|
| `POST /api/analyze` | 核心分析（登入、額度、rate limit、Gemini、存檔） |
| `POST/GET /api/extension-capture` | 外掛 handoff。GET 回傳的 `preflightUrl` 是 `/?sid=` |
| `POST/GET /api/checkout` | 建立 PayPal 結帳；GET 回傳四檔方案 |
| `POST /api/payment/webhook` | PayPal 驗簽後發額度 |
| `POST /api/payment/paypal-return` | PayPal 返回 |
| `/api/account/*` | 讀取／停用／啟用／刪除／帳單入口 |
| `/api/resumes` | 履歷庫 |
| `GET /api/reports/[id]` | 讀報告 |
| `GET /api/cron/purge-reports` | 清過期報告 |

### 安全

- analyze、extension-capture、PayPal webhook 有 rate limit
- webhook 先向 PayPal 驗簽再改額度
- `SUPABASE_SERVICE_ROLE_KEY`、`GEMINI_API_KEY`、`PAYPAL_CLIENT_SECRET` 不上 Client。只有 `NEXT_PUBLIC_*` 可進瀏覽器
- JD／履歷／搜尋文字要包起來，不可拼進 `systemInstruction`
- RLS 開在 profiles、analysis_reports 等表

---

## 9. Shorts／雇主

路徑含 `/shorts`、`/shorts/upload`、`/employer/*`。  
預設關。主線是「外掛或貼 JD → 分析 → PayPal」。

---

## 10. 架構簡圖

```
Chrome Extension 1.3.2（Chrome Web Store 已公開）
  LinkedIn / Indeed / ZipRecruiter / Glassdoor / GovernmentJobs / 104
        │ POST /api/extension-capture
        ▼
  新分頁 https://www.jobbeagle.com/?sid=…
        │
Next.js on Vercel
        ├─ 首頁四步驟 → POST /api/analyze
        ├─ Gemini Flash-Lite（Snapshot，無 Search）
        ├─ Gemini Pro + Search（Guide，單次）
        ├─ Supabase Auth + Postgres + Storage（RLS）
        └─ PayPal Checkout + webhook（PAYPAL_ENVIRONMENT=live）
```

---

## 11. 刻意不做

| 項目 | 原因 |
|------|------|
| 給 Snapshot 加 Google Search | Snapshot 是閉卷分流 |
| Guide 先跑 Flash 再跑 Pro，或拆多階段管線 | 產品決定單次 Pro |
| 接回 Stripe、Lemon Squeezy、Paddle | 收款已是 PayPal |
| 用 LinkedIn OAuth 當登入 | 外掛只抓職缺；登入是 Google |
| 把 Shorts 當主產品 | 主線是分析漏斗 |
| 兩種報告合成一次扣款 | 分開選、分開扣；Guide 內容含 Snapshot |
| 履歷 builder／改履歷教練 | 明確排除 |
| 無來源的面試題、文化契合分數、假裝雇主 offer | 零幻覺 |
| 客戶端直接改額度 | 安全 |

---

## 12. 關鍵檔案

| 主題 | 路徑 |
|------|------|
| 產品 code | `constants/report-products.ts` |
| 模型 | `constants/models.ts` |
| 免費額度 | `constants/credits.ts`、`lib/profiles.ts` |
| 定價 | `constants/checkout-plans.ts` |
| PayPal | `lib/paypal.ts`、`app/api/checkout/route.ts`、`app/api/payment/webhook/route.ts` |
| 首頁文案 | `constants/homepage-form-copy.ts` |
| 首頁表單 | `components/InputForm.tsx`、`components/InputFormMobile.tsx` |
| 比較表 | `constants/report-compare.ts`、`components/ReportCompareModal.tsx` |
| 報告 UI 文案 | `lib/report-ui-copy.ts` |
| Snapshot / Guide 畫面 | `components/LiteReportDashboard.tsx`、`components/FullReportDashboard.tsx` |
| 範例頁 | `app/samples/SampleReportClient.tsx`、`lib/sample-reports.ts` |
| 外掛 | `browser-extension/manifest.json`、`browser-extension/background.js` |
| 報告規格 | `docs/REPORT_CONTENT_SPEC_V3.md` |

---

## 13. 現況總結

JobBeagle 是已上線的 **Next.js 15 + Supabase + Gemini + PayPal** 求職分析站。核心是額度制 **Fit Snapshot**（Flash-Lite、不上網、$3、免費終身 3 次）與 **Interview Guide**（Pro + Search、$9.99、起始 0 次），另有 $19.99／$39.99 月訂。外掛 **1.3.2 已在 Chrome Web Store**，抓完 JD 開首頁 `/?sid=`。Shorts 預設關閉。
