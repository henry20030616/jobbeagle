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
| **Stripe** | 已全面改用 Lemon Squeezy；`lib/stripe.ts` 為死碼 |
| **Gemini 3.1 型號字串** | 實際用 `constants/models.ts` 可用型號（Flash/Pro），行為符合 spec |
| **Full 報告合併 Lite 分數於同一畫面** | 目前 Lite / Full 分開兩種報告類型（各扣各額度） |
| **Employer dashboard 獨立 hub** | 預設導向 Shorts 公司視圖；`?legacy=1` 保留舊編輯 |

---

## 仍需你手動做一次（清單在最下方）

見 **「一次性手動清單」** 區塊。

---

## 一次性手動清單（全部做完即 docx 上線完成）

### A. 瀏覽器驗收（約 15 分鐘）

1. 打開 https://www.jobbeagle.com ，`Cmd+Shift+R` 硬重新整理
2. Google 登入 → 確認右上角顯示 **Lite / Full 額度** 與 **推薦連結**
3. 選 **Lite** → 貼真實 JD + PDF 履歷 → 分析 → 確認完整 Lite 報告
4. 點 **Back to Home** → 應回到表單（非卡在報告）
5. 若有 Full 額度：選 **Full** → 再分析 → 確認 Blind/Glassdoor 區塊
6. LinkedIn 職缺頁 → 點 Chrome 外掛 → 應開 `/pre-flight`
7. `/shorts` → 影片 AI 匹配 → Modal 為新 Lite 報告
8. 額度用盡 → 付費牆 → 點 $3 → 應跳 Lemon Squeezy 結帳

### B. Chrome 外掛安裝（一次性，約 3 分鐘）

1. Chrome → `chrome://extensions` → 開發人員模式 ON
2. **載入未封裝項目** → 選本機資料夾 `jobbeagle/browser-extension`
3. 到 LinkedIn 職缺頁點外掛圖示測試

### C. 選用（只有要開通時才做）

| 要做的事 | 連結 | 何時需要 |
|----------|------|----------|
| **Resend 寄信**（Shorts 應徵通知） | https://resend.com/api-keys | 雇主收到應徵 email 時 |
| **LinkedIn OAuth 登入** | https://www.linkedin.com/developers/ | 若要 LinkedIn 一鍵登入（非現況） |
| **旋轉已外洩的 API token** | Supabase Tokens / Lemon Squeezy API | 安全建議（對話曾貼過 key） |

### D. 不必再做

- Supabase migration 008（已代跑）
- Lemon Squeezy 產品 / webhook / Vercel env（已代跑）
- Vercel `vercel login`（已完成）
- 自己開終端機跑 deploy（Agent 規則已代跑）

---

**全部 A + B 通過 = docx 規格上線驗收完成。**  
卡關把完整錯誤貼給 Cursor，不必分次回報。
