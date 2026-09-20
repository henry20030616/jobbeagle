# Layer 1: GuideStrategyPayload Schema Review

**檔案位置**: `/Users/henry20030616/jobbeagle/types.ts` (Lines 682-843)  
**Commit**: `c2739a5`  
**日期**: 2026-09-21

---

## 完整 TypeScript 程式碼

```typescript
// ─────────────────────────────────────────────────────────────────────────────
// Trinity Architecture: Guide Strategy Payload (Page 2-5 Refactor)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GuideStrategyPayload — The Constitution (Layer 1)
 * 
 * Strict schema for Interview Strategy Guide Pages 2-5.
 * Enforces array lengths, enum boundaries, and prevents LLM hallucinations.
 * 
 * @see Layer 2: /lib/prompts/full.ts (System prompts with search operators)
 * @see Layer 3: UI components (Bento Grid + Dark Slate theme)
 */
export interface GuideStrategyPayload {
  // ─── PAGE 2: Micro (Team & Role) ───
  page2_team_and_role: {
    role_overview: {
      /** STRICT: 3-4 items. High-density bullet points. NO JD copy-pasting. */
      responsibilities_high_density: string[];
      /** STRICT: 3-4 items. Hard requirements / must-haves. */
      hard_requirements: string[];
      /** e.g., "Hybrid 3 days/week", "Fully Remote", "Onsite 5 days" */
      rto_policy: string;
      wlb_assessment: {
        /** e.g., "Healthy" / "Demanding but manageable" / "High burnout risk" */
        work_life_balance_rating: string;
        /** Short summary of team vibe / culture signals */
        team_vibe_summary: string;
        /** Source of WLB assessment */
        source_type: 'jd_official' | 'web_grounded';
      };
    };
    career_path_and_growth: {
      /** 1-2 next step role titles (e.g., "Senior BA → Lead BA → Product Owner") */
      next_step_roles: string[];
      /** Growth trajectory description. NO numeric salary ranges. Only drivers (e.g., "Strong upward mobility in fintech ops") */
      salary_growth_trajectory: string;
    };
    role_reviews: {
      /** 2-3 pros */
      pros: string[];
      /** 2-3 cons */
      cons: string[];
    };
  };

  // ─── PAGE 3: Macro (Company Truth & Risks) ───
  page3_company_truth: {
    /** Flag to trigger fallback UI when public data is insufficient */
    data_status: 'sufficient' | 'insufficient_public_data';
    company_macro: {
      /** Industry positioning / competitive stance */
      industry_positioning: string;
      /** CEO's strategic focus / current priorities */
      ceo_strategic_focus: string;
      /** 2-3 top competitors (real company names) */
      top_competitors: string[];
    };
    risk_and_reputation_audit: {
      /** Layoff history summary. If none: "無顯著近期裁員紀錄" */
      layoff_history: string;
      /** Legal/news red flags. If none: ["無顯著公開違法紀錄"] */
      legal_or_news_red_flags: string[];
      /** Internal rumors from Glassdoor/Blind/Reddit */
      internal_rumors_summary: string;
    };
    /**
     * ONLY populated when data_status === 'insufficient_public_data'
     * Provides fallback verification questions for candidate to ask recruiter
     */
    fallback_verification?: {
      /** 2-3 questions candidate should ask interviewer */
      recruiter_questions: string[];
      /** Recommended search query for candidate to try */
      recommended_search_query: string;
    };
  };

  // ─── PAGE 4: Tactical (Interview & Negotiation) ───
  page4_interview_and_comp: {
    /**
     * STRICT: EXACTLY 4 items (2 behavioral + 2 technical)
     * UI will render 2x2 grid
     */
    interview_questions: [
      {
        category: 'behavioral' | 'technical_case';
        question: string;
        /** Interviewer's intent / what they're assessing */
        intent: string;
        suggested_answer: {
          /** STAR framework guidance (Situation, Task, Action, Result) */
          star_framework: string;
          /** Critical dos and don'ts */
          dos_and_donts: string;
        };
      },
      {
        category: 'behavioral' | 'technical_case';
        question: string;
        intent: string;
        suggested_answer: {
          star_framework: string;
          dos_and_donts: string;
        };
      },
      {
        category: 'behavioral' | 'technical_case';
        question: string;
        intent: string;
        suggested_answer: {
          star_framework: string;
          dos_and_donts: string;
        };
      },
      {
        category: 'behavioral' | 'technical_case';
        question: string;
        intent: string;
        suggested_answer: {
          star_framework: string;
          dos_and_donts: string;
        };
      }
    ];
    tc_negotiation_script: {
      tc_breakdown: {
        /** Base salary insights / market positioning */
        base_salary_insight: string;
        /** Equity/RSU insights / vesting schedules */
        equity_rsu_insight: string;
        /** Sign-on bonus insights / negotiation leverage */
        sign_on_bonus_insight: string;
      };
      negotiation_playbook: {
        /** Anchoring strategy — setting the floor */
        prepare: string;
        /** Pitch script — actual dialogue candidate can use verbatim */
        pitch: string;
        /** Counter strategy — handling rejection / lowball offers */
        counter_strategy: string;
      };
    };
  };

  // ─── PAGE 5: Audit (References) ───
  /**
   * Reference sources with evidence tier classification
   * UI renders as high-density data table with color-coded tiers
   */
  page5_references: Array<{
    source_type: 'Glassdoor' | 'Blind' | 'Reddit' | 'Levels.fyi' | 'Layoff.fyi' | 'News/SEC';
    /** Short description of what this source provides */
    description: string;
    /** ISO date string when data was retrieved */
    date_retrieved: string;
    /** Full URL (may be empty string if no direct link) */
    url: string;
    /** Evidence quality tier for UI color coding */
    evidence_tier: 'Tier 1 (Official)' | 'Tier 2 (Multi-source)' | 'Tier 3 (Forum Wind)';
  }>;
}
```

