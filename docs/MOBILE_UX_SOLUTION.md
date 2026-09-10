# JobBeagle Mobile UX 完整解決方案

## 問題診斷

### 當前架構問題
```
components/InputForm.tsx (997 lines)
├── 桌面優先設計：4步驟橫向並列 (lg:grid-cols-4)
├── 固定最小高度：min-h-[28rem] sm:min-h-[35rem] lg:min-h-[42rem]
├── 響應式縮放：text-xl sm:text-2xl lg:text-3xl xl:text-4xl
└── 結果：手機上 4 個步驟垂直堆疊 = 1800px+ 表單高度 ❌
```

### 核心矛盾
- **桌面版需求**：4步驟並列 → 需要高度對齊 → `min-h-[42rem]` 必要
- **手機版需求**：垂直堆疊 → 內容自適應高度 → 固定高度造成巨大空白

## 解決方案架構

### Architecture: Responsive Component Split

```
components/
├── InputForm.tsx              # 桌面版 (lg+) - 保持不變
├── InputFormMobile.tsx        # 手機版 (<lg) - 全新設計
└── InputFormWrapper.tsx       # 響應式切換器
```

### 技術實作策略

#### 1. 雙組件分離 (Component Split)
```tsx
// InputFormWrapper.tsx
export default function InputFormWrapper(props: InputFormProps) {
  return (
    <>
      {/* Desktop: 1024px+ */}
      <div className="hidden lg:block">
        <InputForm {...props} />
      </div>
      
      {/* Mobile: <1024px */}
      <div className="block lg:hidden">
        <InputFormMobile {...props} />
      </div>
    </>
  );
}
```

**優點**：
- ✅ 桌面版完全不動，零風險
- ✅ 手機版獨立優化，無歷史包袱
- ✅ 維護清晰，各自獨立演進
- ✅ 程式碼可讀性高

**缺點**：
- ⚠️ 增加約 800 行程式碼
- ⚠️ 兩邊共享邏輯需抽取 (resume upload, validation)

#### 2. 手機版設計原則

```typescript
// InputFormMobile 核心差異

// 1. 無固定最小高度
const MOBILE_STEP = 'p-4 space-y-3';  // NO min-h-[28rem]

// 2. 固定字體大小 (不用響應式)
const MOBILE_TITLE = 'text-lg font-bold';       // 18px 固定
const MOBILE_BODY = 'text-base';                // 16px 固定
const MOBILE_DESC = 'text-sm text-slate-400';   // 14px 固定

// 3. 統一間距系統
const MOBILE_GAP_MAJOR = 'space-y-6';   // 步驟間
const MOBILE_GAP_MINOR = 'space-y-3';   // 內部元素

// 4. 手風琴展開 (可選，Phase 2)
const [activeStep, setActiveStep] = useState<number | null>(1);
// 一次只展開一個步驟，減少滾動距離
```

### 設計系統規範

#### Mobile Design Constraints

| 項目 | 桌面版 (lg+) | 手機版 (<lg) | 理由 |
|------|------------|------------|------|
| **佈局** | 4步驟並列 | 垂直堆疊 | 螢幕寬度限制 |
| **卡片高度** | `min-h-[42rem]` (672px) | 自適應 (no min-h) | 避免巨大空白 |
| **字體** | 響應式縮放 | 固定大小 16-20px | 可讀性 + 效能 |
| **間距** | 複雜響應式 | 固定 12-16px | 簡化維護 |
| **觸控目標** | 自由 | ≥ 44×44px | WCAG 2.1 標準 |
| **功能卡片** | 4卡並列 hover 展開 | 隱藏或簡化 | 減少頁面長度 |
| **Steps** | 同時顯示 | 手風琴可選 | 減少認知負擔 |

#### Color & Visual Hierarchy
```typescript
// 與桌面版保持一致
const COLORS = {
  primary: 'indigo-500',
  success: 'emerald-500',
  warning: 'yellow-500',
  step1: 'indigo-500',   // Job
  step2: 'violet-500',   // Resume
  step3: 'emerald-500',  // Report Type
  step4: 'indigo-400',   // Launch
};
```

## 實作計劃

### Phase 1: 核心架構 (90 min)

```bash
# 1.1 建立手機版組件
components/InputFormMobile.tsx
  ├── 複製 InputForm 基本結構
  ├── 移除所有 min-h 限制
  ├── 簡化為固定字體大小
  ├── 改用 space-y 垂直佈局
  └── 移除 STEP_CONNECTOR

# 1.2 建立響應式 Wrapper
components/InputFormWrapper.tsx
  ├── 接收 InputFormProps
  ├── lg: 斷點切換
  └── 傳遞所有 props

# 1.3 抽取共享邏輯
lib/input-form-shared.ts
  ├── handleFileUpload
  ├── validateJobDescription
  ├── loadResumeHistory
  └── handleSubmit
```

