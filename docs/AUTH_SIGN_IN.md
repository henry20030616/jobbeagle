# JobBeagle 登入方式（美國上線）

## 產品現況

| 方式 | 狀態 | 誰設定 |
|---|---|---|
| Google OAuth | 已上線 | 已開（維持） |
| Email Magic Link（免密碼信箱連結） | **UI 已上** | 你需在 Supabase 確認 Email 已開 |
| Apple / LinkedIn / Microsoft | 未接 | 需各平台開發者帳號 + Supabase Provider |

美國消費／SaaS 常見組合：**Google + Email**（或 Apple）。求職產品再加 LinkedIn 有幫助，但 OAuth 審核較慢，可第二波再做。

## 你要開的：Email Magic Link（約 3 分鐘）

1. 打開 [Supabase Dashboard](https://supabase.com/dashboard/project/yvzorfeespljbitxxufo)  
2. **Authentication → Providers → Email**  
3. 確認 **Enable Email provider** 開啟  
4. 建議開啟 **Confirm email**（預設常已開）  
5. **Authentication → URL Configuration**  
   - Site URL：`https://www.jobbeagle.com`  
   - Redirect URLs 需包含：  
     - `https://www.jobbeagle.com/auth/callback`  
     - `https://www.jobbeagle.com/auth/callback?**`（若面板支援萬用）  
     - 本機：`http://localhost:3000/auth/callback`  
6. （正式量大時）**Project Settings → Authentication → SMTP** 換成 Resend／SendGrid；否則用 Supabase 內建信箱，容易進垃圾郵件或有額度限制。

測法：首頁點 **Email** → 輸入信箱 → 到信箱點連結 → 應登入並進站。

## 免費額度（與登入方式無關）

新帳戶一律（`constants/credits.ts` + `ensureProfile`）：

- **Fit Snapshot：終身 3 次**（不依日／月重置）  
- **Interview Guide：0 次**（需購買或訂閱）

Google／Email 新建的帳號規則相同。

## 之後可加（需你開後台）

- **Apple**：Apple Developer + Supabase Apple provider  
- **LinkedIn**：LinkedIn Developer App + Supabase LinkedIn（OIDC）  
- **密碼登入**：Supabase Email+Password（支援成本較高，Magic Link 通常較夠）