---

## 🔍 核對清單

### ✅ 陣列長度約束

| 欄位 | 約束規則 | 註解位置 | 狀態 |
|------|---------|---------|------|
| `responsibilities_high_density` | 3-4 items | Line 700 | ✅ "STRICT: 3-4 items" |
| `hard_requirements` | 3-4 items | Line 702 | ✅ "STRICT: 3-4 items" |
| `next_step_roles` | 1-2 items | Line 716 | ✅ "1-2 next step role titles" |
| `pros` | 2-3 items | Line 722 | ✅ "2-3 pros" |
| `cons` | 2-3 items | Line 724 | ✅ "2-3 cons" |
| `top_competitors` | 2-3 items | Line 738 | ✅ "2-3 top competitors" |
| `recruiter_questions` | 2-3 items | Line 754 | ✅ "2-3 questions" |
| **`interview_questions`** | **EXACTLY 4** | Line 763-805 | ✅ **TypeScript Tuple [Q1, Q2, Q3, Q4]** |

---

### ✅ 列舉邊界 (Enum Constraints)

| 欄位 | 允許值 | 狀態 |
|------|--------|------|
| `source_type` (WLB) | `'jd_official'` \| `'web_grounded'` | ✅ |
| `data_status` | `'sufficient'` \| `'insufficient_public_data'` | ✅ |
| `category` (Interview Q) | `'behavioral'` \| `'technical_case'` | ✅ |
| `source_type` (Reference) | `'Glassdoor'` \| `'Blind'` \| `'Reddit'` \| `'Levels.fyi'` \| `'Layoff.fyi'` \| `'News/SEC'` | ✅ |
| `evidence_tier` | `'Tier 1 (Official)'` \| `'Tier 2 (Multi-source)'` \| `'Tier 3 (Forum Wind)'` | ✅ |

---

### ✅ 關鍵約束強制執行

| 約束 | 實現方式 | 狀態 |
|------|---------|------|
| **禁止 JD 複製貼上** | Line 700: "NO JD copy-pasting" | ✅ |
| **禁止薪資數字** | Line 718: "NO numeric salary ranges. Only drivers" | ✅ |
| **強制陣列格式** | `interview_questions: [Q1, Q2, Q3, Q4]` — TypeScript **tuple type** | ✅ |
| **降級機制** | `fallback_verification?: { ... }` — optional, only when `data_status === 'insufficient_public_data'` | ✅ |

---

### ✅ 特殊設計重點

#### 1. **interview_questions 使用 Tuple Type (非 Array)**

```typescript
interview_questions: [Q1, Q2, Q3, Q4]  // EXACTLY 4 items, compile-time enforced
```

**為什麼？**  
- ❌ `Array<InterviewQuestion>` — 允許任意長度 (0, 1, 2, ...∞)
- ✅ `[Q1, Q2, Q3, Q4]` — TypeScript **tuple type**，強制 EXACTLY 4 items
- 編譯器會拒絕 `interview_questions.length !== 4` 的資料

#### 2. **fallback_verification 的條件性載入**

```typescript
fallback_verification?: {  // Optional field
  recruiter_questions: string[];
  recommended_search_query: string;
};
```

**觸發條件**:  
- `data_status === 'insufficient_public_data'` → UI 隱藏主內容，顯示 fallback
- `data_status === 'sufficient'` → `fallback_verification` 必須為 `undefined`

---

## 🎯 Layer 1 核對結論

| 檢查項目 | 狀態 | 備註 |
|---------|------|------|
| 陣列長度註解標示清楚 | ✅ | 所有必要欄位都有 "STRICT: X-Y items" 或 "X items" |
| TypeScript 類型安全 | ✅ | Tuple type 強制 `interview_questions` 長度 |
| 列舉值封閉性 | ✅ | 所有 enum 使用 union type，不可擴充 |
| 禁止薪資數字 | ✅ | `salary_growth_trajectory` 只允許 "drivers" 描述 |
| 降級機制設計 | ✅ | `data_status` + optional `fallback_verification` |
| 向後相容性 | ✅ | 不修改現有 `LiteReport` / `FullReport` |

---

**請確認以上 Schema 是否符合預期，確認後我將開始 Layer 2 (System Prompts)。**