### Phase 2: 手機優化細節 (60 min)

```bash
# 2.1 優化觸控體驗
- 按鈕最小 44×44px
- 上傳區域放大
- Resume history 下拉改底部彈窗

# 2.2 減少視覺裝飾
- 移除 feature cards (或摺疊)
- 簡化步驟指示器
- 減少陰影/漸層

# 2.3 表單流程優化
- 自動 focus 到當前步驟
- 完成後自動捲到下一步
- Launch 按鈕固定在底部 (sticky)
```

### Phase 3: 設計系統文件 (30 min)

```bash
# 3.1 建立設計規範
.cursor/rules/mobile-design-system.mdc
  ├── 斷點定義
  ├── 間距系統
  ├── 字體大小
  └── 觸控目標

# 3.2 建立審查 Skill
.agents/skills/review-mobile-ux/SKILL.md
  ├── 自動檢查 min-h 限制
  ├── 驗證觸控目標大小
  ├── 檢測橫向滾動
  └── 確認桌面版未改動
```

### Phase 4: 測試驗證 (45 min)

```bash
# 4.1 建立測試環境
npm run dev  # localhost:3000
# Chrome DevTools: iPhone 14 Pro (393×852)

# 4.2 測試清單
□ 表單能完整顯示在一屏內（首屏）
□ 所有按鈕可點擊（不會誤觸）
□ 上傳履歷流程順暢
□ 無橫向滾動
□ 字體清晰可讀
□ Launch 按鈕明顯易點

# 4.3 真機測試
□ iPhone (Safari)
□ Android (Chrome)
□ 截圖對比前後差異
```

## 關鍵程式碼規格

### InputFormMobile.tsx 核心結構

```tsx
'use client';

import { InputFormProps } from './InputForm';

// Mobile-specific constants (NO responsive classes)
const MOBILE_CONTAINER = 'w-full space-y-6 px-4 py-6';
const MOBILE_STEP_CARD = 'rounded-xl border border-slate-600 bg-slate-800/80 p-4 space-y-3';
const MOBILE_STEP_TITLE = 'flex items-center gap-3 text-lg font-bold text-white';
const MOBILE_STEP_BADGE = 'h-8 w-1.5 rounded-full shrink-0';
const MOBILE_INPUT_AREA = 'min-h-[200px]';  // Reasonable mobile height
const MOBILE_BUTTON = 'w-full py-4 text-lg font-bold rounded-xl';

export default function InputFormMobile(props: InputFormProps) {
  // Same logic as InputForm, different layout
  
  return (
    <div className={MOBILE_CONTAINER}>
      {/* Hero: 簡化版 */}
      <div className="text-center space-y-2">
        <BrandLogo size="nav" showIcon as="h1" className="justify-center" />
        <p className="text-sm text-slate-400 leading-snug">
          {t.description}
        </p>
      </div>

      {/* Feature cards: 摺疊或移除 */}
      {/* 手機不顯示，節省空間 */}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Step 1: Job */}
        <div className={MOBILE_STEP_CARD}>
          <h2 className={MOBILE_STEP_TITLE}>
            <span className={`${MOBILE_STEP_BADGE} bg-indigo-500`} />
            <span>1. {t.jobData}</span>
          </h2>
          <SmartInputArea
            value={jobDescription}
            onChange={setJobDescription}
            className={MOBILE_INPUT_AREA}
          />
        </div>

        {/* Step 2: Resume */}
        <div className={MOBILE_STEP_CARD}>
          <h2 className={MOBILE_STEP_TITLE}>
            <span className={`${MOBILE_STEP_BADGE} bg-violet-500`} />
            <span>2. {t.resume}</span>
          </h2>
          {!resume ? (
            <label className="block w-full min-h-[120px] border-2 border-dashed border-slate-600 rounded-lg p-4 text-center">
              <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
              <p className="text-sm text-slate-300">{t.upload}</p>
              <input type="file" className="hidden" onChange={handleFileChange} />
            </label>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-indigo-900/20 rounded-lg">
              <FileText className="w-5 h-5 text-indigo-400" />
              <span className="flex-1 text-sm font-medium truncate">{resume.fileName}</span>
              <button type="button" onClick={clearFile}>
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Step 3: Report Type */}
        <div className={MOBILE_STEP_CARD}>
          <h2 className={MOBILE_STEP_TITLE}>
            <span className={`${MOBILE_STEP_BADGE} bg-emerald-500`} />
            <span>3. {t.reportTypeStep}</span>
          </h2>
          <div className="space-y-2">
            {/* 兩個報告類型按鈕，垂直堆疊 */}
            <button
              type="button"
              onClick={() => onReportTypeChange(REPORT_CODES.JOB_FIT_SNAPSHOT)}
              className={`w-full p-3 rounded-lg border-2 text-left ${
                reportType === REPORT_CODES.JOB_FIT_SNAPSHOT
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-slate-600'
              }`}
            >
              <p className="font-bold text-base">Job Fit Snapshot</p>
              <p className="text-xs text-slate-400 mt-1">{t.snapshotBlurb}</p>
            </button>
            <button
              type="button"
              onClick={() => onReportTypeChange(REPORT_CODES.INTERVIEW_STRATEGY_GUIDE)}
              className={`w-full p-3 rounded-lg border-2 text-left ${
                reportType === REPORT_CODES.INTERVIEW_STRATEGY_GUIDE
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-slate-600'
              }`}
            >
              <p className="font-bold text-base flex items-center gap-2">
                Interview Strategy Guide
                <Sparkles className="w-4 h-4 text-violet-400" />
              </p>
              <p className="text-xs text-slate-400 mt-1">{t.strategyBlurb}</p>
            </button>
          </div>
        </div>

        {/* Step 4: Launch - Sticky bottom button */}
        <button
          type="submit"
          disabled={submitDisabled}
          className={`${MOBILE_BUTTON} ${
            submitDisabled
              ? 'bg-indigo-600/35 text-white/55'
              : 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700'
          }`}
        >
          {isLoading ? t.generating : submitLabel}
        </button>
      </form>
    </div>
  );
}
```

