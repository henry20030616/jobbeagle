# JobBeagle 上線部署清單（一次性完成）

> **用法：** **Cursor Agent 代跑**所有可自動化步驟（見 `.cursor/rules/agent-runs-ops.mdc`）。  
> 你**不必開終端機**；只需在 Agent 無法代做時完成瀏覽器後台操作（OAuth、Lemon Squeezy 建產品等）。  
> 任一步失敗 → 把**完整錯誤訊息**貼給 Cursor。  
> 程式碼 push 到 `main` 後 Vercel 會自動部署；**env / DB / 付款後台**須設定後才會全通。

**Agent 代跑腳本：**
- `bash scripts/ops/bootstrap-remote.sh` — **一鍵**：migration + GitHub auth + Lemon Squeezy + Vercel（需 `.env.local` 有 `SUPABASE_ACCESS_TOKEN` + `LEMONSQUEEZY_API_KEY`）
- `bash scripts/ops/sync-all.sh` — Vercel 同步 + 三方驗證 + Production redeploy
- `node scripts/ops/verify-integrations.mjs` — GitHub / Supabase / Vercel 健康檢查
- `bash scripts/ops/sync-vercel-env.sh` — 僅同步 Vercel env
- `node scripts/ops/verify-supabase.mjs` — 確認 profiles 表

**預估時間：** 30–45 分鐘（含 Lemon Squeezy 建產品）  
**你的 Supabase 專案：** `yvzorfeespljbitxxufo`  
**正式網域：** `https://www.jobbeagle.com`  
**Lemon Squeezy Store ID：** `424272`

---

## 總覽：要做什麼、為什麼

| 步驟 | 做什麼 | 不做會怎樣 |
|------|--------|------------|
| **0** | 確認 Vercel 已部署最新版 | 線上還是舊 UI |
| **1** | Supabase 跑 migration + 補 profiles | 分析報 `profiles` 表不存在、額度失效 |
| **2** | Vercel 填齊環境變數 + Redeploy | 分析/扣額度/付款 webhook 全掛 |
| **3** | Lemon Squeezy 建產品 + Webhook | 付費牆點了沒反應 |
| **4** | （選用）Google OAuth / Resend | 只有登入或應徵信失敗時才要查 |
| **5** | 驗收 6 項 | 確認上線可用 |

---

## Step 0：確認 Vercel 部署成功

