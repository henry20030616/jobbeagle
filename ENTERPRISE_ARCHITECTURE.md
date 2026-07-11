# JobBeagle — Enterprise Architecture & Cursor Rules (Source)

> 基準日：2026-07-11  
> 對應 Cursor Rules：`.cursor/rules/jobbeagle-*.mdc`  
> 產品現況總覽：見 `PRODUCT_OVERVIEW.md`

---

## 1. 專案核心事實與技術堆棧

此專案定位為面向**美國市場**的「AI 職缺分流／獵頭級職缺分析」SaaS。

| 層 | 技術 |
|----|------|
| 核心框架 | Next.js 15 (App Router)、React 19、TypeScript 5 |
| 資料庫與 Auth | Supabase (PostgreSQL + RLS + Storage) |
| AI | Google Gemini：`gemini-2.5-flash-lite`、`gemini-2.5-pro` |
| 金流 | **Lemon Squeezy**（已棄用 Stripe；嚴禁呼叫相關死碼） |
| 外掛 | Chrome Extension Manifest V3（v1.2.0+） |

---

## 2. P0：Chrome Web Store 上架與法律合規

解決目前必須「手動載入未封裝」的安裝摩擦力。

- **合規宣告**：完善 `/privacy` 與 `/terms`，符合 Google Web Store Developer Program Policies。明確宣告抓取範圍僅限白名單職缺網，且絕不販售使用者資料。
- **CCPA**：`/api/account/delete` 必須串聯 Supabase 執行 Hard Delete（Profile、歷史報告、履歷檔案）。

---

## 3. 企業級五大安全防禦

### 3.1 Rate Limiting & Anti-Sybil

- `POST /api/analyze` 與 `POST /api/extension-capture` 必須有基於 IP 或 User ID 的 Rate Limiting（Map 或 Upstash Redis）。
- 維護新帳號裝置指紋（Sybil），防止洗「終身 3 次免費 Lite」。

### 3.2 Payment Integrity

- Lemon Squeezy webhook：用 `crypto` 驗證 `x-signature` 與 `LEMONSQUEEZY_WEBHOOK_SECRET` 的 HMAC-SHA256。
- 發放額度前檢查訂單 `order_id` 是否已 `processed`（等冪）；已處理則 `return 200`。

### 3.3 Data Privacy & PII

- 履歷 PDF/DOCX 盡量 in-memory；若進 Storage 必須嚴格 RLS + 30 天 purge cron。
- Prompt 避免夾帶信用卡等極端敏感資訊。

### 3.4 Architecture & Secrets

- 禁止將 `SUPABASE_SERVICE_ROLE_KEY`、`GEMINI_API_KEY`、`LEMONSQUEEZY_API_KEY` 暴露給 Client Components。
- 前端僅可使用 `NEXT_PUBLIC_*`。
- 所有表必須啟用 RLS。

### 3.5 Scraping Safety

- `scrape-page.js`：try/catch、合理延遲；DOM 失敗時優雅降級（提示手動貼上），不可讓外掛崩潰。

---

## 4. 產品焦點收斂

- **凍結 Shorts**：運算與開發優先集中於 外掛 → Pre-Flight → 報告分析。
- **死碼清除**：移除 `lib/stripe.ts` 及相關引用。

---

## 5. Cursor 子代理角色（對話觸發）

| 觸發詞 | 專注 |
|--------|------|
| `@SecOpsExpert` | Rate limit、Webhook 簽章、環境變數、SOC2 基礎 |
| `@ExtensionExpert` | MV3 權限最小化、scrape 防禦性編程、Web Store 審核 |
| `@FrontendExpert` | App Router / React 19；Pre-Flight → Paywall 轉換率 |

---

## Status (2026-07-11)

Implemented in repo:
- Privacy/Terms updated for extension whitelist + CCPA hard delete
- Rate limit on analyze + extension-capture (Redis or memory fallback)
- Account delete clears reports + Shorts storage folders
- Shorts frozen unless `NEXT_PUBLIC_SHORTS_ENABLED=true`
- Stripe package/`lib/stripe.ts` removed
- Web Store listing draft: `browser-extension/STORE_LISTING.md`

Remaining manual: Chrome Developer Dashboard upload + screenshots (see STORE_LISTING.md).

