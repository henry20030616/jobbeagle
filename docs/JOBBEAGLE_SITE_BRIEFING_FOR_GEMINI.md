# JobBeagle 全站說明（給測試用例設計用）

請根據這份文件設計測試用例。這是 2026-09 的執行時代碼真相，不是舊文件。若舊文件寫 Lemon Squeezy / Paddle / Stripe，一律以本文為準：收款只有 PayPal。

產出請包含：

- 功能／回歸／負向／安全／權益（credits）／付款冪等／雙軌分析（Snapshot vs Guide）
- 每個用例：前置條件、步驟、預期、優先級（P0/P1/P2）
- 標明「可自動化」或「必須真人／外掛／PayPal」
- 不要建議把 Google Search 加進 Snapshot
- 不要建議用台灣 PayPal 測 Live 互付（台灣帳戶不能付給台灣帳戶）
- Shorts / 雇主影片為次要，預設可當凍結功能測「打不開」，不要當成主漏斗

線上站：https://www.jobbeagle.com

Chrome 外掛：JobBeagle 1.3.2（已上架）

https://chromewebstore.google.com/detail/jobbeagle-headhunter-leve/pceknhembhfnljhpajkpdbihfbpfolpm

---

## 1. 產品是什麼／不是什麼

JobBeagle 是面向美國求職市場的 AI 職缺決策支援，不是履歷改寫教練。

使用者丟履歷 + 職缺 JD，得到兩種產品之一：

| 產品 | 代碼 | 模型 | 網路 | 免費額度 | 用途 |
|------|------|------|------|----------|------|
| Job Fit Snapshot | job_fit_snapshot（舊名 lite） | gemini-3.1-flash-lite | 禁止 Search / 爬網 | 新帳號終身 3 次 | 適不適合投、匹配分、閉卷薪酬估計 |
| Interview Strategy Guide | interview_strategy_guide（舊名 full） | gemini-3.1-pro-preview | 允許 Google Search grounding | 預設 0 | Snapshot 全部 + 公司情報、面試、談判、出處 |

不是：

- 履歷潤飾工具（Snapshot 不教你怎麼改履歷）
- 職缺搜尋引擎
- 即時聊天
- Stripe / Lemon Squeezy / Paddle 收款（程式已移除，只留 PayPal）

內容紅線（報告品質）：不可捏造經歷、簽證、雇主開價、無法引用的面試題。缺情報要標 limitations / null，不要編。

---

## 2. 主漏斗（P0，測試重心）

主路徑依序為：

1. 職缺頁（LinkedIn 等）
2. Chrome 外掛抓 JD
3. 開 https://www.jobbeagle.com/?sid=...
4. 首頁帶入職缺
5. Google 登入
6. 上傳／貼履歷
7. 選 Snapshot 或 Guide
8. POST /api/analyze
9. /report 看報告
10. 額度用完 → 付費牆 → PayPal → 回 /?checkout=success

備援路徑（也要測）：

- 首頁直接貼 JD + 履歷（不經外掛）
- 外掛 side panel：/confirm?embedded=1&sid=...（沒有 embedded=1 時 /confirm 會踢回 /?...）
- 舊書籤 /pre-flight → 轉到 /confirm
- 舊外掛 ?payload= base64 仍支援

公開展示（不登入、不扣點）：

- /samples?type=job_fit_snapshot
- /samples?type=interview_strategy_guide

---

## 3. 頁面與 API

### 頁面

