# JobBeagle — 網站現況（給 Gemini 的簡報）

> **基準日：** 2026-09-28  
> **正式網域：** https://www.jobbeagle.com  
> **程式庫：** GitHub `henry20030616/jobbeagle`，分支 `main`（push 後 Vercel 自動部署）  
> **這份文件的用途：** 讓另一個模型（例如 Gemini）在沒有看過程式碼的情況下，了解產品、流程、技術、商業與刻意限制。  
> **不要做的事：** 這不是任務單。不要假設要改架構、換金流、或把 Snapshot 加上網搜。

較細的報告欄位規格見 `docs/REPORT_CONTENT_SPEC_V3.md`（2026-07-19）。本檔若與該規格衝突，**以本檔的「現況」為準**（UI 與上線狀態已往前走）；報告欄位語意仍以 Spec v3 為準。

---

## 1. 一句話

**JobBeagle** 是給求職者的 **AI 職缺決策工具**：用 Chrome 外掛或手動貼上 JD + 履歷，產出兩種付費報告——

1. **Fit Snapshot（適配快照）** — 要不要投。便宜、快、**不看網**。
2. **Interview Guide（面試指南）** — 怎麼面、怎麼談。較貴、較深、**會即時搜網**，且內含完整 Snapshot。

市場敘事以 **美國求職** 為主（英文 JD、recruiter 視角）。介面有多語（en、zh-TW、zh-CN、es、hi、ar）。品牌字是 `Job`（白）+ `beagle`（藍）。

---

## 2. 誰在用、賣什麼

| 面向 | 現況 |
|------|------|
| 主要用戶 | 求職者（尤其美區科技／專業職） |
| 次要用戶 | 雇主短影片（Shorts）。**路線存在，但不是現在的投資重點**；首頁「Explore Job Shorts」banner **刻意關閉** |
| 痛點 | JD 又長又雜、難判斷要不要投、缺薪酬與面試情報 |
| 價值 | 分流（投不投）+ 匹配分數 + 薪酬定位 + 面試／談薪腳本 |
| 差異化 | 外掛多站抓 JD → 確認頁核對後才扣額度；兩種報告成本模型分開，避免免費路徑燒貴模型 |

JobBeagle **不是履歷教練**。Snapshot 的分數說明只解釋匹配／不匹配，不教「怎麼改履歷」。

---

## 3. 產品名稱（顯示 vs 程式碼）

| 使用者看到的 | API / DB code | 舊別名（相容，勿當新功能） |
|--------------|---------------|---------------------------|
| Fit Snapshot／適配快照 | `job_fit_snapshot` | Lite |
| Interview Guide／面試指南 | `interview_strategy_guide` | Full、Strategy Guide |

短標籤與正式名稱相同。DB／API code **維持舊值**，以免弄壞額度與訂單。

---

## 4. 核心流程

```
職缺頁（Chrome 外掛）或首頁手動貼 JD
        ↓
  /confirm 確認公司／職稱／JD／履歷、選報告類型
  （舊路徑 /pre-flight 會 redirect 到 /confirm）
        ↓
  Google 登入（分析與付款都要登入）
        ↓
  POST /api/analyze（額度檢查 → 扣額度 → Gemini → 存報告）
        ↓
  /report 顯示 Snapshot 或 Guide
        ↓
  額度不足 → QuotaPaywallCard → Lemon Squeezy Checkout
```

公開 ATS（Greenhouse／Lever）可嘗試從網址抓頁。LinkedIn 等求職板 **不能靠伺服器硬爬**，要外掛或使用者貼全文。

---

## 5. 首頁 `/`（2026-09 現況）

桌面是 **四步驟橫向漏斗**（不是舊文件裡的三步）：

1. **職缺資訊** — 大文字區貼完整 JD（公司名、職稱、條件、職責）。提示「勿只貼網址或片段」另起一行。公開 ATS 可解析。
2. **履歷** — 「Click to upload Resume」／「點擊上傳履歷」。已存履歷庫（最多數筆）。額度 pill 預設只顯示短字，**滑過才展開完整額度說明**（文案是 **Report credits**，複數 Report、單數 credits 的語法已校正）。
3. **報告類型** — 兩張報告卡（Fit Snapshot、Interview Guide）+「Compare the two reports」。未選是灰虛線；選中是藍實線。每張卡有 sample 連結。
4. **Launch／分析** — 大按鈕送出。外框是 slate 灰漸層欄（`border-slate-500/70` + `from-slate-500/45 to-slate-600/70`），按鈕本體是 indigo。JD 或履歷不足時按鈕變淡不可按。

桌面字級刻意放大（`homepage-font-large`）。版面是全寬加左右 gutter，**不要**再做成置中小島。特色卡標題與 hero 那句 Expert-level tagline 同級。手機把特色收成預設關閉的手風琴（「JobBeagle advantages」這類說法，不是 “What you get”）。

