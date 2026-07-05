# JobBeagle — Unified Master Spec 部署清單

程式端（Lite/Full、pre-flight、Shorts 對齊、推薦、CCPA purge）已完成並 push 後，**只需完成以下手動步驟一次**。

---

## 1. Vercel 環境變數（Production）

路徑：**Vercel → jobbeagle → Settings → Environment Variables**

| 變數 | 必填 | 說明 |
|------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase 專案 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | **額度扣減 / webhook / cron 必需** |
| `GEMINI_API_KEY` | ✅ | Google AI Studio API key |
| `LEMONSQUEEZY_API_KEY` | ✅ | Lemon Squeezy API |
| `LEMONSQUEEZY_STORE_ID` | ✅ | `424272` |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | ✅ | Webhook 簽章 |
| `LEMONSQUEEZY_VARIANT_SINGLE_LITE` | ✅ | 可沿用 `1869600` |
| `LEMONSQUEEZY_VARIANT_SINGLE_FULL` | ✅ | 新建 $9.99 產品 variant ID |
| `LEMONSQUEEZY_VARIANT_STANDARD_SUB` | ✅ | 新建 $19.99/mo variant ID |
| `LEMONSQUEEZY_VARIANT_ADVANCED_SUB` | ✅ | 新建 $39.99/mo variant ID |
| `RESEND_API_KEY` | 建議 | Shorts 應徵 Email |
| `CRON_SECRET` | 建議 | `/api/cron/purge-reports` 保護 |

改完後：**Deployments → Redeploy** 最新一筆。

---

## 2. Supabase SQL（若尚未執行）

在 **SQL Editor** 依序執行（專案 `yvzorfeespljbitxxufo`）：

1. `supabase/migrations/003_p0_security_rls.sql`（若未跑）
2. `supabase/migrations/008_unified_master_spec.sql`

成功訊息：`Success. No rows returned`

**補舊用戶 profile（若 Table Editor 沒有 profiles 列）：**

```sql
INSERT INTO public.profiles (id, full_name, avatar_url, available_lite_credits, available_full_credits)
SELECT id,
  raw_user_meta_data->>'full_name',
  raw_user_meta_data->>'avatar_url',
  3,
  0
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);
```

---

## 3. Lemon Squeezy

1. 建立產品（若尚未建立）：
   - Single Full · $9.99
   - Standard · $19.99/mo（100 Lite + 10 Full）
   - Advanced · $39.99/mo（300 Lite + 30 Full）
2. 複製各 **Variant ID** 填入 Vercel env（見上表）
3. **Webhook**：`https://www.jobbeagle.com/api/payment/webhook`
   - Events: `order_created`, `subscription_created`, `subscription_payment_success`
4. 測試：`POST /api/checkout` body `{ "planType": "single_lite" }` 應回 checkout URL（非 `missingVariants`）

---

## 4. Google OAuth（若登入失敗才檢查）

Google Cloud Console → OAuth Client → Authorized redirect URIs 需包含：

- `https://www.jobbeagle.com/auth/callback`
- `https://yvzorfeespljbitxxufo.supabase.co/auth/v1/callback`

---

## 5. 驗收（約 10 分鐘）

| # | 步驟 | 預期 |
|---|------|------|
| 1 | 登入 → 首頁看到 **Lite / Full 額度** + 推薦連結 | Credits badge 顯示 |
| 2 | 貼真實 JD + PDF → Lite 分析 | 完整報告（米格魯、優勢/缺口、面試題） |
| 3 | LinkedIn 職缺 → Chrome 外掛 | 跳轉 `/pre-flight` → Launch | 
| 4 | Shorts 影片 → AI 匹配 | Modal 顯示新 Lite 報告（非舊 5 欄） |
| 5 | 額度用完 → 付費牆 → $3 測試 | Lemon Squeezy checkout 可開 |
| 6 | 付款成功回 `/?checkout=success` | 額度數字增加 |

---

## 6. 不需手動做的事（已由程式處理）

- Lite/Full Gemini 路由與 JD 驗證
- 24h 快取、設備指紋防 Sybil
- 推薦碼 `?ref=` → OAuth callback 激活
- 免費用戶報告 `is_single_drop` + 每日 cron 30 天硬刪
- 訂閱用戶報告保留（Career CRM）

---

有問題把 Vercel build log 或 Supabase 錯誤訊息貼回即可。
