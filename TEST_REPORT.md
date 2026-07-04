# Jobbeagle 測試報告

**執行時間：** 2026-07-04  
**程式基準：** `main`（Package A / `b58accb` 狀態 + P1/P2 測試基礎建設）  
**執行者：** 本機 CI 模擬（Agent 自動化）

---

## 摘要

| 套件 | 結果 | 通過 | 失敗 | 耗時 |
|------|------|------|------|------|
| **單元測試** (`npm run test:unit`) | ✅ PASS | 77 | 0 | ~0.5s |
| **API 測試** (`npm run test:api`) | ✅ PASS | 30 | 0 | ~0.4s |
| **建置** (`npm run build`) | ✅ PASS | — | — | ~12s |
| **E2E Smoke** (`npm run test:e2e:smoke`) | ✅ PASS | 6 | 0 | ~2.7s |
| **合計** | ✅ **113 / 113** | 113 | 0 | — |

---

## P1 — 單元與 API 測試

### 單元測試（77）

| 檔案 | 測試數 | 涵蓋 |
|------|--------|------|
| `__tests__/unit/api-errors.test.ts` | 34 | 13 種 `ApiErrorCode` 多語系、`translateApiError` fallback |
| `__tests__/unit/shorts-view-role.test.ts` | 10 | localStorage 角色、`resolveUserRole`、`resolveShortsViewMode` |
| `__tests__/lib/video-embed.test.ts` | 33 | YouTube/IG/FB URL 偵測、embed 轉換（既有 + 修正 zh-TW label） |

### API 測試（30）

| 檔案 | 測試數 | 涵蓋 |
|------|--------|------|
| `__tests__/api/shorts-publish.test.ts` | 9 | 401/400 各 errorCode、200 成功（mock Supabase） |
| `__tests__/api/shorts-apply.test.ts` | 5 | MISSING_FIELDS、INVALID_EMAIL、409、429、200 |
| `__tests__/api/shorts-proxy.test.ts` | 3 | 缺 url、非法網域、非 storage 路徑 |
| `__tests__/api/rate-limit.test.ts` | 13 | IP hash、每日額度邏輯（既有） |

---

## P2 — E2E Smoke（6）

| # | 用例 | 結果 |
|---|------|------|
| 1 | 首頁標題與表單元素 | ✅ |
| 2 | `/shorts` Feed + 底部導覽 + 播放器 | ✅ |
| 3 | `/privacy` 標題渲染 | ✅ |
| 4 | `/terms` 標題渲染 | ✅ |
| 5 | `/employer/login` 登入 UI | ✅ |
| 6 | `/shorts/upload` 登入或精靈 | ✅ |

---

## 新增檔案清單

```
__tests__/helpers/mock-supabase.ts
__tests__/unit/api-errors.test.ts
__tests__/unit/shorts-view-role.test.ts
__tests__/api/shorts-publish.test.ts
__tests__/api/shorts-apply.test.ts
__tests__/api/shorts-proxy.test.ts
e2e/smoke.spec.ts
playwright.config.ts
.github/workflows/ci.yml
TEST_REPORT.md
```

**修改：** `package.json`、`vitest.config.ts`、`.gitignore`、`__tests__/lib/video-embed.test.ts`

---

## 本機執行指令

```bash
npm run test:unit      # 單元
npm run test:api       # API mock
npm run build          # 建置
npm run test:e2e:smoke # E2E（會自動 build + start）
npm run test:all       # unit + api + build
```

首次 E2E 需安裝瀏覽器：
```bash
npx playwright install chromium
```

---

## CI（GitHub Actions）

推送 `main` 或 PR 時自動執行：

1. `lint`
2. `test:unit` + `test:api`
3. `build`
4. Playwright smoke（需先 build）

**建議在 GitHub repo Secrets 設定（可選，否則用 placeholder）：**
- `GEMINI_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 未涵蓋（需手動或 P3）

- 真實 Google OAuth 登入流程
- 真實 Gemini `/api/analyze` 回應
- Resend 寄信端到端
- 應徵 / 發布寫入真實 Supabase
- 手機 Safari 實機滑動

---

## 結論

**P1 + P2 已完成並全數通過。** 專案具備可重複執行的單元、API mock、Smoke E2E 與 GitHub CI 管線，可作為每次 push 的回歸防護。