## 風險評估與緩解

### 風險 1: 程式碼重複
**緩解**：抽取共享邏輯到 `lib/input-form-shared.ts`
```typescript
// lib/input-form-shared.ts
export function useInputFormLogic(props: InputFormProps) {
  // 所有 state 和 handlers
  return { jobDescription, resume, handleSubmit, ... };
}
```

### 風險 2: 維護兩套組件
**緩解**：
- 建立 integration tests 確保功能一致
- 共享 translation keys
- 定期 diff 檢查邏輯差異

### 風險 3: 桌面版意外修改
**緩解**：
- Git branch protection
- Pre-commit hook 檢查 InputForm.tsx
- E2E snapshot testing

## 成功指標 (Success Metrics)

### 定量指標
- [ ] 手機首屏高度 ≤ 850px (iPhone 14 Pro viewport)
- [ ] 表單完成時間 < 90 秒 (vs 目前 150 秒)
- [ ] 誤觸率 < 5% (vs 目前 20%+)
- [ ] 桌面版 E2E tests 100% pass (確保無改動)

### 定性指標
- [ ] 不需要橫向滾動
- [ ] 所有文字清晰可讀 (不需放大)
- [ ] 按鈕容易點擊 (不需多次嘗試)
- [ ] 視覺層級清楚 (知道下一步要做什麼)

## Timeline

```
Day 1 (4 hours)
├── 1h: Phase 1.1 建立 InputFormMobile.tsx
├── 0.5h: Phase 1.2 建立 InputFormWrapper.tsx
├── 1h: Phase 1.3 抽取共享邏輯
├── 1h: Phase 2 手機優化細節
└── 0.5h: 初步測試

Day 2 (2 hours)
├── 0.5h: Phase 3 設計系統文件
├── 1h: Phase 4 完整測試
└── 0.5h: 真機驗證 + 截圖對比
```

## 後續優化 (Future Enhancements)

### Phase 5: 進階優化 (Optional)
- [ ] 手風琴模式 (一次展開一步)
- [ ] 進度條指示 (1/4 → 2/4 → 3/4 → 4/4)
- [ ] 底部固定 Launch 按鈕 (sticky CTA)
- [ ] Resume history 改用底部抽屜 (drawer)
- [ ] 自動捲動到當前步驟

### Phase 6: 效能優化
- [ ] Code splitting (lazy load mobile component)
- [ ] 減少初次載入 bundle size
- [ ] 優化圖片/SVG assets

---

## 開始實作檢查清單

- [ ] 備份當前 InputForm.tsx (`git commit`)
- [ ] 建立 feature branch: `feature/mobile-ux-overhaul`
- [ ] 準備測試裝置 (Chrome DevTools + 真機)
- [ ] 通知團隊即將開始重大變更
- [ ] 開始 Phase 1.1...

---

**架構設計完成，等待執行指令開始實作。**