語言：`LanguageSwitcher`。

---

## 6. 範例頁 `/samples`

- URL：`/samples?type=job_fit_snapshot` 或 `interview_strategy_guide`
- 左欄四塊：通知框、Fit Snapshot、Interview Guide、Compare the two reports
- 通知框：目前報告名稱 + 左箭頭 + **「立刻AI分析」**（各語系目前都是這句中文）。顏色與 Compare 按鈕相同（深底、淺灰邊 `border-slate-400` / `bg-slate-900/80`）。**沒有** SAMPLE 字樣與 sparkles
- 兩個報告切換框：顏色對齊 **首頁第 4 步欄**（slate 漸層），不是第 3 步那種藍框／虛線報告卡。選中略亮一點
- 右欄：真實報告元件（`LiteReportDashboard` / `FullReportDashboard`）＋ sample 資料。外框亮藍 `border-blue-500`，大螢幕用 `ReportFitStage` 放大
- 報告本體右上仍可有 SAMPLE 浮水印（與左欄通知無關）

比較 overlay（首頁與 samples 共用 `ReportCompareModal`）：

- 標題 Fit Snapshot vs Interview Guide
- 副標 **兩行**：Snapshot 一句、Guide 一句
- 全頁字約比先前 overlay 小 20%（`.compare-font-large`）
- 視窗上下留白、左右留白更寬；框內 padding 也加大
- Fit Snapshot 欄靠右，靠近 Interview Guide，減少兩欄中間空洞
- Guide-only 列：綠色勾在文字**前面、垂直置中、大小跟字一樣**；勾後面**不要**破折號。沒有的功能仍用「—」
- 比較表大致對照：

| | Fit Snapshot | Interview Guide |
|--|----------------|-----------------|
| 最適合 | 決定要不要投 | 準備面試與談薪 |
| 模型 | Flash-Lite，快、無網 | Pro + 即時網搜 |
| 分數＋投遞決策 | 有，較淺 | 有，含分數含義 |
| 薪酬區間＋個人落點 | 區間＋預測落點 | 區間＋落點＋談判槓桿 |
| 面試／STAR | 約 3 個預測開場 | 完整 playbook＋STAR 大綱 |
| 即時網搜、招募情報、疑慮答辯、談薪腳本、錄取論點 | 無（或僅 JD+履歷） | 有 |
| 單次價格 | $3 | $9.99 |

---

## 7. 兩種報告（成本與內容）

| | Fit Snapshot | Interview Guide |
|--|--------------|-----------------|
| 模型 | `gemini-3.1-flash-lite` | `gemini-3.1-pro-preview`（**一次**產出，不先跑 Flash） |
| 網路 | **禁止** Search／爬蟲 | Google Search grounding 可以 |
| 輸入 | 履歷 + JD（+ 若有 Career Context） | 同上 + 檢索 |
| 使用者要的結論 | 要不要投：分數、Apply Decision、五維、薪酬粗估 | 怎麼面、怎麼談；內含完整 Snapshot |
| 薪酬 | 閉卷估計 | 開卷薪酬 + 證據層級標籤 |
| 引用 | 不要求網址 | 引用的網頁聲明要有出處；後端驗 URL |
| 單價 | $3 | $9.99 |
| 額度池 | Snapshot credits（分開扣） | Guide credits（分開扣） |

定義：`constants/models.ts`。分析：`lib/gemini-analyze.ts`。Prompt：`lib/prompts/`。

### 零幻覺（產品硬規則）

- 不發明經歷、簽證、雇主 offer、或沒有來源的「據報導面試題」
- 沒有情報就 `null`／限制／驗證問題，不要編
- STAR 與答辯只用履歷上的事實

### Snapshot 畫面（Spec v3，仍有效）

- 一頁 slide：外框一條，內部用分隔線
- 分數區只解釋匹配，不做履歷教練
- Beagle Scale 預設藏起，滑過／點分數圓才出
- 不顯示 Evidence Coverage、Hard Filter 面板（payload 可留）

### Guide 畫面

- 上方橫向頁籤：Snapshot · Hiring Context · Interview · Salary · Provenance
- 沒有左側目錄。預設開在 Snapshot，且這頁用與獨立 Snapshot 相同的 slide 框
- DefenseCard：風險與履歷證據並排

### Career Context

`/account`（及 `/career-context`）可填底線（層級、地點、工作授權、目標 TC、walk-away 等），分析時注入。`target_gap` 與 offer strategy 要尊重這些底線。

---

## 8. Chrome 外掛

