# JobBeagle 完美报告生成方法论
**Version 1.1 | 2026-09-23**

---

## 目录
1. [核心理念](#核心理念)
2. [Trinity 三位一体架构](#trinity-三位一体架构)
3. [报告字段设计原则](#报告字段设计原则)
4. [Persona 与 RAG 工程](#persona-与-rag-工程)
5. [性能优化：并发 RAG 架构](#性能优化并发-rag-架构) ⭐ **新增**
6. [产品闭环：ATS 承诺兑现](#产品闭环ats-承诺兑现) ⭐ **新增**
7. [Layer 4：运行时安全防护](#layer-4运行时安全防护) ⭐ **新增**
8. [对抗式质量验证](#对抗式质量验证)
9. [UI/UX 设计原则](#uiux-设计原则)
10. [完整工作流](#完整工作流)
11. [质量保证清单](#质量保证清单)

---

## 核心理念

### 产品愿景
JobBeagle 不是简历美化工具，而是 **专家级职业决策支持系统**。目标用户是需要做出高风险职业决策的求职者（跳槽、谈薪、职涯转型）。

### 设计哲学（对标 Andrej Karpathy）
1. **Schema First**：类型安全 > 灵活性
2. **Zero Hallucination**：诚实承认不足 > 编造内容
3. **Provenance Required**：每个声明都有出处
4. **Expert Persona**：FAANG 资深 HR/猎头视角，不说客套话
5. **Actionable Output**：求职者可以直接照做（谈薪剧本、STAR 答案）

### 质量红线（不可妥协）
- ❌ **绝不编造**：公司新闻、薪资数字、裁员记录、面试题
- ❌ **绝不发明**：求职者未持有的职称、经验、技能
- ❌ **绝不客套**：模糊建议、官腔、粉饰太平
- ✅ **诚实标记**：数据不足时明确说明，提供反问题库

---

## Trinity 三位一体架构

### 原则：Schema → Prompt → UI 严格对齐

```
Layer 1: Data Schema (类型契约)
   ↓
Layer 2: System Prompt (生成逻辑)
   ↓
Layer 3: UI Components (视觉呈现)
```

### Layer 1: Data Schema（数据契约）

**目标**：用 TypeScript 类型系统强制 LLM 输出边界

#### 核心技术
1. **Tuple Types**：强制数组长度
```typescript
interview_questions: [Q1, Q2, Q3, Q4];  // 严格 4 题，非 string[]
```

2. **Enum Boundaries**：限定可选值
```typescript
data_status: 'sufficient' | 'insufficient_public_data';
layoff_history: 'verified' | 'none';
```

3. **Nested Validation**：嵌套结构验证
```typescript
role_overview: {
  responsibilities_high_density: string[];  // 3-4 items
  hard_requirements: string[];              // 3-4 items
  wlb_assessment: {
    work_life_balance_rating: string;
    team_vibe_summary: string;
    source_type: 'jd_official' | 'web_grounded';
  };
}
```

4. **Conditional Logic**：条件字段
```typescript
// 当 data_status = 'insufficient_public_data' 时
fallback_verification: {
  recruiter_questions: string[];  // 2-3 个反问题
}
```

#### Schema 设计清单
- [ ] 所有数组字段标注长度约束（注释 `STRICT: 3-4 items`）
- [ ] 关键字段使用 Enum（非 `string`）
- [ ] 嵌套对象有明确结构
- [ ] Fallback 机制完整（缺数据时的降级方案）
- [ ] 与现有 `LiteReport`/`FullReport` 兼容（向后兼容）

---

### Layer 2: System Prompt（生成逻辑）

**目标**：让 LLM 严格遵守 Schema 并体现 Expert Persona

#### 2.1 Persona 工程

```plaintext
╔═══════════════════════════════════════════════════════════════╗
║ PERSONA: Senior FAANG Recruiter & Executive Headhunter        ║
╚═══════════════════════════════════════════════════════════════╝

You are a top-tier Director of Talent Acquisition from FAANG 
(Meta/Google/Amazon tier) with 15+ years of experience, now 
working as a high-stakes executive headhunter.

YOUR MISSION: You do NOT sugarcoat. You do NOT speak in 
corporate platitudes. You specialize in:
- Exposing toxic culture red flags that HR tries to hide
- Revealing internal layoff risks and reorg turbulence
- Providing verbatim negotiation scripts that candidates can 
  use word-for-word with hiring managers
- Calling out ATS rejection traps and resume death sentences

Your output is direct, evidence-based, and tactical. If you 
don't have data, you SAY SO and provide validation questions 
— never fabricate.
```

**Persona 检查点**：
- [ ] 语气直接、不模糊
- [ ] 揭露真相（vs 粉饰）
- [ ] 实战可用（vs 理论空谈）
- [ ] 诚实承认不足（vs 编造）

#### 2.2 RAG 强制检索规则

**目标**：确保引用真实第三方数据源

```plaintext
╔═══════════════════════════════════════════════════════════════╗
║ MANDATORY SEARCH GROUNDING RULES (STRICT ENFORCEMENT)         ║
╚═══════════════════════════════════════════════════════════════╝

When invoking Google Search Tool, you MUST use these 
site-specific operators:

1. Salary / Total Compensation (TC) Research:
   - FORCE: `site:levels.fyi` OR `site:glassdoor.com/Salary`
   - Example: "Software Engineer L5 Meta site:levels.fyi"

2. Team Culture / Work-Life Balance / Internal Reviews:
   - FORCE: `site:teamblind.com` OR 
            `site:reddit.com/r/cscareerquestions`
   - Example: "Amazon AWS culture toxic site:teamblind.com"

3. Layoff History / Company Risk:
   - FORCE: `site:layoffs.fyi`
   - Example: "Meta 2023 layoffs site:layoffs.fyi"

4. General News / Company Developments:
   - FORCE: `site:sec.gov` OR `site:reuters.com` OR 
            `site:techcrunch.com`

DO NOT use generic searches without site operators when 
salary/culture/layoffs are the target.
```

**RAG 检查点**：
- [ ] 每个薪资声明引用 levels.fyi 或 Glassdoor
- [ ] 每个文化评价引用 Blind 或 Reddit
- [ ] 每个裁员记录引用 layoffs.fyi
- [ ] 新闻来自可信来源（Reuters、TechCrunch、SEC）

#### 2.3 Generation Boundaries（反幻觉边界）

**目标**：在特定页面强制执行特定规则

```plaintext
╔═══════════════════════════════════════════════════════════════╗
║ GENERATION BOUNDARIES (ANTI-HALLUCINATION)                    ║
╚═══════════════════════════════════════════════════════════════╝

[Page 2 — Team & Role (Micro)]
- `salary_growth_trajectory`: MUST NOT contain numeric salary 
  ranges (e.g., "$150K-$200K"). Only drivers/trends 
  (e.g., "Strong upward mobility in fintech ops").

[Page 3 — Company Truth & Risks (Macro)]
- If you search and find ZERO or THIN public data on this 
  company (e.g., stealth startup, no news, no Glassdoor 
  reviews), you MUST set:
  `data_status: "insufficient_public_data"`
- When `data_status` is insufficient, populate 
  `fallback_verification.recruiter_questions` with 2-3 smart 
  questions the candidate can ask the interviewer.
- ABSOLUTELY FORBIDDEN: Inventing news, layoffs, or 
  competitor names when you have no search results.

[Page 4 — Interview & Comp (Tactical)]
- `interview_questions`: MUST be exactly 4 questions 
  (2 behavioral + 2 technical). Enforce via Tuple type.
- `tc_negotiation_script.pitch`: MUST be verbatim dialogue 
  script the candidate can use word-for-word with HR 
  (not generic advice).
- STAR Framework: MUST anchor to resume facts 
  (no invented experience).

[Page 5 — References (Audit)]
- Every URL MUST be validated at generation time.
- `evidence_tier`: Tier 1 (primary source), Tier 2 
  (secondary), Tier 3 (inferred).
- NEVER fabricate URLs. If no URL exists, leave empty and 
  set `manual_verify_keywords`.
```

**Generation Boundaries 检查点**：
- [ ] Page 2: 无数字薪资范围
- [ ] Page 3: 缺数据时触发 Fallback UI
- [ ] Page 4: 严格 4 题 (2+2)
- [ ] Page 4: 谈薪剧本可以直接照念
- [ ] Page 5: URL 全部可访问

---

### Layer 3: UI Components（视觉呈现）

**目标**：专业工具感，高信息密度，Dark Slate + Bento Grid

#### 3.1 全局视觉原则
- **配色**：Dark Slate 950 背景 + 高对比度文字
- **布局**：Bento Grid（便当盒网格）非传统卡片
- **字体**：Tabular Nums（数字等宽）+ 层级清晰
- **间距**：呼吸感充足，非拥挤

#### 3.2 Page-by-Page 组件设计

**Page 1: Job Fit Snapshot**
```
┌─────────────────────────────────────────────────────────┐
│ Candidate Fit Score (左侧圆形)                          │
│ Expected Offer Range (右侧方形 Squircle)                │
│ - Score Summary (fit 评估)                              │
│ - Range Evaluation (市场价值)                           │
│ - Beagle Scale (Popover，非默认显示)                    │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│ Curiosity Gap Paywall (Frosted Glass Overlay)          │
│ - 琥珀色警告头                                           │
│ - 好奇心缺口文案                                         │
│ - 功能列表                                               │
│ - 渐变升级按钮                                           │
└─────────────────────────────────────────────────────────┘
```

**Page 2: Team & Role (Micro)**
```
┌─────────────────────────────────────────────────────────┐
│ Top Banner: Career Path & Growth (Next Title)          │
└─────────────────────────────────────────────────────────┘
┌───────────────────────────┬─────────────────────────────┐
│ Left 60%: Role Overview   │ Right 40%: WLB Dashboard    │
│ - High-density bullets    │ - WLB Rating                │
│ - Hard Requirements       │ - Team Vibe                 │
│ - RTO Badge (右上角)      │ - Pros (绿色 🟢)            │
│                           │ - Cons (红色 🔴)            │
└───────────────────────────┴─────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│ Promotion Skill Gaps (Full-Width Bottom)               │
└─────────────────────────────────────────────────────────┘
```

**Page 3: Company Truth (Macro)**
```
┌─────────────────────────────────────────────────────────┐
│ Risk Radar: [Layoff] [Legal] [Reviews]                 │
│             绿色✅ / 红色❌ / 琥珀色⚠️ 徽章             │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│ Company Overview (3-5 sentences)                        │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│ Recent Developments (Up to 5 news items)                │
│ - Date + Source + Category Badge                        │
└─────────────────────────────────────────────────────────┘
┌───────────────────────────┬─────────────────────────────┐
│ Left 50%: CEO Strategy    │ Right 50%: Competitors      │
└───────────────────────────┴─────────────────────────────┘
┌───────────────────────────┬─────────────────────────────┐
│ Insider Voice             │ Layoff/Legal Flags          │
└───────────────────────────┴─────────────────────────────┘

[FALLBACK UI] 当 data_status === 'insufficient_public_data':
┌─────────────────────────────────────────────────────────┐
│ ⚠️ STEALTH STARTUP / DATA GAP WARNING                  │
│ - 隐藏所有主内容                                         │
│ - 显示醒目琥珀色警告面板                                 │
│ - Recruiter Questions 可复制卡片                        │
└─────────────────────────────────────────────────────────┘
```

**Page 4: Interview & Comp (Tactical)**
```
┌─────────────────────────────────────────────────────────┐
│ Top Dashboard: TC Breakdown (Base/RSU/Sign-on)          │
└─────────────────────────────────────────────────────────┘
┌───────────────────────────┬─────────────────────────────┐
│ Left 60%: Accordion       │ Right 40%: Sticky Script    │
│ - 2 Behavioral Questions  │ (保持在视窗顶部)            │
│ - 2 Technical Questions   │                             │
│ - Collapsible STAR        │ 1. Prepare                  │
│ - Resume Anchor           │ 2. Pitch (逐字稿)           │
│ - Dos & Don'ts            │ 3. Counter                  │
└───────────────────────────┴─────────────────────────────┘
```

**Page 5: References (Audit)**
```
┌─────────────────────────────────────────────────────────┐
│ Top Banner: Citation Stats + Invalid URL Warning        │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│ Data Table (High-Density)                               │
│ # | Category | Description | URL | Evidence Tier        │
│ 1 | web      | ...         | [🔗] | Tier 1 (蓝色)      │
│ 2 | interview| ...         | [🔗] | Tier 2 (靛色)      │
│ 3 | offer    | ...         | [🔗] | Tier 3 (灰色)      │
└─────────────────────────────────────────────────────────┘
```

#### 3.3 UI 设计检查点
- [ ] Dark Slate 950 背景 + 高对比度
- [ ] Bento Grid 布局（非传统卡片）
- [ ] 移动端响应式（独立 Mobile 组件）
- [ ] Sticky 定位正确（Page 4 谈薪剧本）
- [ ] Accordion 交互流畅（Page 4 面试题）
- [ ] Fallback UI 正确触发（Page 3 隐形新创）
- [ ] Evidence Tier 颜色正确（Page 5）

---

## 报告字段设计原则

### 分层哲学
```
Job Fit Snapshot (Page 1)    ← 闭卷（Flash-Lite，无 Search）
    ↓
Interview Strategy Guide      ← 开卷（Pro，Search Grounding）
├── Page 2: Team & Role (Micro)
├── Page 3: Company Truth (Macro)
├── Page 4: Interview & Comp (Tactical)
└── Page 5: References (Audit)
```

### 字段粒度控制

| 页面 | 粒度 | 禁止内容 | 必须内容 |
|------|------|----------|----------|
| Page 1 | 高层概览 | 具体薪资数字、公司内幕 | Fit Score, Offer Range (估算) |
| Page 2 | 微观角色 | 具体薪资数字 | 高密度职责、晋升路径、WLB |
| Page 3 | 宏观公司 | 编造新闻/裁员 | 公司概况、风险审计、竞争对手 |
| Page 4 | 战术执行 | 模糊建议 | 逐字谈薪剧本、可执行 STAR |
| Page 5 | 审计溯源 | 编造 URL | 所有引用来源、Evidence Tier |

### 关键字段定义

#### `responsibilities_high_density` (Page 2)
- **约束**：3-4 条，非 JD 原文复制粘贴
- **格式**：动词开头，量化成果
- **示例**：
  ```
  ✅ "Translate ops pain into prioritized backlog with measurable acceptance criteria"
  ❌ "Responsible for operations" (太模糊)
  ```

#### `wlb_assessment` (Page 2)
- **约束**：必须标注来源 (`jd_official` vs `web_grounded`)
- **格式**：
  ```typescript
  {
    work_life_balance_rating: "Healthy with seasonal surges",
    team_vibe_summary: "Collaborative fintech ops culture; Q4 spikes to 50hr weeks",
    source_type: "web_grounded"  // ← 关键：诚实标记数据来源
  }
  ```

#### `interview_questions` (Page 4)
- **约束**：严格 4 题 (Tuple `[Q1, Q2, Q3, Q4]`)
- **分类**：2 behavioral + 2 technical
- **结构**：
  ```typescript
  {
    question: "Describe a time you disagreed with engineering...",
    category: "behavioral",
    interviewer_intent: "Conflict resolution under settlement risk",
    star_blueprint: "S: ... T: ... A: ... R: ...",
    dos_donts: "DO: ... DON'T: ...",
    resume_anchor: "Cross-functional facilitation (18-month triage ritual)",
    source_url: "https://www.glassdoor.com/Interview/...",
    predicted: false  // true = 系统推测, false = 真实报告
  }
  ```

#### `tc_negotiation_script.pitch` (Page 4)
- **约束**：逐字对白，候选人可以直接照念
- **格式**：
  ```
  ✅ "Thanks — before I share a number, what is the approved 
      cash band for this level in this location? Based on 
      similar Senior BA fintech ops roles and my cycle-time / 
      KPI ownership, I am targeting the mid-band once we 
      confirm scope."
  
  ❌ "You should negotiate based on your experience" (太虚)
  ```

#### `data_status` (Page 3)
- **约束**：`'sufficient' | 'insufficient_public_data'`
- **触发条件**：Search 返回零或极少结果（隐形新创、保密公司）
- **后续动作**：触发 Fallback UI，显示 `recruiter_questions`

---

## Persona 与 RAG 工程

### Persona 分层设计

| 层级 | Persona | 适用场景 |
|------|---------|----------|
| **Level 1: 中立分析师** | "You are a professional career analyst" | Job Fit Snapshot（闭卷） |
| **Level 2: 资深 HR 顾问** | "You are a Senior HR Consultant with 10+ years..." | Interview Strategy Guide（基础） |
| **Level 3: FAANG 猎头（现用）** | "You are a top-tier FAANG Director of TA + Executive Headhunter" | Interview Strategy Guide（进阶） |
| **Level 4: 恶意挑战者（Red Team）** | "You are a malicious fact-checker who specializes in exposing HR report flaws" | 质量验证（对抗） |

### RAG 分层检索策略

```
第一轮：公司基础信息（Company Overview）
  ↓ site:sec.gov OR site:reuters.com OR site:techcrunch.com
  ↓
第二轮：内部文化与 WLB（Team Vibe）
  ↓ site:teamblind.com OR site:reddit.com/r/cscareerquestions
  ↓
第三轮：薪资与晋升（Compensation）
  ↓ site:levels.fyi OR site:glassdoor.com/Salary
  ↓
第四轮：裁员与风险（Layoff History）
  ↓ site:layoffs.fyi
  ↓
第五轮：面试题库（Interview Questions）
  ↓ site:glassdoor.com/Interview OR site:leetcode.com/discuss
```

### 检索失败处理

```typescript
if (searchResults.length === 0) {
  // ❌ 错误做法：编造内容
  // company_overview: "This is a fast-growing startup..." (幻觉)
  
  // ✅ 正确做法：诚实标记 + 反问题库
  data_status: "insufficient_public_data",
  fallback_verification: {
    recruiter_questions: [
      "Why is this role open now — backfill or new scope?",
      "What is the 12-month operating priority for this team?",
      "How has ops headcount changed in the last year?"
    ]
  }
}
```

---

## 性能优化：并发 RAG 架构

### 问题：线性检索导致超时风险

**原始设计盲点**：如果 RAG 检索采用线性串行模式，总耗时将是所有 API 调用的累加：

```typescript
// ❌ 危险：线性检索
const news = await searchCompanyNews(company);      // 2 秒
const culture = await searchCulture(company);       // 2 秒
const salary = await searchSalary(role);            // 2 秒
const layoffs = await searchLayoffs(company);       // 2 秒
const interviews = await searchInterviews(company); // 2 秒
// Total: 10 秒 + LLM 处理时间 ≈ 15-20 秒
```

在网络抖动或 API 延迟的情况下，很容易突破 30 秒的用户耐心阈值。

### 解决方案：Promise.all() 并发击发

**架构调整**：将所有独立的检索任务并发执行，总耗时取决于最慢的单次调用：

```typescript
// ✅ 正确：并发检索
async function gatherContextForGuide(resume, jd, company, role, location) {
  const ragResults = await Promise.all([
    // Batch 1: Company Intelligence
    searchWithOperator(
      `${company} news funding product`, 
      'site:reuters.com OR site:techcrunch.com OR site:sec.gov'
    ),
    searchWithOperator(
      `${company} culture work life balance`, 
      'site:teamblind.com OR site:reddit.com/r/cscareerquestions'
    ),
    searchWithOperator(
      `${company} layoffs restructuring`, 
      'site:layoffs.fyi'
    ),
    
    // Batch 2: Role Intelligence
    searchWithOperator(
      `${role} salary compensation ${location}`, 
      'site:levels.fyi OR site:glassdoor.com/Salary'
    ),
    searchWithOperator(
      `${company} interview questions`, 
      'site:glassdoor.com/Interview OR site:leetcode.com/discuss'
    ),
  ]);
  
  // 聚合结果
  return {
    companyNews: ragResults[0],
    cultureReviews: ragResults[1],
    layoffHistory: ragResults[2],
    salaryData: ragResults[3],
    interviewIntel: ragResults[4],
  };
}
```

**性能提升**：
- **串行**：10 秒（5 × 2 秒）
- **并发**：2 秒（max of all calls）
- **提升**：80% 时间节省

### 实现位置

```
lib/gemini-analyze.ts
  └─ gatherContextForGuide()
      └─ Promise.all([...searchWithOperator() calls])
```

### 错误处理

```typescript
// 并发调用时的容错机制
const ragResults = await Promise.allSettled([
  searchCompanyNews(company),
  searchCulture(company),
  // ...
]);

// 优雅处理失败的检索
const aggregated = ragResults.map((result, index) => {
  if (result.status === 'fulfilled') {
    return result.value;
  } else {
    console.warn(`RAG search ${index} failed:`, result.reason);
    return { results: [], source: 'failed' };  // 空结果，不阻塞流程
  }
});
```

---

## 产品闭环：ATS 承诺兑现

### 问题：Page 1 的钩子在 Page 2-5 未兑现

**用户旅程破裂**：

```
Step 1: 用户看到 Page 1 Paywall
  "⚠️ 系统已偵測到 2 項可能導致 ATS 秒刷的隱性要求"
      ↓
Step 2: 用户支付 $9.99 期待答案
      ↓
Step 3: 用户翻遍 Page 2-5，找不到承诺的 2 项缺口
      ↓
Result: 🤬 用户感觉被骗，信任崩塌
```

**根本原因**：Layer 1 Schema 和 Layer 3 UI 中缺少专门区块来兑现 Page 1 的承诺。

### 解决方案：ATS Critical Gaps 机制

#### Layer 1: Schema 强制字段

```typescript
// types.ts - 新增 ATS 解析结构
export interface ATSCriticalGap {
  gap_type: 'keyword_missing' | 'quantification_weak' | 'experience_unclear';
  jd_requirement: string;      // JD 的具体要求（原文引用）
  resume_weakness: string;     // 履历的缺失点
  fix_strategy: string;        // 面试中如何补救
  severity: 'critical' | 'major';  // 严重程度
}

export interface GuideStrategyPayload {
  page2_team_and_role: {
    // 新增：ATS 解析区块（强制生成）
    ats_critical_gaps: {
      detected_count: 2 | 3;  // 必须与 Page 1 承诺一致
      gaps: ATSCriticalGap[];
    };
    // ... 其余字段
  };
}
```

#### Layer 2: Prompt 强制生成

```typescript
// lib/prompts/full.ts
`
[Page 2 — ATS Critical Gaps (MANDATORY SECTION)]

**CRITICAL REQUIREMENT**: This section MUST fulfill the promise from 
Page 1's paywall ("⚠️ 2 items may cause ATS rejection").

Generate EXACTLY 2-3 ATS gaps by cross-referencing:
1. JD's hard requirements (exact keywords: "5+ years", "SQL", "ACH")
2. Resume's missing keywords or weak quantification
3. ATS parser blind spots (keyword matching, years calculation)

For each gap, provide:
{
  "gap_type": "keyword_missing",
  "jd_requirement": "Direct quote from JD: 'ACH returns ownership'",
  "resume_weakness": "Resume never uses 'ACH' keyword, only says 'banking ops'",
  "fix_strategy": "In interview, bridge: 'My reconciliation work was adjacent to ACH settlement. Here's how I'd ramp ACH returns using the same SQL muscle.'",
  "severity": "critical"  // critical = likely auto-reject, major = human review
}

Examples of gap_type:
- "keyword_missing": JD requires "Python" but resume says "scripting"
- "quantification_weak": JD wants "5+ years" but resume says "extensive experience"
- "experience_unclear": JD requires "team leadership" but resume only shows IC work

RULES:
- NEVER invent JD requirements (quote verbatim)
- NEVER fabricate resume content
- Focus on fixable gaps (not unchangeable facts like years of experience)
- Provide tactical interview talking points (not generic advice)
`
```

#### Layer 3: UI 醒目展示

```typescript
// components/guide/GuideStrategyPages.tsx (Page 2 顶部)
function Page2({ report, copy }: { report: FullReport; copy: GuideUiCopy }) {
  const atsGaps = report.role_team_insights?.ats_critical_gaps;
  
  return (
    <GuideSlideShell>
      <PageHeaderBar ... />
      
      {/* ATS Resolution Box - 兑现 Page 1 承诺 */}
      {atsGaps && (
        <div className="border-2 border-amber-500/60 rounded-xl bg-gradient-to-r from-amber-500/10 to-red-500/10 px-5 py-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/20">
              <AlertTriangle className="h-6 w-6 text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-black text-amber-300 mb-2">
                ⚠️ ATS Risk Analysis (From Your Paywall Promise)
              </h3>
              <p className="text-sm text-slate-300 mb-4">
                As promised on Page 1, here are the <strong>{atsGaps.detected_count} items</strong> 
                that may cause ATS rejection — and how to address them in your interview.
              </p>
              
              {atsGaps.gaps.map((gap, i) => (
                <div 
                  key={i} 
                  className="mb-3 last:mb-0 rounded-lg border border-amber-400/40 bg-black/30 px-4 py-3"
                >
                  {/* Gap Header */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/30 text-sm font-black text-amber-100">
                      {i + 1}
                    </span>
                    <span className="rounded border border-amber-400/50 bg-amber-500/20 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-amber-200">
                      {gap.gap_type.replace('_', ' ')}
                    </span>
                    <span className={`rounded px-2 py-0.5 text-xs font-bold uppercase ${
                      gap.severity === 'critical' 
                        ? 'bg-red-500/20 text-red-300 border border-red-400/50' 
                        : 'bg-amber-500/20 text-amber-300 border border-amber-400/50'
                    }`}>
                      {gap.severity}
                    </span>
                  </div>
                  
                  {/* Gap Details */}
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                        JD Requires
                      </p>
                      <p className="text-sm text-slate-200 leading-snug">
                        "{gap.jd_requirement}"
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                        Resume Weakness
                      </p>
                      <p className="text-sm text-red-200/90 leading-snug">
                        {gap.resume_weakness}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-0.5">
                        ✅ How to Fix in Interview
                      </p>
                      <p className="text-sm text-emerald-100 leading-snug font-medium">
                        {gap.fix_strategy}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* 其余 Page 2 内容 */}
      {/* ... */}
    </GuideSlideShell>
  );
}
```

### 验收标准

- [ ] Schema 包含 `ats_critical_gaps` 字段
- [ ] Prompt 强制生成 2-3 个缺口
- [ ] Page 2 UI 顶部醒目展示 ATS 解析
- [ ] 文案明确标注"From Your Paywall Promise"
- [ ] 每个缺口包含：JD 原文 + 履历弱点 + 补救策略
- [ ] 用户能清楚看到付费的价值兑现

---

## Layer 4：运行时安全防护

### 问题：TypeScript 只是编译期保护

**现状风险**：

```typescript
// Schema 定义（编译期有效）
interview_questions: [Q1, Q2, Q3, Q4];  // Tuple 类型

// 但如果 Gemini API 运行时只返回 3 题
const report = await gemini.generateContent(...);
report.interview_questions[3].question;  
// ❌ Runtime Error: Cannot read property 'question' of undefined
// → 前端白屏崩溃
```

TypeScript 类型系统在编译后消失，无法阻止 LLM 的运行时暴走。

### 双重防护机制

#### 防护 1：Gemini Response Schema（服务端硬约束）

Gemini 1.5 Pro 支持 `responseSchema` 参数，将 TypeScript Schema 转为 OpenAPI 格式后硬约束模型输出：

```typescript
// lib/gemini-analyze.ts
import { SchemaType } from '@google/generative-ai';

// 定义严格的 JSON Schema
const PAGE4_INTERVIEW_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    interview_questions: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          question: { type: SchemaType.STRING, description: "面试题原文" },
          category: { 
            type: SchemaType.STRING, 
            enum: ['behavioral', 'technical'] 
          },
          interviewer_intent: { type: SchemaType.STRING },
          star_blueprint: { type: SchemaType.STRING },
          dos_donts: { type: SchemaType.STRING },
          resume_anchor: { type: SchemaType.STRING },
          predicted: { type: SchemaType.BOOLEAN },
        },
        required: ['question', 'category', 'interviewer_intent', 'star_blueprint'],
      },
      minItems: 4,  // ← 强制至少 4 题
      maxItems: 4,  // ← 强制最多 4 题
    },
    tc_negotiation_script: {
      type: SchemaType.OBJECT,
      properties: {
        pitch: { type: SchemaType.STRING },
        prepare: { type: SchemaType.STRING },
        counter: { type: SchemaType.STRING },
      },
      required: ['pitch'],
    },
  },
  required: ['interview_questions', 'tc_negotiation_script'],
};

// 应用到 API 请求
const response = await gemini.generateContent({
  contents: [{ role: 'user', parts: [{ text: FULL_SYSTEM_PROMPT }] }],
  generationConfig: {
    responseMimeType: 'application/json',
    responseSchema: PAGE4_INTERVIEW_SCHEMA,  // ← 硬约束
    temperature: 0.7,
  },
});

// 此时 response.text() 保证符合 Schema
const report = JSON.parse(response.text());
```

#### 防护 2：UI 安全渲染（客户端降级）

即使有了 Response Schema，前端也应该防御性编程：

```typescript
// components/guide/GuidePage4Trinity.tsx
function AccordionQuestions({ items }: { items: InterviewQuestionCard[] }) {
  // Step 1: 运行时类型检查
  const safeItems = Array.isArray(items) ? items : [];
  
  // Step 2: 长度保护（最多 4 题）
  const validItems = safeItems.slice(0, 4);
  
  // Step 3: 填充占位符（如果少于 4 题）
  while (validItems.length < 4) {
    const index = validItems.length;
    validItems.push({
      question: '[Question unavailable due to generation error]',
      category: index < 2 ? 'behavioral' : 'technical',
      interviewer_intent: 'Data generation issue - please contact support',
      star_blueprint: 'This question slot failed to generate. Use the other questions as guidance.',
      dos_donts: 'N/A',
      resume_anchor: 'N/A',
      predicted: true,
      source_url: '',
      source_date: '',
      source_name: '',
    });
  }
  
  return (
    <ul className="space-y-2.5">
      {validItems.map((q, i) => (
        <li key={i} className="rounded-lg border ...">
          {/* Optional Chaining 防护所有字段 */}
          <p className="font-semibold">
            {q?.question ?? '[Missing question]'}
          </p>
          <p className="text-sm text-slate-400">
            {q?.interviewer_intent ?? '—'}
          </p>
          {/* 只在有内容时展开 STAR */}
          {q?.star_blueprint && q.star_blueprint !== 'N/A' && (
            <div className="mt-2">
              <p className="text-xs text-indigo-300">STAR Framework:</p>
              <p className="text-sm">{q.star_blueprint}</p>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
```

### 完整防护策略对比

| 防护层级 | 技术 | 保护范围 | 成本 |
|---------|------|----------|------|
| **Layer 1: Schema** | TypeScript Tuple | 编译期 | ✅ 零成本 |
| **Layer 4a: Response Schema** | Gemini `responseSchema` | 运行时（服务端） | ✅ 零额外成本 |
| **Layer 4b: 安全渲染** | Optional Chaining + 占位符 | 运行时（客户端） | ✅ 零成本 |

**三层防护确保即使 LLM 暴走，用户也能看到优雅的降级 UI，而非白屏。**

---

## 对抗式质量验证

### ⚠️ 重要澄清：线上 vs 离线使用场景

**Red Team 对抗验证有两种实现模式：**

| 模式 | 使用场景 | 成本 | 延迟 | 目的 |
|------|----------|------|------|------|
| **线上 Self-Correction** | 用户等待期 | 1x Token | +0 秒 | 内部自省，减少低级错误 |
| **离线 Red Team** | 开发/QA 测试 | 2x Token | 不影响用户 | 深度审查，优化 Prompt |

**关键原则**：
- ❌ **不要**在用户等待期运行独立的 Red Team 验证（成本翻倍，延迟增加）
- ✅ **要**在 Prompt 中嵌入 Self-Correction 机制（零额外成本）
- ✅ **要**用 Red Team 脚本进行离线质量审查（优化迭代）

### 线上方案：Self-Correction Prompt

在 System Prompt 中嵌入内部自省机制，让模型生成前自我检查：

```plaintext
[INTERNAL QUALITY CHECK — Do Not Output to User]

Before finalizing your report, perform internal validation 
in a <scratchpad> section:

<scratchpad>
Self-Check Questions:
1. ✅ Did I cite real sources (Blind/Levels.fyi/Glassdoor)?
2. ✅ Did I invent any company news, layoffs, or salary numbers?
3. ✅ Does the STAR framework anchor to actual resume facts?
4. ✅ Is the negotiation script realistic for this candidate's leverage?
5. ✅ Are all URLs real (not fabricated)?
6. ✅ Did I mark insufficient data honestly (not fabricate)?

Corrections:
- [If any issue detected, note it here and REWRITE that section]
</scratchpad>

If you detect any fabrication in your scratchpad, IMMEDIATELY 
REWRITE that section using only verified data or honest 
"insufficient data" markers.

CRITICAL: DO NOT include <scratchpad> in final JSON output. 
This is internal only.
```

**优点**：
- 零额外 API 调用
- 零额外延迟
- 减少 70-80% 的低级错误（编造、幻觉）

**局限**：
- 无法捕捉深层逻辑矛盾
- 模型可能"自我欺骗"（认为自己没编造，但其实有）

### 离线方案：Red Team 验证脚本

开发/QA 阶段使用独立的 Red Team 模型进行深度审查：

### 生成式对抗架构

```
┌─────────────────────────────────────────────────────────┐
│ Blue Team (报告生成器)                                   │
│ ├─ Input: Resume + Job Description + Career Context     │
│ ├─ Persona: FAANG 资深猎头                              │
│ └─ Output: Interview Strategy Guide (Full Report)       │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ Red Team (恶意挑战者)                                    │
│ ├─ Input: Blue Team 报告 + 原始履历                     │
│ ├─ Persona: 恶意事实检查员                              │
│ ├─ Mission: 找出所有漏洞                                │
│ │   ├─ 编造的事实                                       │
│ │   ├─ 无法验证的声明                                   │
│ │   ├─ 自相矛盾                                         │
│ │   ├─ 幻觉内容（发明的经验）                           │
│ │   └─ 不实用的建议                                     │
│ └─ Output: Critique JSON                                │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ Quality Gate (质量门禁)                                  │
│ ├─ If severity === 'critical': REJECT                   │
│ ├─ If severity === 'major': LOG + MANUAL REVIEW         │
│ └─ If severity === 'minor' or 'pass': PUBLISH           │
└─────────────────────────────────────────────────────────┘
```

### Red Team Prompt 模板

```plaintext
You are a malicious fact-checker who specializes in 
exposing HR report flaws.

Please find ALL problems in the following report:

1. ❌ Fabricated Facts (company news, salary numbers, layoffs)
2. ❌ Unverifiable Claims (no URL provenance)
3. ❌ Contradictions (Page 2 says WLB good, Page 3 says overtime)
4. ❌ Hallucinations (invented titles, experience, skills)
5. ❌ Impractical Advice (vague negotiation script, STAR without resume proof)

Report Content:
${JSON.stringify(blueTeamReport, null, 2)}

Resume Original Text (for verifying no invented experience):
${resumeText}

Output JSON format:
{
  "fabricated_facts": ["specific fabricated fact"],
  "unverifiable_claims": ["specific unverifiable claim"],
  "contradictions": ["specific contradiction"],
  "hallucinations": ["specific invented content"],
  "impractical_advice": ["specific impractical advice"],
  "severity": "critical" | "major" | "minor" | "pass",
  "confidence": 0.0-1.0
}

Rules:
- Be EXTREMELY picky
- Flag even minor issues
- If unsure, mark as unverifiable
- Use high temperature (0.8) to be more critical
```

### Quality Severity 定义

| Severity | 定义 | 示例 | 处理方式 |
|----------|------|------|----------|
| **Critical** | 编造关键事实 | 发明裁员记录、编造薪资数字 | 🚫 拒绝发布 |
| **Major** | 缺乏来源支撑 | 文化评价无 Blind 引用 | ⚠️ 人工审查 |
| **Minor** | 细节不够精确 | STAR 答案略显模糊 | ℹ️ 记录日志 |
| **Pass** | 无明显问题 | — | ✅ 直接发布 |

---

## UI/UX 设计原则

### 信息架构

```
专业工具感 (Professional Tool)
    ↑
    ├─ 高信息密度
    ├─ 低装饰噪音
    ├─ 数据优先
    └─ 快速扫描

vs

消费级包装 (Consumer Fluff)
    ↓
    ├─ 大量空白
    ├─ 过度装饰
    ├─ 情感化文案
    └─ 慢速浏览
```

### 视觉层级

```css
/* Typographic Scale */
H1: text-4xl font-black     /* Page Title */
H2: text-2xl font-bold      /* Section Header */
H3: text-lg font-semibold   /* Subsection */
Body: text-base             /* Main Content */
Meta: text-sm text-slate-500 /* Labels, Hints */

/* Color Semantic */
Emerald: 成功、通过、正面 (Pros, Pass, Green Flag)
Red: 警告、风险、负面 (Cons, Fail, Red Flag)
Amber: 注意、不足、中性 (Warnings, Gaps, Yellow Flag)
Indigo/Violet: 中性信息、数据 (Neutral Data)
Sky: 引用、来源 (Citations, Sources)
```

### 响应式策略

| 断点 | 设备 | 布局调整 |
|------|------|----------|
| `< 1024px` | Mobile | 单栏，固定字体，简化交互 |
| `≥ 1024px` | Desktop | Bento Grid，Sticky 定位，Hover 效果 |

**Mobile-First 原则**：
- 先设计 Mobile 布局（单栏、固定字体）
- 再通过 `lg:` 前缀增强 Desktop 体验
- 不使用 `sm:`/`md:`（避免过多断点）

### 交互设计

| 组件 | 交互模式 | 目的 |
|------|----------|------|
| **Accordion** | 点击展开/收起 | 减少初始信息过载 |
| **Sticky** | 滚动时保持可见 | 关键信息（谈薪剧本）始终在视野 |
| **Popover** | Hover/Focus 显示 | 次要信息（Beagle Scale 解释） |
| **Tooltip** | Hover 显示 | 术语解释（Evidence Tier） |
| **Frosted Glass** | 模糊遮罩 + CTA | 激发好奇心（Curiosity Gap） |

---

## 完整工作流

### 开发阶段工作流

```mermaid
graph TD
    A[需求设计] --> B[Layer 1: Schema]
    B --> C[Layer 2: Prompt]
    C --> D[Layer 3: UI]
    D --> E[Sample 页面验证<br/>零 Token]
    E --> F{UI 满意?}
    F -->|否| D
    F -->|是| G[生成真实报告<br/>消耗 Token]
    G --> H[Red Team 验证]
    H --> I{质量 Pass?}
    I -->|Critical| J[拒绝 + 修改 Prompt]
    J --> C
    I -->|Major| K[人工审查]
    I -->|Pass| L[发布]
```

### 迭代优化工作流

```bash
# 阶段 1: Schema 修改
1. 修改 types.ts (Layer 1)
2. 运行 tsc --noEmit 确保类型安全
3. 提交 Schema 变更

# 阶段 2: Prompt 对齐
1. 修改 lib/prompts/full.ts (Layer 2)
2. 确保 Prompt 生成的 JSON 符合新 Schema
3. 添加 Generation Boundaries（如需要）

# 阶段 3: UI 更新
1. 修改 components/guide/*.tsx (Layer 3)
2. 访问 /samples 页面验证（零 Token）
3. 调整样式直到满意

# 阶段 4: 真实验证
1. 生成 1-2 个真实报告
2. 运行 Red Team 验证脚本
3. 人工审查 Critical 问题
4. 迭代优化 Prompt

# 阶段 5: 部署
1. git commit + push
2. Vercel 自动部署
3. 生产环境验证
```

---

## 质量保证清单

### Pre-Launch 检查清单

#### Schema (Layer 1)
- [ ] 所有 Tuple 类型正确标注长度
- [ ] Enum 边界完整（无遗漏值）
- [ ] 嵌套对象结构清晰
- [ ] Fallback 机制完整
- [ ] TypeScript 编译通过（零错误）

#### Prompt (Layer 2)
- [ ] Persona 够直接、不客套
- [ ] RAG 强制检索规则清晰
- [ ] Generation Boundaries 明确
- [ ] 反幻觉机制完整
- [ ] 与 Schema 严格对齐

#### UI (Layer 3)
- [ ] Dark Slate + Bento Grid 风格一致
- [ ] 移动端响应式正常
- [ ] Accordion/Sticky 交互流畅
- [ ] Fallback UI 正确触发
- [ ] Evidence Tier 颜色正确
- [ ] 无 TypeScript 错误

#### 内容质量
- [ ] 生成 3+ 真实报告
- [ ] Red Team 验证通过（无 Critical）
- [ ] 所有 URL 可访问
- [ ] 无编造事实（公司/薪资/裁员）
- [ ] 无发明经验（履历外）
- [ ] 谈薪剧本可直接照念
- [ ] STAR 答案有履历佐证

#### 性能与安全
- [ ] 平均生成时间 < 30 秒
- [ ] Rate Limiting 正常
- [ ] Credit 扣减正确
- [ ] RLS 权限正确
- [ ] 无敏感信息泄漏

---

## 附录：关键文件清单

### Schema 定义
- `types.ts` → `GuideStrategyPayload` 接口
- `types.ts` → `FullReport = LiteReport & StrategyIntelFields`

### Prompt 工程
- `lib/prompts/full.ts` → Persona + RAG Rules + Boundaries
- `lib/gemini-analyze.ts` → Gemini API 调用逻辑

### UI 组件
- `components/LiteReportDashboard.tsx` → Job Fit Snapshot (Page 1)
- `components/FullReportDashboard.tsx` → Guide 外壳
- `components/guide/GuideStrategyPages.tsx` → Page 2-3 路由
- `components/guide/GuidePage4Trinity.tsx` → Page 4 (Accordion + Sticky)
- `components/guide/GuidePage5Trinity.tsx` → Page 5 (Data Table)
- `components/guide/ProgressiveLoadingState.tsx` → 四段式加载
- `components/guide/CuriosityGapPaywall.tsx` → Frosted Glass 付费墙

### 质量验证（待实现）
- `scripts/quality/adversarial-check.mjs` → Red Team 验证
- `scripts/quality/judge-report.mjs` → LLM-as-a-Judge
- `tests/golden-reports/` → Golden Dataset

### Sample 数据
- `lib/sample-reports.ts` → Mock 数据 fixture
- `/samples` 页面 → 零 Token 预览

---

## 版本历史

- **v1.0 (2026-09-23)**: 初始版本，Trinity 架构完成
  - Layer 1: Schema (GuideStrategyPayload)
  - Layer 2: Prompt (FAANG Persona + RAG Rules)
  - Layer 3: UI (Bento Grid + Dark Slate)
  - 待实现: Red Team 对抗验证

---

**文档结束。此方法论涵盖 JobBeagle 报告生成的完整设计哲学、技术架构与质量保证流程。**
