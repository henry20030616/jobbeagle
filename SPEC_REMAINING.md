# Docx 規格對照 — 剩餘事項（2026-07-06）

> **Agent 代跑驗證（2026-07-06 08:32）— 通過後才請你做下方手動清單**

| 檢查項 | 結果 |
|--------|------|
| `www.jobbeagle.com` | HTTP 200 |
| `/pre-flight` | HTTP 200 |
| `/api/analyze`（未登入） | 401 `AUTH_REQUIRED`（非 500/503） |
| `/api/checkout`（未登入） | 401 `AUTH_REQUIRED`（Lemon Squeezy 已設定） |
| `/api/cron/purge-reports` | 200 `deleted:0`（CRON_SECRET 已同步並 redeploy） |
| Supabase profiles / referrals | 表存在，20 profiles |
| GitHub `main` 最新 | `f0b9170` |
| 單元測試 | 121 passed |
| Chrome 外掛 icon PNG | 已產生並 commit（可載入未封裝） |

---

對照 `20260705 我與gemini討論結果.docx` 與目前 repo / 線上狀態。

---

## 已完成（程式 + 已代跑部署）

| 章節 | 項目 | 狀態 |
|------|------|------|
| 二 | 誘餌定價四方案（$3 / $9.99 / $19.99 / $39.99） | Lemon Squeezy + checkout + webhook |
| 三 | Chrome 外掛 → `/pre-flight` 責任轉移 | `browser-extension/background.js` |
| 三 | Google OAuth 強制登入 | 全站 `signInWithOAuth(google)` |
| 四 | profiles / referrals / analysis_reports schema | migration 008 已套用 |
| 六 | API 網關（auth、指紋、截斷、countTokens、24h 快取、扣額度） | `app/api/analyze/route.ts` |
| 七 | Lite / Full prompt + JSON schema | `lib/prompts/`, `lib/gemini-analyze.ts` |
| 七 | Lite UI 豐富化 | `LiteReportDashboard` |
| 八 | CCPA 30 天 single_drop 清除 cron | `vercel.json` + `/api/cron/purge-reports` |
| 八 | 帳戶刪除 Hard Delete | `/api/account/delete` + `DeleteAccountButton` |
| 裂變 | `?ref=` + 激活里程碑 | `lib/referrals.ts` |
| Shorts | AnalysisModal Lite/Full | 已接新 dashboard |
| 部署 | Supabase migration、GitHub OAuth、LS、Vercel env | Agent 已代跑 |

---

## 本次補完（剛 commit）

1. **首頁 Lite / Full 切換** — 與 pre-flight 一致，可選報告類型
2. **首頁 Full 報告顯示** — `FullReportDashboard`
3. **歷史紀錄** — 依 `report_type` 載入 Lite / Full / 舊版
4. **刪除帳戶** — API + 首頁按鈕（CCPA 被遺忘權）
5. **CRON_SECRET** — 已寫入 `.env.local`，待同步 Vercel

---

## 刻意不做 / 與 docx 有落差（可接受）

| 項目 | 說明 |
|------|------|
| **LinkedIn OAuth 登入** | docx 寫 Google/LinkedIn；產品決策僅 Google。LinkedIn 需另建 Developer App（見下方手動清單） |
| **GitHub 登入 UI** | 僅後台 Management API 已設，前端無按鈕 |
| **Stripe** | 已全面改用 Lemon Squeezy；`lib/stripe.ts` 與 `stripe` npm 套件已移除 |
| **Gemini 3.1 型號字串** | 實際用 `constants/models.ts` 可用型號（Flash/Pro），行為符合 spec |
| **Full 報告合併 Lite 分數於同一畫面** | 目前 Lite / Full 分開兩種報告類型（各扣各額度） |
| **Employer dashboard 獨立 hub** | 預設導向 Shorts 公司視圖；`?legacy=1` 保留舊編輯 |

---

## 仍需你手動做一次（清單在最下方）

見 **「一次性手動清單」** 區塊。

---

## 一次性手動清單（Agent 驗證通過後，你只要做這些）

> 只有瀏覽器操作，不必開終端機。約 20 分鐘。

### 1. 網站驗收（https://www.jobbeagle.com）

硬重新整理：`Cmd + Shift + R`

| # | 操作 | 預期 |
|---|------|------|
| 1 | Google 登入 | 右上角用戶名；Lite/Full 額度、推薦連結 |
| 2 | 選 **Lite** → 真實 JD + PDF → 分析 | 完整 Lite 報告 |
| 3 | 點 **Back to Home** | 回到 JD 表單 |
| 4 | 有 Full 額度時選 **Full** 再分析 | Blind/Glassdoor / STAR 區塊 |
| 5 | **History** 開舊報告 | 對應 Lite 或 Full UI |
| 6 | `/shorts` → 影片 → AI 匹配 | 新 Lite 報告 Modal |
| 7 | 額度用盡 → 付費牆 → $3 | 跳 Lemon Squeezy 結帳 |

### 2. Chrome 外掛（一次性，約 3 分鐘）

1. `chrome://extensions` → 開發人員模式 ON
2. **載入未封裝項目** → `jobbeagle/browser-extension`
3. LinkedIn 職缺頁 → 點外掛 → 開 `/pre-flight`

### 3. 選用（現在不必做）

Resend 寄信、LinkedIn OAuth、旋轉 token — 見上方「刻意不做」表。

### 不必再做

Migration、Lemon Squeezy、Vercel env、CRON、deploy — Agent 已代跑並驗證（見頁首表格）。

---

**#1 + #2 全過 = docx 上線驗收完成。** 卡關貼完整錯誤或截圖。