| 項目 | 現況 |
|------|------|
| 名稱 | JobBeagle - Headhunter-Level Job Triage |
| 版本 | **1.3.2**（Manifest V3），目錄 `browser-extension/` |
| 商店 | **已公開**。Listing：https://chromewebstore.google.com/detail/jobbeagle-headhunter-leve/pceknhembhfnljhpajkpdbihfbpfolpm |
| 站內安裝 | `/extension` 用商店一鍵安裝；zip 只是備用下載 |
| 支援站 | LinkedIn、Indeed、ZipRecruiter、Glassdoor、GovernmentJobs／SchoolJobs、台灣 104 |
| 流程 | 點工具列 → scrape → `POST /api/extension-capture` → 開 `/confirm?sid=…`（簽名、短時效） |
| 失敗 | try/catch、降級成「請手動貼 JD」，不要讓 service worker 崩掉 |
| 改外掛後 | 使用者必須自己到 `chrome://extensions` 重新載入。Agent 無法代按 |

---

## 9. 帳戶、合規、安全

| 功能 | 說明 |
|------|------|
| 登入 | Supabase Google OAuth。分析與結帳要登入 |
| `/account` | 額度、方案、帳單入口、推薦、停用／重新啟用、刪除帳戶 |
| 停用 | `deactivated_at` 後不能 analyze／checkout |
| 硬刪 | `POST /api/account/delete`：profile、報告、履歷檔（CCPA） |
| 法律 | `/privacy`、`/terms`：不出售個資 |
| 報告保存 | Supabase；cron `/api/cron/purge-reports` 清過期（約 30 天政策） |
| 額度寫入 | **客戶端不可改** credits／`membership_tier`。只經 service role、SECURITY DEFINER RPC、或已驗簽的 webhook |
| Rate limit | `POST /api/analyze`、`POST /api/extension-capture` 依 IP／user |
| 免費濫用 | 裝置指紋等 Sybil 檢查（`lib/profiles.ts`） |
| Webhook | `POST /api/payment/webhook` 先用 HMAC-SHA256 驗 `x-signature`，再改額度；同一 `order_id` 不發兩次 |
| Prompt injection | JD／履歷／搜尋文字必須包起來，不可拼進 `systemInstruction` |
| 秘密 | `SUPABASE_SERVICE_ROLE_KEY`、`GEMINI_API_KEY`、`LEMONSQUEEZY_*` 不得出現在 Client Component。只有 `NEXT_PUBLIC_*` 可進瀏覽器 |

---

## 10. 定價與金流

**收款只有 Lemon Squeezy。** Stripe 已從產品移除，不要接回去。程式裡仍有舊 PayPal／Paddle 檔名或註解殘留，**不是現在的收款路徑**。

### 免費

- 終身 **3 次 Fit Snapshot**（不按日／月重置）
- Interview Guide 起始 **0**
- 註冊送的是 Snapshot，不是 Guide

### 上架價格（USD）

| 方案 | 價格 | 內容 |
|------|------|------|
| 單次 Snapshot | $3 | +1 Snapshot |
| 單次 Guide | $9.99 | +1 Guide |
| Standard 月訂 | $19.99 | 100 Snapshot + 5 Guide |
| Advanced 月訂 | $39.99 | 300 Snapshot + 15 Guide |

付費牆元件：`QuotaPaywallCard`。這四個價格必須在漏斗裡講清楚。

推薦：`?ref=`。好友達成條件後發獎勵。

### 金流上線狀態（重要）

- Lemon Squeezy 商店 **Jobbeagle**（store `424272`）在基準日仍是 **Test mode**
- 商品、webhook、API key 是測試用
- **還沒有正式環境的真實銷售**（0 live sales）
- 要上線：店主在 LS 後台完成身份／商業資料、開通收款、把商品複製到 Live、換 live API key 與 webhook。程式只有在 live variant 存在時才把 `LEMONSQUEEZY_TEST_MODE=false`
- 站內已有：取消訂閱、billing portal（`/account`）

`constants/checkout-plans.ts` 裡還有 deprecated 別名與舊價（例如 $4.99 unlock、$8.99 monthly）。**對外漏斗以上面四檔為準**，不要把它們當成現售方案。

---

## 11. 技術堆疊

| 層 | 技術 |
|----|------|
| App | Next.js 15 App Router、React 19、TypeScript 5、Tailwind |
| Host | Vercel → www.jobbeagle.com |
| Auth / DB / Storage | Supabase（Google OAuth、Postgres、RLS、Storage）。專案 ref `yvzorfeespljbitxxufo` |
| AI | `@google/genai` |
| 金流 | Lemon Squeezy |
| Email（選用） | Resend |
| Analytics（選用） | Google Analytics |
| 測試 | Vitest；Playwright e2e 可選。改完要過 `npm run gate:generated`（diff 審查 + security tests） |