1. 打開 [Vercel Dashboard](https://vercel.com/dashboard) → 進入 **jobbeagle** 專案。
2. 看 **Deployments** 最上面一筆：
   - 狀態須為 **Ready**（綠色）
   - Commit 訊息應含 `Complete Unified Master Spec` 或更新
3. 打開 `https://www.jobbeagle.com`，硬重新整理：`Cmd + Shift + R`（Mac）或 `Ctrl + Shift + R`（Windows）。

**通過標準：** 網站能開、無 500 錯誤。

**若 Build 失敗：** 點進該 Deployment → **Building** log → 複製錯誤貼給 Cursor。

---

## Step 1：Supabase 資料庫（約 5 分鐘）

### 1.1 開啟 SQL Editor

1. 打開 [Supabase Dashboard](https://supabase.com/dashboard/project/yvzorfeespljbitxxufo)
2. 左側 **SQL Editor** → **New query**

### 1.2 確認 migration 是否已跑過

在 SQL Editor 貼上並執行：

```sql
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'profiles'
) AS profiles_exists;
```

- 結果 `profiles_exists = true` → **跳過 1.3 的 008**，直接做 **1.4**
- 結果 `false` → 繼續 **1.3**

### 1.3 執行 migration 檔（依序、各跑一次）

**檔案在本機 repo：**

| 順序 | 檔案路徑 | 何時需要 |
|------|----------|----------|
| A | `supabase/migrations/003_p0_security_rls.sql` | 若從未跑過 RLS |
| B | `supabase/migrations/008_unified_master_spec.sql` | **必跑**（profiles、額度、referrals） |

操作：

1. 用編輯器打開檔案 → **全選複製** SQL 內容
2. 貼到 Supabase SQL Editor → 點 **Run**
3. 成功訊息：`Success. No rows returned`（或類似，**不是**紅色錯誤）

**常見錯誤：**

| 錯誤 | 意思 | 處理 |
|------|------|------|
| `relation "profiles" already exists` | 008 已跑過 | 可忽略，改做 1.4 |
| `permission denied` | 權限問題 | 確認用的是專案 Owner 帳號 |

### 1.4 補齊舊用戶的 profiles（建議一定跑）

讓已註冊但沒有 profile 列的使用者拿到 **3 次 Lite**：

```sql
INSERT INTO public.profiles (id, full_name, avatar_url, available_lite_credits, available_full_credits)
SELECT
  u.id,
  u.raw_user_meta_data->>'full_name',
  u.raw_user_meta_data->>'avatar_url',
  3,
  0
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
);
```

### 1.5 驗證

```sql
SELECT COUNT(*) AS profile_count FROM public.profiles;
SELECT id, available_lite_credits, available_full_credits, membership_tier
FROM public.profiles
LIMIT 5;
```

**通過標準：** `profiles` 表有資料；`available_lite_credits` 多為 `3`。

### 1.6 複製 Service Role Key（Step 2 要用）

1. Supabase → **Project Settings** → **API**
2. 找到 **`service_role`**（secret，不要公開）
3. 複製備用 → 下一步貼到 Vercel

---

## Step 2：Vercel 環境變數（約 10 分鐘）

### 2.1 進入設定頁

1. [Vercel](https://vercel.com/dashboard) → **jobbeagle**
2. **Settings** → **Environment Variables**
3. 環境勾選：**Production**（建議 Preview / Development 一併填同組值）

### 2.2 必填變數（缺一分析或付款會壞）

從 Supabase **Settings → API** 複製：

| Key | 值從哪裡來 | 用途 |
|-----|------------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project URL | 前端連線 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → `anon` `public` | 前端 Auth |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → `service_role` **secret** | 扣額度、webhook、寫入報告 |

從 [Google AI Studio](https://aistudio.google.com/apikey)：

| Key | 用途 |
|-----|------|
| `GEMINI_API_KEY` | Lite / Full AI 分析 |

從 [Lemon Squeezy](https://app.lemonsqueezy.com) → **Settings → API**：

| Key | 值 | 用途 |
|-----|-----|------|
| `LEMONSQUEEZY_API_KEY` | 建立 API Key 後複製 | 開 checkout |
| `LEMONSQUEEZY_STORE_ID` | `424272` | 你的商店 |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | Step 3.3 建立 webhook 後複製 | 驗證付款回調 |
| `LEMONSQUEEZY_VARIANT_SINGLE_LITE` | `1869600`（舊產品可沿用） | $3 Lite |
| `LEMONSQUEEZY_VARIANT_SINGLE_FULL` | Step 3.1 新建後填 | $9.99 Full |
| `LEMONSQUEEZY_VARIANT_STANDARD_SUB` | Step 3.1 新建後填 | $19.99/月 |
| `LEMONSQUEEZY_VARIANT_ADVANCED_SUB` | Step 3.1 新建後填 | $39.99/月 |

建議一併設定：

| Key | 值 | 用途 |
|-----|-----|------|
| `LEMONSQUEEZY_TEST_MODE` | `false`（Production） | 正式收款 |
| `LEMONSQUEEZY_VARIANT_BASIC_OVERAGE` | `1869600` | single_lite fallback |

### 2.3 選填（功能增強，非分析核心）

| Key | 用途 | 沒設會怎樣 |
|-----|------|------------|
| `RESEND_API_KEY` | Shorts 應徵 Email 通知 | 應徵成功但不寄信 |
| `CRON_SECRET` | 保護每日報告清除 API | cron 可能被外部呼叫 |
| `UPSTASH_REDIS_REST_URL` / `TOKEN` | 進階限流 | 仍可用內建限流 |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics | 無 GA 追蹤 |

### 2.4 儲存後必須 Redeploy

1. **Deployments** → 最新一筆右側 **⋯** → **Redeploy**
2. 等狀態 **Ready**

**通過標準：** Redeploy 成功；之後登入首頁不應出現「quota service unavailable」。

---

## Step 3：Lemon Squeezy 產品與 Webhook（約 15 分鐘）

### 3.1 建立缺少的產品（若尚未建立）

在 [Lemon Squeezy](https://app.lemonsqueezy.com) → Store **424272** → **Products** → **New Product**

| 產品名稱（建議） | 定價 | 類型 | 對應 env 變數 |
|------------------|------|------|----------------|
| JobBeagle Single Full | **$9.99** 一次性 | Single payment | `LEMONSQUEEZY_VARIANT_SINGLE_FULL` |
| JobBeagle Standard | **$19.99/月** | Subscription | `LEMONSQUEEZY_VARIANT_STANDARD_SUB` |
| JobBeagle Advanced | **$39.99/月** | Subscription | `LEMONSQUEEZY_VARIANT_ADVANCED_SUB` |

每個產品建立後：

1. 點進產品 → 找到 **Variant**
2. 複製 **Variant ID**（數字）
3. 回到 Vercel → 貼到對應 env → **再 Redeploy 一次**

已有可沿用：

| 產品 | Variant ID | env |
|------|------------|-----|
| 舊 $3 Lite | `1869600` | `LEMONSQUEEZY_VARIANT_SINGLE_LITE` |

### 3.2 確認 API Key 權限

**Settings → API** → 建立或確認 API Key 有 **Read + Write**。

### 3.3 設定 Webhook

1. **Settings → Webhooks** → **+**
2. **URL：** `https://www.jobbeagle.com/api/payment/webhook`
3. **Signing secret：** 複製 → 貼到 Vercel `LEMONSQUEEZY_WEBHOOK_SECRET`
4. **Events 勾選：**
   - `order_created`
   - `subscription_created`
   - `subscription_payment_success`
5. 儲存 → Vercel **Redeploy**

### 3.4 快速測試 checkout（登入後）

1. 登入 `https://www.jobbeagle.com`
2. 打開瀏覽器 DevTools → **Console**，貼上：

```javascript
fetch('/api/checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ planType: 'single_lite' }),
}).then(r => r.json()).then(console.log);
```

**通過標準：** 回傳物件含 `url`（Lemon Squeezy 結帳連結），**不是** `LEMONSQUEEZY_VARIANT_MISSING` 或 `503`。

---

## Step 4：選用檢查（只有出問題才做）

### 4.1 Google 登入失敗

[Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → 你的 OAuth Client

**Authorized redirect URIs** 須包含：

```
https://www.jobbeagle.com/auth/callback
https://yvzorfeespljbitxxufo.supabase.co/auth/v1/callback
```

Supabase → **Authentication → Providers → Google** 亦須啟用並填入 Client ID / Secret。

### 4.2 本機開發 `.env.local`

可對照 repo 根目錄 `env.example` 複製為 `.env.local`（**不要 commit**）。本機與 Vercel 可用同一組 Supabase / Gemini；Lemon Squeezy 測試可設 `LEMONSQUEEZY_TEST_MODE=true`。

---

## Step 5：上線驗收（約 10 分鐘）

完成 Step 0–3 後，依序測試：

| # | 操作 | 預期結果 |
|---|------|----------|
| 1 | Google 登入首頁 | 右上角顯示用戶名；表單上方有 **Lite / Full 額度** 與 **推薦連結** |
| 2 | 貼 **真實 JD** + **PDF 履歷** → 分析 | 完整 Lite 報告：米格魯圖、分數環、優勢/缺口、面試題、薪酬 |
| 3 | LinkedIn 搜尋頁選職缺 → 點 Chrome 外掛 **1.1.0**（先重載外掛） | **Side Panel** 開 pre-flight，公司/JD 正確 → Launch；額度 0 顯示付費牆 |
| 4 | `/shorts` → 某影片 → AI 匹配 | Modal 內為新 Lite 報告（不是只有 5 欄的舊 Snapshot） |
| 5 | 額度用盡 → 付費牆 → 點 $3 Lite | 跳轉 Lemon Squeezy 結帳頁 |
| 6 | 測試付款成功（或 sandbox） | 回到 `/?checkout=success`，額度數字增加 |

**全部通過 = 上線完成。**

---

## 正式上線前 — Chrome 外掛商店（暫緩）

> **2026-07-11 決定：保留現狀，先不送審。**  
> 之後你說「正式上線／要公開／要上架外掛」時，Agent 必須提醒你做下面清單。

### 到時候你要做

1. 確認 zip：`jobbeagle-extension-*.zip`（或請 Agent 依最新 `browser-extension/` 重打）  
2. 開 https://chrome.google.com/webstore/devconsole → 新增／更新項目 → 上傳 zip  
3. 隱私政策填：`https://www.jobbeagle.com/privacy`  
4. 上傳截圖（LinkedIn／Indeed／Pre-Flight／報告）  
5. 按 **提交審查（Submit for review）**  
6. 細節見 `browser-extension/STORE_LISTING.md`

**現在不用做：** 不要按送審。本機繼續用「載入未封裝」即可。

---

## 使用者只要做的事（日常）

> Agent 代跑：git push、Vercel 部署、Supabase migration、env 同步、LS webhook。  
> **你只做下面清單。**

### A. 每次 Agent 更新 `browser-extension/` 後（約 30 秒）

1. 網址列輸入 **`chrome://extensions`** 並 Enter  
2. 右上角開啟 **「開發人員模式」**（若尚未開啟）  
3. 找到 **JobBeagle - Headhunter-Level Job Triage**  
4. 點該卡片上的 **「重新載入」** 圓形箭頭按鈕  
5. 確認版本為 **1.2.0**（或 Agent 告知的版本）

### B. 測試 LinkedIn 外掛（約 2 分鐘）

1. 打開 [LinkedIn 職缺搜尋](https://www.linkedin.com/jobs/)，搜尋關鍵字  
2. **左側點選一個職缺**，等 **右側詳情** 完全載入  
3. 點工具列 **JobBeagle 圖示**  
4. 預期：開 Pre-Flight 分頁，公司／職稱／JD 正確  
5. 貼履歷 → **Launch**（額度足夠）或看到 **付費牆**（額度 0）

### C. 僅 Agent 無法代做時（通常各做一次）

| 項目 | 連結 |
|------|------|
| Google 登入 OAuth | Supabase → Authentication → Google |
| Lemon Squeezy 確認產品價格 | [LS Dashboard](https://app.lemonsqueezy.com/) |
| 貼 Access Token 給 Agent | [Supabase tokens](https://supabase.com/dashboard/account/tokens)、[LS API](https://app.lemonsqueezy.com/settings/api) |
| **（正式上線時）Chrome Web Store 送審** | 見上方「正式上線前」；[Developer Dashboard](https://chrome.google.com/webstore/devconsole) |

---

## 附錄 A：變數一覽（可整段對照）

```env
# === 必填 ===
NEXT_PUBLIC_SUPABASE_URL=https://yvzorfeespljbitxxufo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<Supabase anon key>
SUPABASE_SERVICE_ROLE_KEY=<Supabase service_role secret>
GEMINI_API_KEY=<Google AI Studio key>

LEMONSQUEEZY_API_KEY=<LS API key>
LEMONSQUEEZY_STORE_ID=424272
LEMONSQUEEZY_WEBHOOK_SECRET=<LS webhook signing secret>
LEMONSQUEEZY_TEST_MODE=false

LEMONSQUEEZY_VARIANT_SINGLE_LITE=1869600
LEMONSQUEEZY_VARIANT_BASIC_OVERAGE=1869600
LEMONSQUEEZY_VARIANT_SINGLE_FULL=<新建>
LEMONSQUEEZY_VARIANT_STANDARD_SUB=<新建>
LEMONSQUEEZY_VARIANT_ADVANCED_SUB=<新建>

# === 選填 ===
RESEND_API_KEY=
CRON_SECRET=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

---

## 附錄 B：程式已自動處理（你不用做）

- Lite / Full Gemini 分析、JD 惡意輸入攔截
- 登入才能分析、設備指紋防多帳白嫖
- 24 小時同 JD 快取
- 推薦碼 `?ref=CODE` → 好友首次 Lite 分析後你 +1 Lite
- 免費用戶報告 30 天後 cron 硬刪；訂閱用戶報告保留

---

## 出問題時貼什麼給 Cursor

請一次貼齊：

1. **哪一步**（例如 Step 2.4 Redeploy 後分析仍失敗）
2. **完整錯誤文字**（Supabase SQL 紅字 / Vercel log / 瀏覽器 Console / Network 裡 `/api/analyze` 回應）
3. **截圖**（若為 UI 問題）

不必逐步回報「我做完了 Step 1」；**全部做完或卡關時再說即可。**