| 路徑 | 用途 | 備註 |
|------|------|------|
| / | 主產品頁：貼 JD、分析、歷史、付費牆 | 外掛預設落地 |
| /extension | 加到 Chrome | Web Store，zip 後備 |
| /confirm | 側欄確認職缺+履歷 | 需 embedded=1 |
| /report | 當次報告 | 讀 sessionStorage jb_active_report_v1；沒資料會空 |
| /samples | 樣品報告 | 有 SAMPLE 浮水印 |
| /account | 額度、訂單、訂閱、推薦、贊助作者 | |
| /account/danger | 停用／永久刪除（CCPA） | |
| /career-context | 職涯底線（職級、地點、簽證、目標 TC） | 會注入每次分析 |
| /privacy 、 /terms | 法律 | |
| /shorts 、 /employer/* | 短影音招聘 | 旗標未開則導回首頁或 API 503 |

### 關鍵 API

| 方法 | 路徑 | 作用 |
|------|------|------|
| POST | /api/analyze | 分析（最重要） |
| POST/GET/OPTIONS | /api/extension-capture | 外掛交職缺、用 sid 取回 |
| POST/GET | /api/checkout | 建 PayPal 結帳；GET 看方案狀態 |
| POST | /api/payment/webhook | PayPal webhook（驗簽、入帳） |
| GET | /api/payment/paypal-return | PayPal 回站、入帳、導向 /?checkout= |
| GET/PATCH | /api/profile | 個人資料／Career Context |
| GET | /api/reports/[id] | 讀單份報告（受 RLS） |
| * | /api/resumes | 履歷庫 |
| POST | /api/account/delete | 硬刪帳號 |
| POST | /api/account/deactivate 、 /reactivate | 停用／恢復 |
| GET/POST | /api/account/subscription 、 /cancel-subscription 、 /billing-portal | 訂閱 |
| GET | /api/health | 回 ok: true |
| GET | /api/cron/purge-reports | 清 30 天以上的單次購買報告（需 CRON_SECRET） |

---

## 4. 登入與帳號

- 只有 Google OAuth（Supabase Auth），沒有 email/password。
- Callback：/auth/callback?code=&redirect=&ref=
- 失敗回 /?auth_error=...
- 第一次登入建立 profiles，送 3 次終身 Snapshot。
- 停用：profiles.deactivated_at 有值 → 分析與結帳 403 ACCOUNT_DEACTIVATED，可 reactivate。
- 硬刪：刪 reports、履歷庫、storage、auth user。
- 推薦碼：?ref= 或 localStorage jb_referral_code；第一次成功 Snapshot 可能觸發推薦里程碑。

---

## 5. Chrome 外掛

- MV3，版本 1.3.2
- 看板：LinkedIn、Indeed、ZipRecruiter、Glassdoor、GovernmentJobs、104
- 點圖示抓 JD → POST /api/extension-capture → 回傳簽名 sid（30 分鐘過期）
- 開站：https://www.jobbeagle.com/?sid=...
- 取回：GET /api/extension-capture?sid= ；過期／無效 410
- JD 太短（小於 40 字）不能發 sid；上限約 120k
- 限流：外掛 capture 每 IP 每小時 60
- 抓取失敗 query：not_job_detail、scrape_failed、capture_failed、site_access、no_job_page
- 簽名密鑰：EXTENSION_HANDOFF_SECRET → 否則 CRON_SECRET → 否則 service role

真人測試：改完外掛必須在 chrome://extensions 重新載入。

---

## 6. 分析 API（POST /api/analyze）

逾時上限 180 秒。必須登入。

### 輸入優先序

1. handoff_sid（外掛 token）
2. payload（舊外掛）
3. jobDescription + resume（首頁）

另可帶：report_type、language、device_fingerprint、career_context

### 額度規則（必測）

- Snapshot / Guide 兩池分開，用錯池會 402。
- 先扣點再打 Gemini；AI 失敗則退點。
- 沒有結果快取：每次成功都扣 1 點。歷史從 DB 重看，不重跑。
- 訂閱用戶也扣月額，不是無限。
- 免費：終身 3 Snapshot，不會每天重置。

### 限流與防刷

| 閘 | 限制 | 對象 |
|----|------|------|
| 每使用者 | 30 次／時 | 全員 |
| 免費 + 有裝置指紋 | 20 次／時／IP | free |
| 免費 + 無指紋 | 3 次／日／IP | free |
| 裝置指紋已被別的帳號綁定 | 403 DEVICE_LIMIT | free |

### 狀態碼

| HTTP | code | 含義 |
|------|------|------|
| 401 | AUTH_REQUIRED | 未登入 |
| 402 | PAYMENT_REQUIRED | 額度不足 |
| 403 | ACCOUNT_DEACTIVATED / DEVICE_LIMIT | 停用／裝置衝突 |
| 429 | RATE_LIMIT | 限流 |
| 400 | MISSING_RESUME、INVALID_JD、JD_*、TEXT_TOO_LONG、TOKEN_LIMIT | 驗證失敗 |
| 503 | SERVER_CONFIG | 後端沒 admin |
| 500 | ANALYSIS_ERROR | Gemini／解析失敗（應退點） |

JD 驗證碼：JD_EMPTY、JD_TOO_SHORT、JD_URL_ONLY、JD_REPEATING_CHARS、JD_LOW_READABLE_RATIO、JD_UNRELATED_CONTENT、JD_PROMPT_INJECTION、JD_TOO_LONG

長度：JD 小於等於 8000、履歷小於等於 10000、合併 token 小於等於 4500。

未信任的 JD／履歷必須被 fence，不可進 system prompt（防 prompt injection）。

失敗時會寄交易／分析失敗信（Resend；沒 key 就略過）。

---

## 7. 報告 UI

### Snapshot（LiteReportDashboard）

單頁投影片框：Fit 分數、Score Summary（適配理由，不是履歷教練）、Range Evaluation（職缺市場價值）、優劣、Beagle Scale（滑過分數圈才出現）。

### Guide（FullReportDashboard）

上方橫向分頁：Snapshot · Hiring Context · Interview · Salary · Provenance。第一頁就是 Snapshot 同款框。

### /report

只看當次 sessionStorage。新分頁直接開 /report 應顯示空狀態。

歷史：首頁登入後從 analysis_reports 列最近 20 筆再開。

樣品必須與正式報告版型一致。

---

## 8. 付費（PayPal only）

現況線上：GET /api/checkout → provider: paypal、environment: live、四個主方案 priceConfigured: true。

| planType | 價格 | 給什麼 |
|----------|------|--------|
| single_job_fit_snapshot | $3 | +1 Snapshot |
| single_interview_strategy_guide | $9.99 | +1 Guide |
| standard_subscription | $19.99/月 | +100 Snapshot +5 Guide，tier standard_sub |
| advanced_subscription | $39.99/月 | +300 Snapshot +15 Guide，tier advanced_sub |
| author_sponsor | $0.50–$1000 自訂 | 不加點，只贊助 |

舊別名（仍可能正規化）：single_lite、single_full 等。不要當新方案測。

### 結帳流程

1. 登入後 POST /api/checkout，body 含 planType
2. 寫 orders（pending）
3. 回 PayPal URL
4. 取消 → /?checkout=cancel
5. 成功：webhook 與／或 /api/payment/paypal-return → fulfill → /?checkout=success

### 入帳不變量（P0）

- Webhook 先驗 PayPal 簽名再改點數。
- 同一 order 已 succeeded → 回 200，不可再加一次點。
- 第一次買訂閱：increment（加在現有餘額上），不可覆蓋清掉剩餘免費點。
- 程式裡有 fulfillSubscriptionRenewal（續扣時把點數重設成 100/5 或 300/15），目前 webhook 可能沒接到續扣——測到續扣行為要以實際 webhook 為準，並當已知風險。
- 取消／過期訂閱的降級同樣可能未完整接 webhook。
- 客戶端不能自己改 profiles 額度或 membership_tier（RLS + trigger）。

### 台灣限制

店家 PayPal 是台灣帳。台灣 PayPal 不能付給台灣 PayPal，owner 無法自測 Live。Sandbox 已驗證過加點。Live 以第一個美國付款者為準。

---

## 9. 資料與隱私

Supabase（Postgres + Auth + Storage + RLS）。

核心表：profiles、analysis_reports、resume_history、orders、referrals。

- 額度欄位只有 service_role / SECURITY DEFINER RPC 能改。
- 單次購買報告 is_single_drop=true，cron 30 天後清（文案若寫 90 天以程式 30 天為準）。
- 履歷以記憶體解析為主；上傳需 owner-only RLS。

---

## 10. 次要功能（P2）

- Shorts / Employer：NEXT_PUBLIC_SHORTS_ENABLED 不是 true 時路由凍結。首頁 Shorts banner 程式寫死關閉。
- 多語 UI（en / zh-TW / zh-CN / es / hi / ar），報告語言可跟 UI 走。
- Career Context：目標職級、地點、工作權、目標／底線 TC、不可妥協、強項。
- GA 漏斗事件（正式報表看「報表 → 即時」，不是 DebugView）：sign_up / login → add_extension → preflight → job_analyzed → view_item_list → begin_checkout → purchase。另有 view_report。?ga_debug=1 才進 DebugView。
- 監控：Vercel Analytics / Speed Insights、GET /api/health。

---

## 11. 設計用例時必須守住的不變量

1. Snapshot 不得走 Search／開書模型。
2. Snapshot 與 Guide 額度獨立。
3. 免費 3 次是終身，不是每日。
4. 先扣再跑 AI，失敗要退。
5. 成功分析必扣點；看歷史不扣。
6. 同一裝置指紋不能無限開免費號。
7. 停用帳不能分析、不能結帳。
8. PayPal webhook 重送不可雙倍加點。
9. 前端不能自己加點。
10. JD／履歷必須當不可信輸入。
11. sid 30 分鐘過期。
12. /report 沒有當次 session 就是空的。
13. 不要把 Shorts 當上線主路徑。
14. 不要把 Stripe／LS／Paddle 加回來。

---

## 12. 建議測試矩陣（請展開成具體用例）

### P0 主路徑

- 未登入按分析 → 401／導登入
- 登入後貼合格 JD + 履歷 → Snapshot 成功、額度 3→2、進 /report 有分數
- 同一報告從歷史再開，額度不變
- Guide 在 0 點時 → 402 付費牆，不打 Pro
- 外掛抓 LinkedIn 詳情頁 → /?sid= → 職缺預填 → 分析成功
- 非職缺頁／JD 小於 40 字 → 外掛失敗或不能發 sid
- sid 過期後 GET → 410
- 402 後選 $3 → PayPal sandbox（或 mock）→ webhook 後 Snapshot +1
- webhook 重放同一 order → 點數不加倍
- 帳上還有免費剩餘時買 Standard → 點數是「加上去」不是被重設成只有 100
- 停用後分析／結帳 403；恢復後可分析
- 刪帳後資料與 auth 消失

### P0 安全

- 未登入不能讀別人 analysis_reports
- 改 profile JSON 不能把 credits / tier 改上去
- webhook 假簽名 → 4xx、不加點
- JD 含 prompt injection 字樣 → JD_PROMPT_INJECTION 或被 fence，不進 system
- /api/check-env 正式環境無 secret → 不可洩漏金鑰

### P1

- 免費無指紋：同 IP 超過 3 次／日
- 裝置指紋綁兩帳 → 403
- AI 失敗（mock Gemini throw）→ 500 且額度退回
- 履歷缺、只有 URL 當 JD、亂碼 JD
- Career Context 有填時，報告 target_gap／薪酬有反映
- Guide 報告五個分頁都有、第一頁是 Snapshot
- /samples 兩種 type 與正式版型一致
- PayPal 取消 → checkout=cancel、不加點
- 贊助 $0.49 拒絕、$0.50 接受、成功不加點
- /confirm 無 embedded 會回首頁
- 新分頁開 /report 為空

### P2

- Shorts 未開旗標時 /shorts 回首頁
- 多語切換不炸版
- 失敗信：無 RESEND 不影響分析；有 RESEND 時 500 會寄
- GA：分析成功應有 job_analyzed（即時報表，可能延遲）

### 無法／不該由台灣 owner 測 Live

- 用自己的台灣 PayPal 付 Live 商店
- 用假美國身份過 PayPal

可用 Sandbox 或 mock webhook 測加點；Live 等真實美國使用者。

---

## 13. 技術棧（寫自動化時）

- Next.js 15 App Router、React 19、TypeScript、Tailwind
- Supabase：Postgres、Google OAuth、RLS、Storage
- Gemini：@google/genai
- 付款：PayPal REST（Orders + Subscriptions + Webhooks）
- 測試：Vitest（__tests__/unit、__tests__/api）、Playwright e2e（可略）、npm run gate:generated（安全＋靜態審查）
- 現有測試請對齊擴充，不要另起衝突的產品定義

---

請先列出 P0 用例清單（表格），再展開每案的步驟與預期。標出需要 mock 的外部系統：Gemini、PayPal、Resend、Chrome 外掛。