### 主要路由

| 路徑 | 用途 |
|------|------|
| `/` | 首頁漏斗 |
| `/confirm` | 外掛／送出前確認 |
| `/report` | 分析結果 |
| `/samples` | 兩種報告範例 + 比較 |
| `/account`、`/account/danger` | 帳戶與刪除 |
| `/extension` | 安裝外掛 |
| `/privacy`、`/terms` | 法律 |
| `/career-context` | 個人底線 |
| `/shorts`、`/shorts/upload`、`/employer/*` | 短影片／雇主。預設可被 `NEXT_PUBLIC_SHORTS_ENABLED=false` 凍結；首頁 banner 另外寫死關閉 |

### 主要 API

| API | 用途 |
|-----|------|
| `POST /api/analyze` | 核心分析 |
| `POST/GET /api/extension-capture` | 外掛 handoff |
| `POST/GET /api/checkout` | 建立結帳 |
| `POST /api/payment/webhook` | 發額度 |
| `/api/account/*` | 讀取／停用／啟用／刪除 |
| `/api/resumes` | 履歷庫 |
| `GET /api/reports/[id]` | 讀報告 |
| `GET /api/cron/purge-reports` | 清過期報告 |

---

## 12. 架構簡圖

```
Chrome Extension 1.3.2
  LinkedIn / Indeed / ZipRecruiter / Glassdoor / GovernmentJobs / 104
        │ POST /api/extension-capture
        ▼
Next.js on Vercel (jobbeagle.com)
        ├─ /confirm  →  POST /api/analyze
        ├─ Gemini Flash-Lite（Snapshot，無 Search）
        ├─ Gemini Pro + Search（Guide）
        ├─ Supabase Auth + Postgres + Storage（RLS）
        └─ Lemon Squeezy Checkout + webhook（目前 Test mode）
```

---

## 13. 刻意不做

| 項目 | 原因 |
|------|------|
| 給 Snapshot 加 Google Search | 成本與定位：Snapshot 是閉卷分流 |
| Guide 改成先跑 Flash 再跑 Pro，或拆很多階段管線 | 產品決定單次 Pro |
| 接回 Stripe | 已移除 |
| 用 LinkedIn OAuth 當登入 | 外掛只抓職缺；登入是 Google |
| 把 Shorts 當主產品 | 主線是分析漏斗 |
| 兩種報告合成一次扣款的同一份 | 分開選、分開扣額度；Guide 內容上包含 Snapshot |
| 履歷 builder／15 分鐘改履歷教練 | 明確排除 |
| 無來源的「真實面試題」、文化契合分數、假裝雇主 offer | 零幻覺 |
| 客戶端直接改額度 | 安全 |

---

## 14. 關鍵檔案

| 主題 | 路徑 |
|------|------|
| 產品 code | `constants/report-products.ts` |
| 模型 | `constants/models.ts` |
| 額度 | `constants/credits.ts` |
| 定價 | `constants/checkout-plans.ts` |
| 首頁文案 | `constants/homepage-form-copy.ts` |
| 比較表文案 | `constants/report-compare.ts` |
| 報告框／sample 色票 | `constants/report-frame.ts` |
| 首頁表單 | `components/InputForm.tsx`、`components/InputFormMobile.tsx` |
| 比較 UI | `components/ReportCompareModal.tsx`、`components/ReportCompareTable.tsx` |
| Snapshot / Guide UI | `components/LiteReportDashboard.tsx`、`components/FullReportDashboard.tsx` |
| 範例頁 | `app/samples/SampleReportClient.tsx` |
| 範例資料 | `lib/sample-reports.ts` |
| 分析 | `app/api/analyze/route.ts`、`lib/gemini-analyze.ts`、`lib/prompts/` |
| 外掛 | `browser-extension/` |
| 報告規格 | `docs/REPORT_CONTENT_SPEC_V3.md` |

---

## 15. 給建議時請守住的邊界

若你（Gemini）要提產品、UX、成長或技術建議，請先接受下面這些是**已決定的現況**，不要建議把它們推翻，除非明確標成「改變商業模式」：

1. 兩種報告、兩種模型、兩種額度，Snapshot 不上網。
2. 收款只有 Lemon Squeezy，且 live 尚未打開。
3. 主漏斗是：外掛或貼 JD → 確認 → 分析 → 付費牆。Shorts 不是主線。
4. 不教改履歷、不編造事實。
5. 外掛已在 Chrome Web Store 公開（1.3.2）。

適合建議的方向例子：轉換文案、比較表可讀性、付費牆、確認頁、live 金流上線順序、Guide 情報品質、留存。不適合的方向例子：把兩種報告合併、給免費 Snapshot 加 Search、接 Stripe、重寫整個前端框架。
