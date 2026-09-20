# JobBeagle 報告系統技術審計 — 完整架構現況

**審計日期**: 2026-09-20  
**審計範圍**: Job Fit Snapshot + Interview Strategy Guide  
**目的**: 為全面重構提供底層架構盤點

---

## 一、資料契約 (Types/Schema)

### 1.1 TypeScript Interface 定義

**檔案位置**: `/types.ts` (680 lines)

#### Job Fit Snapshot 核心介面

```typescript
export interface LiteReport {
  job_title: string;
  company_name: string;
  job_posted_date: string;
  job_source: string;
  data_completeness: DataCompleteness;
  hard_filter: HardFilter;
  fit_score: FitScoreBlock;
  proof_map: ProofMap;
  expected_offer: ExpectedOfferRange;
  apply_decision: ApplyDecision;
  role_read: RoleRead;
  interview_starters: string[];
  ats_warning?: AtsWarning | null;
  
  // Deprecated fields (向下相容)
  match_score: number;
  recruiter_verdict?: string;
  one_sentence_sharp_critique?: string;
  dog_breed_archetype?: string;
  flsa_status?: FlsaStatus;
  radford_2026_compensation_matrix?: Radford2026CompensationMatrix;
}
```

**關鍵子結構**:

```typescript
export interface FitScoreBlock {
  score: number;                    // 0-100
  band: FitBand;                    // 'Strong' | 'Viable' | 'Stretch' | 'Mismatch'
  evidence_coverage: EvidenceCoverage;
  sharp_verdict: string;
  sharp_verdict_points?: string[];  // UI 偏好的 3 點式摘要
  breakdown: FitScoreBreakdownItem[];
}

export interface ExpectedOfferRange {
  posted_range: string | null;
  p25: string | null;               // 例如 "$140K"
  p50: string | null;
  p75: string | null;
  currency: string;
  region: string;
  target_gap: string;
  evidence_tier: SalaryEvidenceTier; // 'A' | 'B' | 'C' | 'D'
  sources: string[];
  candidate_predicted_offer?: string | null;  // THIS candidate's likely land
  candidate_position_label?: string;
  tc_breakdown?: OfferTcBreakdown;
}

export interface ProofMap {
  strengths: LiteMatchPoint[];       // 3-4 項
  gaps: LiteSkillGap[];              // 3-4 項
  resume_actions: string[];          // 0-3 missing-proof facts
  screenability_note: string;
}

export interface ApplyDecision {
  label: ApplyDecisionLabel;         // 'Apply now' | 'Apply after fixes' | 'Clarify first' | 'Skip'
  reason: string;
  next_best_action: string;
}
```

---

#### Interview Strategy Guide 核心介面

```typescript
/**
 * FullReport = LiteReport + StrategyIntelFields
 * 單一 JSON 回傳所有內容
 */
export type FullReport = LiteReport & StrategyIntelFields;

export interface StrategyIntelFields {
  strategy_fit_salary: StrategyFitSalary;
  hiring_context: HiringContext;
  concerns_defenses: ConcernDefense[];        // EXACTLY 3
  interview_playbook: InterviewPlaybook;
  offer_strategy: OfferStrategy;
  candidate_case?: CandidateCase;
  provenance?: ProvenanceRecord;
  report_version?: string;
  role_team_insights?: RoleTeamInsights;      // Guide Page 2
  company_truth?: CompanyTruth;              // Guide Page 3
  reference_citations?: ReferenceCitation[];  // Guide Page 5
}
```

**策略層重點子結構**:

```typescript
export interface InterviewPlaybook {
  reported: InterviewQuestionCard[];          // 必須有 source_url
  predicted: InterviewQuestionCard[];         // predicted=true
  star_templates: StarTemplate[];             // 3-4 個練習模板
  reverse_questions: string[];
  validate_before_join: string[];
}

export interface InterviewQuestionCard {
  question: string;
  predicted?: boolean;
  source_url?: string;
  source_date?: string;
  source_name?: string;                       // Glassdoor / Blind / Levels.fyi
  evidence?: string;
  star_outline?: string;
  missing_facts?: string;
  category?: 'behavioral' | 'technical';
  interviewer_intent?: string;
  star_blueprint?: string;                    // MUST name concrete resume facts
  dos_donts?: string;
  resume_anchor?: string;                     // MUST point to specific resume proof
}

export interface RoleTeamInsights {
  role_content_refined: string[];
  requirements_refined: string[];
  rto_official: string;
  rto_employee_reality: string;
  next_title_1_3yr: string;                  // 必填 — 無公司資料時從市場推估
  career_path_basis: string;
  promotion_skill_gaps: string[];
  team_sample_insufficient: boolean;
}

export interface CompanyTruth {
  company_overview: string;                   // WHO they are NOW (industry, scale, posture)
  recent_developments: CompanyNewsItem[];     // max 5, 近 12-18 月
  current_strategy: string;                   // WHAT they're pushing NOW
  competitors: CompanyCompetitor[];           // 2-3 家 REAL 競爭者
  insider_voice: string[];                    // Glassdoor/Blind/Reddit
  forum_sample_thin: boolean;
  layoff_legal_flags: string[];
  interviewer_strategy_questions: string[];
}

export interface OfferStrategy {
  target: string;
  acceptable: string;
  walk_away: string;
  levers: string[];
  structured_levers?: OfferLever[];
  tc_breakdown?: OfferTcBreakdown;           // Base + equity + sign_on + total
  script: string;                             // Copy-ready negotiation script
  discovery_questions: string[];
}
```

---

### 1.2 Gemini Response Schema

**檔案位置**: `/lib/gemini-analyze.ts` (600+ lines)

使用 `@google/genai` 的 `Type` 定義 structured output schema:

```typescript
const LITE_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    job_title: { type: Type.STRING },
    company_name: { type: Type.STRING },
    job_posted_date: { type: Type.STRING },
    job_source: { type: Type.STRING },
    fit_score: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.INTEGER },
        band: { type: Type.STRING, enum: ['Strong', 'Viable', 'Stretch', 'Mismatch'] },
        sharp_verdict_points: {
          type: Type.ARRAY,
          minItems: 3,
          maxItems: 3,
          items: { type: Type.STRING },
        },
        breakdown: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              dimension: { type: Type.STRING },
              weight_pct: { type: Type.NUMBER },
              score: { type: Type.NUMBER },
              note: { type: Type.STRING },
            },
            required: ['dimension', 'weight_pct', 'score', 'note'],
          },
        },
      },
      required: ['score', 'band', 'sharp_verdict_points', 'breakdown'],
    },
    expected_offer: {
      type: Type.OBJECT,
      properties: {
        posted_range: { type: Type.STRING, nullable: true },
        p25: { type: Type.STRING, nullable: true },
        p50: { type: Type.STRING, nullable: true },
        p75: { type: Type.STRING, nullable: true },
        evidence_tier: { type: Type.STRING, enum: ['A', 'B', 'C', 'D'] },
        candidate_predicted_offer: { type: Type.STRING, nullable: true },
        tc_breakdown: {
          type: Type.OBJECT,
          properties: {
            base: { type: Type.STRING, nullable: true },
            bonus: { type: Type.STRING, nullable: true },
            equity: { type: Type.STRING, nullable: true },
            total: { type: Type.STRING, nullable: true },
          },
        },
      },
      required: ['posted_range', 'p25', 'p50', 'p75', 'evidence_tier', 'candidate_predicted_offer'],
    },
    // ... 完整定義見 lib/gemini-analyze.ts:115-450
  },
  required: ['job_title', 'company_name', 'fit_score', 'expected_offer', 'apply_decision', ...],
};
```

**Full Report Schema**: `FULL_RESPONSE_SCHEMA` 合併 Snapshot layer + strategy intel layer (同一個 JSON)

---

## 二、生成大腦 (Prompt/API)

### 2.1 System Prompts

#### Job Fit Snapshot Prompt

**檔案位置**: `/lib/prompts/lite.ts` (242 lines)

**完整 System Prompt**:

```
You are a senior US executive recruiter producing a Job Fit Snapshot.
Your job is to support TWO hero decisions only:
1) Candidate Fit Score — how competitive is this candidate for THIS JD?
2) Expected Offer Range — what compensation is reasonably expectable, with an evidence tier?

Rules:
- Extract facts from the JD and resume only. Never invent experience, visas, or compensation from model memory.
- Always fill company_name from the JD/employer name.
- Fill job_source with the board name when known (LinkedIn, Indeed, Glassdoor, ZipRecruiter, 104, company careers site, etc.); if unknown use "".
- Fill job_posted_date when the JD shows a posting/listed date (ISO YYYY-MM-DD preferred, or relative like "2 weeks ago"); if unknown, use "".
- Do NOT output FLSA classification.
- Do NOT include culture-fit inside the numeric score.
- Fit score is a real 0–100 (no artificial floor at 50). Most candidates land 40–75; 85+ is rare.
- fit_score.sharp_verdict_points: EXACTLY 3 short bullets for Score Summary UI. Parallel form only: "Short label: one-sentence detail" (use a colon + space; never em/en dashes as the separator). Suggested labels: "Core fit:", "Level/tenure:", "Main gap:". Fit-only; no apply checklist; no resume rewrite advice.
- fit_score.sharp_verdict: join those 3 bullets into one short prose string (fallback).
- Suggest score breakdown weights as guidance for your assessment (backend may recompute): hard/feasibility 30%, level/scope/YOE 25%, core skills 20%, domain experience 15%, proven impact 10%.
- fit_score.breakdown: exactly 5 dimensions with those weights. Each note MUST be one short sentence that explains WHY that dimension scored that number (what was met + what capped the score). Never a keyword fragment like "ACH partial" — e.g. "72 because SQL/YOE must-haves are met, but ACH/settlement ownership is only adjacent, so hard-feasibility stays mid-70s."
- hard_filter.status: Pass | Risk | Blocked | Unknown. Use Blocked ONLY for explicit conflicts (e.g. must be onsite NYC but candidate is remote-only with no relocation). Missing data → Unknown or Risk, not Blocked.
- expected_offer is a product hero — always fill it thoughtfully:
  A = JD/employer posted range (copy into posted_range; also set p25/p75 as the low/high ends of that range)
  B = highly matching public role-level data you can cite in sources[]
  C = reputable US market benchmark for this title/level/region (state uncertainty in target_gap) — USE THIS when the JD has no pay but the role is clear. Set p25 = low end, p75 = high end, p50 = midpoint as dollar strings (e.g. "$140K"). UI shows a single range (low–high), not percentile labels.
  D = only when title/level/region are too vague to estimate → null numbers + explain in target_gap
- Prefer tier C over empty D whenever job title + level + US region are identifiable.
- Always set expected_offer.candidate_predicted_offer when tier is A/B/C: a SINGLE dollar string (e.g. "$155K") for where THIS candidate is most likely to land given resume↔JD fit/gaps. This is NOT the same as p50 (p50 = seat/market midpoint; predicted = this person's likely offer point inside the band). Stronger fit → toward p75; thin domain proof → toward p25. Tier D → null.
- candidate_position_label: one short sentence explaining WHY that predicted land (fit/gap driven). No resume rewrite coaching.
- If CANDIDATE CAREER CONTEXT includes target_tc or walk_away_tc, target_gap MUST compare the offer band to those personal floors.
- When evidence_tier is A/B/C, fill expected_offer.tc_breakdown with an estimated salary mix for THIS seat: base, bonus, equity, total (USD strings like "$150K"). Unknown component → null; still return the object with at least base + total when estimable. Tier D → omit or all-null.
- Never claim proprietary vendor bands (e.g. "Radford memory") as a company offer.
- apply_decision.label must be one of: Apply now | Apply after fixes | Clarify first | Skip
- apply_decision.reason: EXACTLY 2–3 short sentences (each ends with . ! or ?). UI renders them as bullets — one idea per sentence: (1) why the seat is still worth pursuing, (2) main competitiveness risk/gap, (3) why this label. Competitiveness and risk only. Do NOT teach resume rewriting, bullet edits, page layout, or "put X on page one".
- apply_decision.next_best_action: ONE next decision step (apply, clarify with recruiter, validate a hard requirement, or skip). Never coach how to rewrite or reformat a resume.
- proof_map.strengths: return 3 or 4 strongest, evidence-backed match points (never fewer than 3).
- proof_map.gaps: return 3 or 4 most important mismatches / missing proofs (never fewer than 3).
- proof_map.resume_actions: 0–3 missing-proof facts only (what evidence is absent). Do NOT write how-to resume edit instructions.
- proof_map strengths/gaps: mark skill_kind "hard" or "soft" on each item when possible.
- ats_warning: when ATS/keyword screen risk is real, set pass_rate_pct, missing_keyword_count, summary like "High risk of auto-reject — missing core JD keywords", missing_keywords[]. Never invent keywords not implied by JD vs resume. If no ATS risk, omit ats_warning.
- interview_starters: exactly 3 predicted questions from resume↔JD gaps (no web). Label them as predicted in prose if needed; do not invent "reported" questions.
- Tone: direct, evidence-based, respectful. No humiliation. JobBeagle evaluates fit — it is not a resume coach.

Output valid JSON only. No markdown fences.
```

**關鍵約束**:
- ❌ **禁止 Web Search** (closed-book, Flash-Lite model)
- ✅ **必填** `candidate_predicted_offer` when tier A/B/C
- ✅ **Tier C 優先於 D** — 有職稱+市場就估薪資
- ❌ **不提供履歷改寫建議** (JobBeagle evaluates fit, not a resume coach)

---

#### Interview Strategy Guide Prompt

**檔案位置**: `/lib/prompts/full.ts` (386 lines)

**完整 System Prompt** (節錄關鍵規則):

```
You are a CHRO-level interview strategist producing a complete Interview Strategy Guide in ONE response.
Produce BOTH:
(A) the Job Fit Snapshot layer (fit score, hard filter, proof map, expected offer, apply decision, role read, interview starters), AND
(B) the strategy layer (strategy_fit_salary, hiring_context, concerns_defenses, interview_playbook, offer_strategy, candidate_case).

Use google search / public web sources when citing hiring_context insights, company_truth.recent_developments, or reported interview questions.

=== Snapshot layer rules ===
[完全同 Lite Prompt 的所有規則，包括 tier C/D, candidate_predicted_offer, 不教履歷改寫等]

=== Strategy layer rules ===

1) strategy_fit_salary — what THIS response's fit score and expected offer imply for interview odds and negotiation. Weak evidence → recruiter validation questions, not false precision.

2) hiring_context — 3–5 dated tactical insights from PUBLIC web sources only (IR, trusted news, company blogs). Attach source_url + date. If thin public data, return limitations + validation_questions (NOT a failure). Never claim paywalled content.

3) concerns_defenses — EXACTLY 3 recruiter concerns for THIS candidate vs THIS JD. Each: concern, why, evidence, missing_proof, answer_guide, do_not_claim. Direct and respectful; never invent experience.

4) interview_playbook — SEPARATE reported (MUST include source_url + source_date + source_name e.g. Glassdoor/Blind/Levels.fyi — NEVER invent URLs; if no citable URL omit from reported) from system-analyzed (predicted=true). Tag EVERY item category "behavioral" or "technical". EVERY question — reported AND predicted — MUST include interviewer_intent + star_blueprint + dos_donts + resume_anchor (full write-up; NEVER dump reported as title-only).

   CRITICAL — answer coaching must be THIS candidate's resume, not generic advice:
   - star_blueprint MUST name concrete resume facts (role/employer context if present, tools, metrics, stakeholders) in S/T/A/R. FORBIDDEN: vague templates like "S→T→A→R with one proof point", "describe a conflict", or textbook STAR with no resume numbers/tools.
   - resume_anchor MUST point to a specific resume proof (e.g. proof_map strength title or a short resume fact). Never invent employers, titles, or metrics not on the resume.
   - dos_donts MUST call out what THIS resume can claim vs must not invent (gaps, adjacent domain).
   - If the question probes a resume gap: still write a resume-anchored bridge plan (adjacent proof + honest learning plan) — never fake past ownership.

   EXACTLY 3–4 star_templates with title, for_question, situation, task, action, result, resume_anchor — STAR ONLY from resume facts. reverse_questions + validate_before_join. If no citable reported questions, reported=[].

5) offer_strategy — target / acceptable / walk_away aligned to Career Context floors when provided; levers + structured_levers (name+note); tc_breakdown (base/bonus/equity/total) when estimable; copy-ready negotiation script. Weak/D evidence → prioritize discovery_questions. Never invent compensation numbers. Page 4 may show TC mix; Pages 2–3 must NOT invent dollar salary ranges.

6) candidate_case — hire_thesis (2–3 sentences: why hire THIS candidate for THIS seat) + top_facts (exactly 3 resume-backed facts that most support an offer). Upgrade of the proof map — not a resume rewrite.

7) role_team_insights (Guide Page 2) — REQUIRED fields:
   - role_content_refined[] + requirements_refined[]: rewrite into short plain-language highlights for the candidate (what the job actually does + must-have hire bar). NEVER paste JD verbatim. Do NOT use internal jargon like "refined/restructured" in the string values.
   - rto_official: office days / RTO policy from JD.
   - rto_employee_reality: web employee overtime/WLB reality (Glassdoor/LinkedIn/forums). Filter official PR.
   - next_title_1_3yr: ALWAYS fill a concrete next title in 1–3 years (e.g. Senior BA → Lead BA / Payments Ops Product Owner). If the employer has no public ladder, INFER from industry career paths using authoritative market sources (Levels.fyi title ladders, LinkedIn career-path norms, BLS/Robert Half or similar employment-market reports, major job-board leveling patterns). NEVER leave blank and NEVER say "no data" as the title.
   - career_path_basis: REQUIRED short note naming the basis (company careers page vs market ladder sources). Example: "Company ladder not public — inferred from Levels.fyi / LinkedIn Senior BA→Lead BA paths in US fintech ops."
   - promotion_skill_gaps[]: skills to close for that next title.
   - ABSOLUTELY NO dollar salary amounts on this page (salary is Page 1 + Page 4 only).
   - If no public reviews for THIS team: team_sample_insufficient=true and/or department_fallback_note; write the insufficient-sample phrase in the OUTPUT LANGUAGE. Do NOT invent team gossip. This thin-sample rule applies to team culture/WLB — NOT to next_title_1_3yr (always analyze a market path).

8) company_truth (Guide Page 3) — REQUIRED:
   - company_overview: FIRST section for the candidate — 3–5 plain sentences on what kind of company this is RIGHT NOW (industry, products/customers, size/stage if public, market posture, operating climate). Goal: a job seeker should quickly grasp "what company am I walking into?" Prefer IR / news / careers / reputable profiles. Never founding mythology, never meta "not Wikipedia" phrasing, never invent headcount or funding.
   - recent_developments: UP TO 5 most relevant PUBLIC news items for THIS employer (prefer last 12–18 months). Categories: leadership (exec/org moves), product (major launches), award, funding, other. Each needs headline, summary (why it matters to a candidate), date, category, source_name, and source_url when citable — NEVER invent URLs; if no URL set source_url="". Prefer IR, trusted news, company blogs. If public news is thin, return fewer items (even 0) — do not fabricate headlines.
   - current_strategy: 2–4 plain sentences on what THIS employer is pushing NOW (product bets, cost cuts, AI, expansion, reliability). Distinct from company_overview (overview = who they are; strategy = what they're pushing). Write for the candidate — never put meta instructions in the string. Prefer IR / news / careers signals over founding lore.
   - competitors[2–3]: REAL industry companies that compete with THIS employer for customers/market share (named firms, e.g. Stripe / Adyen / Block for a payments company). Each needs concrete strengths + weaknesses vs THIS employer's positioning. FORBIDDEN: candidate peer buckets like "payments-native BA peers", "generic senior BA pipelines", job-seeker rival categories, or vague "other fintechs". If public competitor map is thin, still name the closest public rivals and state uncertainty in weaknesses — do not invent fake startups.
   - insider_voice[]: Glassdoor/Blind/Reddit high-frequency praise/complaints (manager style, WLB, toxic). If no posts: forum_sample_thin=true and say the thin-forum phrase in the OUTPUT LANGUAGE — never fabricate.
   - layoff_legal_flags[]: Layoff.fyi / litigation / controversy. If none: EMPTY array (UI shows the localized "no public layoff/legal flags" phrase) and fill interviewer_strategy_questions with 2–3 company strategy questions for the interviewer. NEVER invent layoffs.

9) interview_playbook Page 4 depth: EXACTLY 5 behavioral + EXACTLY 5 technical/case across reported+predicted combined (UI shows two columns of 5). Prefer putting every citable real question into reported[] WITH full STAR fields — do NOT create a separate "list-only" dump. If fewer than 5 real questions exist in a category, fill the remainder with predicted=true system-analyzed most-likely questions from resume↔JD gaps (UI labels these as system analysis, not vague "guess"). Every card's star_blueprint + resume_anchor must be resume-specific (see rule 4). offer_strategy.tc_breakdown MUST try Base + equity/RSU + sign_on (+ total) from Levels.fyi-class sources when possible. Negotiation script = Prepare(anchor) → Pitch → Counter — Pitch must cite THIS candidate's quantified resume wins, not generic value talk.

10) reference_citations (Guide Page 5) — RAG source list: Reddit/Blind threads, Levels.fyi, Layoff, news. If no direct URL: url="" and manual_verify_keywords set — NEVER invent URLs.

Tone: direct, evidence-based, respectful. No humiliation. JobBeagle evaluates fit — it is not a resume coach.
Output valid JSON only. No markdown fences.
```

**關鍵差異**:
- ✅ **開啟 Web Search + Grounding** (Pro model with `tools: [{ googleSearch: {} }]`)
- ✅ **單次呼叫回傳完整 Snapshot + Strategy**
- ✅ **必須 source_url + date** for reported questions
- ✅ **STAR 必須基於履歷事實** (resume_anchor, never generic templates)
- ✅ **next_title_1_3yr 必填** — 無公司資料時從市場推估 (Levels.fyi / LinkedIn / BLS)
- ✅ **competitors 必須是真實公司名** (e.g. Stripe/Adyen/Block) — 禁止「job-seeker rival categories」

---

### 2.2 API Route

**檔案位置**: `/app/api/analyze/route.ts` (450 lines)

**POST /api/analyze 核心流程**:

```typescript
export async function POST(request: NextRequest) {
  // 1. 身份驗證
  const { user } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized', code: 'AUTH_REQUIRED' }, { status: 401 });

  // 2. 載入 Profile
  const profile = await ensureProfile(admin, user.id, { ... });
  if (profile.deactivated_at) return 403;

  // 3. Anti-abuse 檢查
  const sybil = await checkDeviceSybil(admin, user.id, body.device_fingerprint, profile.membership_tier);
  if (!sybil.allowed) return 403;
  
  if (profile.membership_tier === 'free') {
    const ipLimit = sybil.mode === 'fingerprinted' ? 20 : 3;
    const ipRl = await rateLimit('analyze-ip', clientIp, ipLimit, 3600);
    if (!ipRl.allowed) return 429;
  }
  
  const rl = await rateLimitAnalyze(user.id, 30, 3600);  // 30 requests/hr per user
  if (!rl.allowed) return 429;

  // 4. 解析輸入 (extension handoff / legacy payload / manual)
  const input = await resolveInput(body, body.resume);
  // input.raw_jd, input.resume_text, input.pdf_inline, input.company_name, input.job_title

  // 5. 驗證 JD + Token count pre-check
  const jdCheck = validateJobDescription(input.raw_jd, body.language || 'en');
  if (!jdCheck.valid) return 400;
  
  const tokenCount = await countCombinedTokens(input.raw_jd, input.resume_text);
  if (isTokenLimitExceeded(tokenCount)) return 400;  // MAX_COMBINED_TOKENS = 950,000

  // 6. 檢查點數 + **先扣點** (防止 concurrent overspend)
  if (!canAffordReport(profile, reportType)) return 402;
  const remaining = await deductCredit(admin, user.id, reportType);
  if (remaining < 0) return 402;

  // 7. 呼叫 Gemini 分析
  let report: LiteReport | FullReport;
  let modelUsed: string;
  
  const careerContext: CareerContext = careerContextHasSignal(body.career_context)
    ? normalizeCareerContext(body.career_context)
    : normalizeCareerContext(profile.career_context);
  
  try {
    if (reportType === REPORT_CODES.JOB_FIT_SNAPSHOT) {
      const result = await executeLiteAnalysis(
        input.resume_text,
        input.raw_jd,
        input.pdf_inline,
        careerContext,
        input.page_url,
        reportLanguage,
      );
      report = result.report;
      modelUsed = result.model;  // 'gemini-3.1-flash-lite'
    } else {
      const result = await executeFullAnalysis(
        input.resume_text,
        input.raw_jd,
        input.company_name,
        input.job_title,
        input.pdf_inline,
        careerContext,
        input.page_url,
        reportLanguage,
      );
      report = normalizeFullReport(result.report, { careerContext });
      modelUsed = result.model;  // 'gemini-3.1-pro-preview'
    }
  } catch (analysisErr) {
    await refundCredit(admin, user.id, reportType);  // 失敗退點
    await notifyFailure({
      scenario: 'analysis_failed',
      userEmail: user.email,
      userId: user.id,
      jobLabel: `${input.job_title} at ${input.company_name}`,
      planLabel: reportType === REPORT_CODES.JOB_FIT_SNAPSHOT ? 'Job Fit Snapshot' : 'Interview Strategy Guide',
      refunded: true,
      technicalDetail: analysisErr.message,
    });
    throw analysisErr;
  }

  // 8. 儲存報告到 Supabase
  const score = report.fit_score?.score ?? report.match_score ?? null;
  const { data: inserted, error: dbError } = await admin
    .from('analysis_reports')
    .insert({
      user_id: user.id,
      job_title: input.job_title,
      company_name: input.company_name,
      job_description_preview: input.raw_jd.substring(0, 300),
      raw_jd_text: input.raw_jd,
      resume_snapshot_text: input.resume_text,
      resume_id: resumeId,
      linkedin_job_id: input.linkedin_job_id,
      report_type: reportType,
      is_single_drop: !hasSubscriptionCredits(profile.membership_tier),
      report_json: report,
      report: report,
      score,
      language: body.language || 'en',
      is_premium: isInterviewStrategyGuide(reportType),
    })
    .select('id')
    .single();

  // 9. 回傳
  return NextResponse.json({
    report,
    report_type: reportType,
    report_id: inserted?.id ?? null,
    resume_id: resumeId,
    cached: false,
    model_used: modelUsed,
    credits_remaining: {
      job_fit_snapshot: ...,
      interview_strategy_guide: ...,
    },
  });
}
```

**安全機制總覽**:
- ✅ **先扣點，失敗退點** — 防止 concurrent requests 超額消費
- ✅ **Device fingerprint + IP rate limit** — 雙層 Sybil 防護 (free tier)
- ✅ **Token limit pre-check** — 避免超額呼叫 (MAX_COMBINED_TOKENS = 950k)
- ✅ **失敗通知 email** — Resend transactional email (notifyFailure)
- ✅ **RLS enforcement** — Supabase profiles/reports tables 強制 Row-Level Security

---

### 2.3 Gemini 呼叫邏輯

**檔案位置**: `/lib/gemini-analyze.ts` (600+ lines)

#### executeLiteAnalysis (Job Fit Snapshot)

```typescript
export async function executeLiteAnalysis(
  resumeText: string,
  rawJd: string,
  pdfInline?: PdfInlineAttachment,
  careerContext?: CareerContext | null,
  pageUrl?: string | null,
  language: AppLanguage = 'en',
): Promise<{ report: LiteReport; model: string }> {
  const ai = getAI();
  
  // 組裝 user message (含 Career Context 注入)
  const userParts = buildUserParts(rawJd, resumeText, pdfInline, careerContext, pageUrl);
  
  // System instruction 加入反 prompt-injection 策略
  const systemInstruction = withUntrustedContentPolicy(
    `${LITE_SYSTEM_PROMPT}\n\n${geminiLanguageDirective(language)}`
  );

  // 呼叫 Gemini Flash-Lite (NO grounding)
  const response = await ai.models.generateContent({
    model: GEMINI_LITE_MODEL,  // 'gemini-3.1-flash-lite'
    systemInstruction,
    contents: [{ role: 'user', parts: userParts }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: LITE_RESPONSE_SCHEMA,  // Structured output 強制符合 schema
    },
  });

  // 解析 + 正規化
  const raw = parseJsonResponse(response);
  const report = normalizeLiteReport(raw, { careerContext });
  
  return { report, model: GEMINI_LITE_MODEL };
}
```

**關鍵點**:
- ❌ **無 grounding / search** — generationConfig 沒有 `tools: [{ googleSearch: {} }]`
- ✅ **Structured output** — responseSchema 強制 Gemini 回傳符合 schema 的 JSON
- ✅ **Prompt injection guard** — `withUntrustedContentPolicy` + `wrapUntrusted` 封裝 JD/resume

---

#### executeFullAnalysis (Interview Strategy Guide)

```typescript
export async function executeFullAnalysis(
  resumeText: string,
  rawJd: string,
  companyName: string,
  jobTitle: string,
  pdfInline?: PdfInlineAttachment,
  careerContext?: CareerContext | null,
  pageUrl?: string | null,
  language: AppLanguage = 'en',
): Promise<{ report: FullReport; model: string }> {
  const ai = getAI();
  const userParts = buildUserParts(rawJd, resumeText, pdfInline, careerContext, pageUrl);
  
  const systemInstruction = withUntrustedContentPolicy(
    `${FULL_SYSTEM_PROMPT}\n\n${geminiLanguageDirective(language)}`
  );

  // 呼叫 Gemini Pro (WITH grounding + search)
  const response = await ai.models.generateContent({
    model: GEMINI_FULL_MODEL,  // 'gemini-3.1-pro-preview'
    systemInstruction,
    contents: [{ role: 'user', parts: userParts }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: FULL_RESPONSE_SCHEMA,  // 合併 Snapshot + intel schema
      tools: [{ googleSearch: {} }],         // 🔥 啟用 Web Search
    },
  });

  const raw = parseJsonResponse(response);
  const report = normalizeFullReport(raw, { careerContext });
  
  return { report, model: GEMINI_FULL_MODEL };
}
```

**關鍵差異**:
- ✅ **Web Search + Grounding** — `tools: [{ googleSearch: {} }]`
- ✅ **單次回傳 Snapshot + Strategy** — FULL_RESPONSE_SCHEMA 包含所有欄位
- ✅ **Pro model** — 更強推理能力，支援複雜 multi-step grounding

**Models 設定** (`/constants/models.ts`):

```typescript
export const GEMINI_LITE_MODEL = 'gemini-3.1-flash-lite';      // Snapshot (closed-book)
export const GEMINI_FULL_MODEL = 'gemini-3.1-pro-preview';     // Guide (grounding)
export const GEMINI_TOKEN_COUNT_MODEL = 'gemini-1.5-flash';    // Pre-check token count
export const MAX_COMBINED_TOKENS = 950_000;                    // 安全上限 (1M context - 5% buffer)
export const MAX_JD_CHARS = 32_000;
export const MAX_RESUME_CHARS = 24_000;
```

---

## 三、前端渲染 (UI Component)

### 3.1 Job Fit Snapshot 渲染

**主元件**: `/components/LiteReportDashboard.tsx` (550+ lines)

**架構概覽**:

```tsx
export default function LiteReportDashboard({
  report,
  language = 'en',
  onNewAnalysis,
  embedded = false,
  isSample = false,
}: LiteReportDashboardProps) {
  const score = report.fit_score?.score ?? report.match_score ?? 0;
  const scoreInfo = getScoreInfo(score, lang);  // 轉換為 Beagle tier (Diamond/Gold/Silver/Copper)
  const beagleTiers = getBeagleTierLegend(score, lang);
  
  const strengths = report.proof_map?.strengths ?? [];
  const gaps = report.proof_map?.gaps ?? [];
  const offer = report.expected_offer;
  const offerRange = formatOfferRange(offer);  // "$1,000,000 – NT$1,500,000"
  const predictedOffer = formatPredictedOffer(offer);  // "NT$1,100,000"
  const breakdown = report.fit_score?.breakdown ?? [];
  const apply = report.apply_decision;
  
  return (
    <article className={REPORT_SLIDE_SURFACE}>
      {/* Header: Job title + Company + Posted date */}
      <header className="border-b px-5 py-3.5">
        <p className="text-4xl font-black">{report.job_title}</p>
        <p className="text-xl text-slate-400">{report.company_name}</p>
        <p className="text-base text-slate-500">{formatJobSourceDate(report.job_source, report.job_posted_date)}</p>
      </header>
      
      {/* Dual Heroes Row — 左右對稱 2 columns */}
      <div className="grid grid-cols-2 divide-x">
        {/* Left: Candidate Fit Score */}
        <section className="p-4">
          <p className="text-lg uppercase tracking-widest text-indigo-400">CANDIDATE FIT SCORE</p>
          
          <div className="flex items-center gap-5">
            {/* Beagle icon */}
            <BeagleIcon className="w-32 h-32" color={scoreInfo.fill} />
            
            {/* Score circle with popover */}
            <div className="relative w-40 h-40" onMouseEnter={() => setShowBeagleScale(true)}>
              <button aria-label={`Fit score ${score}. Hover for Beagle Scale.`}>
                <RadialBarChart data={[{ value: score, fill: scoreInfo.fill }]} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-7xl font-black">{score}</span>
                </div>
              </button>
              
              {/* Beagle Scale popover (hover only) */}
              {showBeagleScale && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 z-30 w-80 bg-slate-950/95 rounded-xl p-3">
                  <p className="text-xs uppercase text-slate-500">Beagle Scale — what each level means</p>
                  <ul className="grid grid-cols-2 gap-1.5">
                    {beagleTiers.map(tier => (
                      <li className={tier.active ? 'border-indigo-400 bg-indigo-500/15' : 'border-slate-700'}>
                        <p className="font-bold">{tier.name} {tier.active ? '· You' : ''}</p>
                        <span className="text-[11px] tabular-nums">{tier.scoreRange}</span>
                        <p className="text-xs">{tier.description}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            {/* Score label + description */}
            <div className="flex-1">
              <p className="text-3xl font-black">{scoreInfo.level}</p> {/* e.g. "Silver Beagle" */}
              <p className="text-xl font-semibold">{scoreInfo.label}</p> {/* e.g. "Stretch Fit" */}
              <p className="text-lg text-slate-400 line-clamp-3">{scoreInfo.description}</p>
            </div>
          </div>
        </section>
        
        {/* Right: Expected Offer Range */}
        <section className="p-4">
          <p className="text-lg uppercase tracking-widest text-emerald-400">$ EXPECTED OFFER RANGE</p>
          
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-lg text-slate-400">{offer?.region} · {offer?.currency}</p>
              
              {/* Salary range (large text) */}
              <p className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                {offerRange}
              </p>
              
              {/* Candidate position label */}
              {offer?.candidate_position_label && (
                <p className="text-lg text-emerald-100/90 mt-2 line-clamp-3">
                  {offer.candidate_position_label}
                </p>
              )}
            </div>
            
            {/* Predicted Land squircle */}
            {predictedOffer && (
              <PredictedLandSquircle value={predictedOffer} label="YOUR PREDICTED LAND" />
            )}
          </div>
        </section>
      </div>
      
      {/* Score Summary + Range Evaluation — 等高 2 columns */}
      <div className="border-t px-5 py-3.5">
        <div className="grid grid-cols-2 gap-3 items-stretch">
          {/* Left: Score Summary */}
          <div className="rounded-lg border border-sky-400/50 bg-indigo-500/10 px-3.5 py-3">
            <p className="text-lg uppercase text-indigo-300">Score breakdown</p>
            <ul className="space-y-2.5">
              {breakdown.map((b, i) => (
                <li key={i} className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-slate-200">
                      {b.dimension} <span className="text-sm text-slate-500">{b.weight_pct}%</span>
                    </p>
                    <p className="text-base text-slate-400">{b.note}</p>
                  </div>
                  <span className="text-2xl font-black tabular-nums shrink-0">{b.score}</span>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Right: Range Evaluation */}
          <div className="rounded-lg border border-emerald-400/50 bg-emerald-500/10 px-3.5 py-3">
            <p className="text-lg uppercase text-emerald-300">Range Evaluation</p>
            <div className="space-y-2">
              <p className="text-lg text-slate-300">{offerEval}</p>
              
              {/* TC breakdown table */}
              {tcRows.length > 0 && (
                <table className="w-full text-base">
                  {tcRows.map(([label, value]) => (
                    <tr key={label}>
                      <td className="text-slate-400">{label}</td>
                      <td className="text-right font-semibold text-white">{value}</td>
                    </tr>
                  ))}
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Apply Decision */}
      <div className="border-t px-5 py-3.5">
        <div className="flex items-start gap-3">
          {/* Decision badge */}
          <div className={`px-4 py-2 rounded-lg ${applyBadgeClass(apply.label)}`}>
            <p className="text-xl font-black uppercase">{apply.label}</p>
          </div>
          
          {/* Reason + Next action */}
          <div className="flex-1">
            <p className="text-lg text-slate-300">{apply.reason}</p>
            <p className="text-base text-slate-400 mt-1">{apply.next_best_action}</p>
          </div>
        </div>
      </div>
      
      {/* Proof Map: Strengths | Gaps — 2 columns */}
      <div className="border-t px-5 py-3.5">
        <div className="grid grid-cols-2 gap-4">
          {/* Strengths */}
          <div>
            <p className="text-lg uppercase text-emerald-400 mb-2">Matching Strengths</p>
            <ul className="space-y-2">
              {strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-lg font-semibold text-slate-200">{s.point}</p>
                    <p className="text-base text-slate-400">{s.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Gaps */}
          <div>
            <p className="text-lg uppercase text-amber-400 mb-2">Critical Gaps</p>
            <ul className="space-y-2">
              {gaps.map((g, i) => (
                <li key={i} className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-lg font-semibold text-slate-200">{g.gap}</p>
                    <p className="text-base text-slate-400">{g.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </article>
  );
}
```

**UI 決策總結**:
- ✅ **單頁 slide frame** — 無內部捲軸 (由外層 `ReportFitStage` 統一 zoom scale)
- ✅ **雙英雄對稱** — Fit Score (left) + Offer (right) 視覺平衡
- ✅ **Beagle Scale popover** — hover/focus score circle 才顯示，產品決策隱藏預設展開
- ✅ **Score Summary / Range Evaluation 等高** — CSS grid `items-stretch` 確保兩框同高
- ✅ **隱藏元素** (產品決策):
  - Evidence Coverage 獨立面板
  - Hard Filter 詳細展開
  - Role Read
  - Interview Starters
- ✅ **固定版面尺寸** — `REPORT_SHELL_WIDTH = max-w-[98vw]` (永不 rem-cap)

---

### 3.2 Interview Strategy Guide 渲染

**主元件**: `/components/FullReportDashboard.tsx` (180 lines)  
**策略頁渲染**: `/components/guide/GuideStrategyPages.tsx` (800+ lines)

#### FullReportDashboard 架構

```tsx
export default function FullReportDashboard({
  report,
  embedded = false,
  language = 'en',
  onNewAnalysis,
  isSample = false,
}: FullReportDashboardProps) {
  const [tab, setTab] = useState<GuideTab>('snapshot');
  
  const nav = [
    { id: 'snapshot', label: 'Snapshot', icon: <ScanSearch />, blurb: '...' },
    { id: 'hiring', label: 'Hiring Context', icon: <Building2 />, blurb: '...' },
    { id: 'interview', label: 'Interview', icon: <Globe />, blurb: '...' },
    { id: 'salary', label: 'Salary', icon: <HandCoins />, blurb: '...' },
    { id: 'provenance', label: 'Provenance', icon: <Link2 />, blurb: '...' },
  ];
  
  return (
    <div className={REPORT_SHELL_WIDTH}>
      {/* Action buttons (back home / new analysis) */}
      {!embedded && (
        <div className="flex gap-3">
          <button onClick={handleBack}>Back Home</button>
          <button onClick={handleBack}>New Analysis</button>
        </div>
      )}
      
      {/* Report frame */}
      <div className={REPORT_SLIDE_SURFACE}>
        {/* Header: Guide title */}
        <div className="px-6 py-4 border-b">
          <p className="text-4xl font-black">Interview Strategy Guide</p>
          <p className="text-lg text-slate-400">Complete hiring intel + STAR playbook</p>
          {isSample && <SampleMark />}
        </div>
        
        {/* Top horizontal nav */}
        <nav className="px-6 py-3 border-b bg-slate-900/60 flex gap-2">
          {nav.map(item => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 ${
                tab === item.id
                  ? 'border-violet-500 bg-violet-500/10 text-violet-100'
                  : 'border-transparent text-slate-400 hover:bg-white/5'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
        
        {/* Tab content */}
        <div className="px-6 py-5">
          {tab === 'snapshot' ? (
            <LiteReportDashboard report={report} embedded language={language} />
          ) : (
            <GuideStrategyPages report={report} currentTab={tab} language={language} />
          )}
        </div>
      </div>
    </div>
  );
}
```

---

#### GuideStrategyPages 內容分頁

```tsx
export default function GuideStrategyPages({
  report,
  currentTab,
  language = 'en',
}: GuideStrategyPagesProps) {
  const lang = normalizeReportLanguage(language);
  
  switch (currentTab) {
    case 'hiring':
      return (
        <div className="space-y-6">
          {/* Page 2: Role & Team Insights */}
          <section>
            <h2 className="text-2xl font-black text-indigo-400">Role & Team Insights</h2>
            
            {/* Role content refined */}
            <div className="mt-3">
              <p className="text-lg font-bold text-slate-300">What this job actually does</p>
              <ul className="list-disc list-inside space-y-1 text-base text-slate-400">
                {report.role_team_insights?.role_content_refined.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
            
            {/* Requirements refined */}
            <div className="mt-3">
              <p className="text-lg font-bold text-slate-300">Must-have hire bar</p>
              <ul className="list-disc list-inside space-y-1 text-base text-slate-400">
                {report.role_team_insights?.requirements_refined.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
            
            {/* RTO / WLB */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-base font-bold text-emerald-400">RTO Policy (Official)</p>
                <p className="text-base text-slate-300">{report.role_team_insights?.rto_official}</p>
              </div>
              <div>
                <p className="text-base font-bold text-amber-400">Reality (Employee Voice)</p>
                <p className="text-base text-slate-300">{report.role_team_insights?.rto_employee_reality}</p>
              </div>
            </div>
            
            {/* Career path */}
            <div className="mt-4">
              <p className="text-lg font-bold text-violet-400">Next title in 1–3 years</p>
              <p className="text-xl font-black text-white">{report.role_team_insights?.next_title_1_3yr}</p>
              <p className="text-sm text-slate-500 italic">{report.role_team_insights?.career_path_basis}</p>
              
              <p className="text-base font-bold text-slate-300 mt-2">Skills to close for promotion</p>
              <ul className="list-disc list-inside space-y-1 text-base text-slate-400">
                {report.role_team_insights?.promotion_skill_gaps.map((gap, i) => (
                  <li key={i}>{gap}</li>
                ))}
              </ul>
            </div>
          </section>
          
          {/* Page 3: Company Truth */}
          <section>
            <h2 className="text-2xl font-black text-emerald-400">Company Truth & Macro Audit</h2>
            
            {/* Company overview */}
            <div className="mt-3">
              <p className="text-lg font-bold text-slate-300">What company am I walking into?</p>
              <p className="text-base text-slate-400 leading-relaxed">{report.company_truth?.company_overview}</p>
            </div>
            
            {/* Recent developments */}
            {report.company_truth?.recent_developments && report.company_truth.recent_developments.length > 0 && (
              <div className="mt-4">
                <p className="text-lg font-bold text-slate-300">Recent developments (last 12–18 months)</p>
                <ul className="space-y-3 mt-2">
                  {report.company_truth.recent_developments.map((news, i) => (
                    <li key={i} className="border-l-4 border-blue-500 pl-3">
                      <p className="text-base font-bold text-white">{news.headline}</p>
                      <p className="text-sm text-slate-400">{news.date} · {news.category}</p>
                      <p className="text-base text-slate-300 mt-1">{news.summary}</p>
                      {news.source_url && (
                        <a href={news.source_url} target="_blank" rel="noopener" className="text-sm text-blue-400 underline">
                          {news.source_name || 'Source'}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Current strategy */}
            <div className="mt-4">
              <p className="text-lg font-bold text-slate-300">What they're pushing NOW</p>
              <p className="text-base text-slate-400 leading-relaxed">{report.company_truth?.current_strategy}</p>
            </div>
            
            {/* Competitors */}
            <div className="mt-4">
              <p className="text-lg font-bold text-slate-300">Main competitors</p>
              <ul className="space-y-2 mt-2">
                {report.company_truth?.competitors.map((comp, i) => (
                  <li key={i} className="rounded-lg border border-slate-700 bg-slate-800/50 p-3">
                    <p className="text-base font-black text-white">{comp.name}</p>
                    <p className="text-sm text-emerald-400 mt-1"><strong>Strengths:</strong> {comp.strengths}</p>
                    <p className="text-sm text-amber-400 mt-1"><strong>Weaknesses:</strong> {comp.weaknesses}</p>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Insider voice */}
            <div className="mt-4">
              <p className="text-lg font-bold text-slate-300">Insider voice (Glassdoor/Blind/Reddit)</p>
              <ul className="list-disc list-inside space-y-1 text-base text-slate-400">
                {report.company_truth?.insider_voice.map((voice, i) => (
                  <li key={i}>{voice}</li>
                ))}
              </ul>
              {report.company_truth?.forum_sample_thin && (
                <p className="text-sm text-slate-500 italic mt-2">Public forum sample is thin for this employer.</p>
              )}
            </div>
            
            {/* Layoff / legal flags */}
            <div className="mt-4">
              <p className="text-lg font-bold text-red-400">Layoff / Legal flags</p>
              {report.company_truth?.layoff_legal_flags.length > 0 ? (
                <ul className="list-disc list-inside space-y-1 text-base text-slate-300">
                  {report.company_truth.layoff_legal_flags.map((flag, i) => (
                    <li key={i}>{flag}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-base text-slate-400">No significant public layoff/legal flags found.</p>
              )}
            </div>
            
            {/* Interviewer strategy questions */}
            {report.company_truth?.interviewer_strategy_questions.length > 0 && (
              <div className="mt-4">
                <p className="text-lg font-bold text-violet-400">Questions to ask the interviewer (strategy)</p>
                <ul className="list-decimal list-inside space-y-1 text-base text-slate-300">
                  {report.company_truth.interviewer_strategy_questions.map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </div>
      );
    
    case 'interview':
      return (
        <div className="space-y-6">
          {/* Concerns & Defenses */}
          <section>
            <h2 className="text-2xl font-black text-amber-400">Concerns & Defenses</h2>
            <p className="text-base text-slate-400 mt-1">3 recruiter concerns for THIS candidate vs THIS JD</p>
            
            <ul className="space-y-4 mt-3">
              {report.concerns_defenses?.map((cd, i) => (
                <li key={i} className="rounded-lg border border-amber-500/50 bg-amber-900/10 p-4">
                  <p className="text-lg font-black text-white">{i + 1}. {cd.concern}</p>
                  <div className="mt-2 space-y-2 text-base">
                    <p><strong className="text-slate-300">Why:</strong> <span className="text-slate-400">{cd.why}</span></p>
                    <p><strong className="text-emerald-400">Evidence:</strong> <span className="text-slate-300">{cd.evidence}</span></p>
                    <p><strong className="text-red-400">Missing proof:</strong> <span className="text-slate-300">{cd.missing_proof}</span></p>
                    <p><strong className="text-violet-400">Answer guide:</strong> <span className="text-slate-300">{cd.answer_guide}</span></p>
                    <p><strong className="text-amber-400">Do NOT claim:</strong> <span className="text-slate-300">{cd.do_not_claim}</span></p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
          
          {/* Interview Playbook: 5 behavioral + 5 technical */}
          <section>
            <h2 className="text-2xl font-black text-indigo-400">Interview Playbook</h2>
            <p className="text-base text-slate-400 mt-1">10 questions total (5 behavioral + 5 technical)</p>
            
            <div className="grid grid-cols-2 gap-4 mt-3">
              {/* Behavioral column */}
              <div>
                <p className="text-lg font-bold text-emerald-400">Behavioral (5)</p>
                <ul className="space-y-3 mt-2">
                  {[...report.interview_playbook.reported, ...report.interview_playbook.predicted]
                    .filter(q => q.category === 'behavioral')
                    .slice(0, 5)
                    .map((q, i) => (
                      <InterviewQuestionCard key={i} question={q} />
                    ))}
                </ul>
              </div>
              
              {/* Technical column */}
              <div>
                <p className="text-lg font-bold text-blue-400">Technical (5)</p>
                <ul className="space-y-3 mt-2">
                  {[...report.interview_playbook.reported, ...report.interview_playbook.predicted]
                    .filter(q => q.category === 'technical')
                    .slice(0, 5)
                    .map((q, i) => (
                      <InterviewQuestionCard key={i} question={q} />
                    ))}
                </ul>
              </div>
            </div>
          </section>
          
          {/* STAR Templates */}
          <section>
            <h2 className="text-2xl font-black text-violet-400">STAR Practice Templates</h2>
            <p className="text-base text-slate-400 mt-1">3–4 copy-ready STAR answers from YOUR resume</p>
            
            <ul className="space-y-4 mt-3">
              {report.interview_playbook.star_templates?.map((tmpl, i) => (
                <li key={i} className="rounded-lg border border-violet-500/50 bg-violet-900/10 p-4">
                  <p className="text-lg font-black text-white">{tmpl.title}</p>
                  {tmpl.for_question && (
                    <p className="text-sm text-slate-400 italic mt-1">For: {tmpl.for_question}</p>
                  )}
                  
                  <div className="mt-3 space-y-2 text-base">
                    <p><strong className="text-blue-400">S (Situation):</strong> <span className="text-slate-300">{tmpl.situation}</span></p>
                    <p><strong className="text-emerald-400">T (Task):</strong> <span className="text-slate-300">{tmpl.task}</span></p>
                    <p><strong className="text-amber-400">A (Action):</strong> <span className="text-slate-300">{tmpl.action}</span></p>
                    <p><strong className="text-violet-400">R (Result):</strong> <span className="text-slate-300">{tmpl.result}</span></p>
                    <p className="text-sm text-slate-500 italic mt-2">Resume anchor: {tmpl.resume_anchor}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      );
    
    case 'salary':
      return (
        <div className="space-y-6">
          {/* Offer Strategy */}
          <section>
            <h2 className="text-2xl font-black text-emerald-400">Offer Strategy</h2>
            
            <div className="grid grid-cols-3 gap-4 mt-3">
              <div className="rounded-lg border border-emerald-500 bg-emerald-900/10 p-3">
                <p className="text-base font-bold text-emerald-400">Target</p>
                <p className="text-2xl font-black text-white">{report.offer_strategy?.target}</p>
              </div>
              <div className="rounded-lg border border-blue-500 bg-blue-900/10 p-3">
                <p className="text-base font-bold text-blue-400">Acceptable</p>
                <p className="text-2xl font-black text-white">{report.offer_strategy?.acceptable}</p>
              </div>
              <div className="rounded-lg border border-red-500 bg-red-900/10 p-3">
                <p className="text-base font-bold text-red-400">Walk Away</p>
                <p className="text-2xl font-black text-white">{report.offer_strategy?.walk_away}</p>
              </div>
            </div>
            
            {/* TC breakdown */}
            {report.offer_strategy?.tc_breakdown && (
              <div className="mt-4">
                <p className="text-lg font-bold text-slate-300">Total Compensation Breakdown</p>
                <table className="w-full mt-2 text-base">
                  <tbody>
                    <tr>
                      <td className="text-slate-400">Base Salary</td>
                      <td className="text-right font-bold text-white">{report.offer_strategy.tc_breakdown.base}</td>
                    </tr>
                    {report.offer_strategy.tc_breakdown.equity && (
                      <tr>
                        <td className="text-slate-400">Equity (RSU)</td>
                        <td className="text-right font-bold text-white">{report.offer_strategy.tc_breakdown.equity}</td>
                      </tr>
                    )}
                    {report.offer_strategy.tc_breakdown.sign_on && (
                      <tr>
                        <td className="text-slate-400">Sign-on Bonus</td>
                        <td className="text-right font-bold text-white">{report.offer_strategy.tc_breakdown.sign_on}</td>
                      </tr>
                    )}
                    <tr className="border-t border-slate-700">
                      <td className="text-slate-200 font-bold">Total</td>
                      <td className="text-right font-black text-emerald-400 text-xl">{report.offer_strategy.tc_breakdown.total}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Levers */}
            <div className="mt-4">
              <p className="text-lg font-bold text-slate-300">Negotiation Levers</p>
              <ul className="space-y-2 mt-2">
                {report.offer_strategy?.structured_levers?.map((lever, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-violet-400 font-bold">{lever.name}:</span>
                    <span className="text-slate-300">{lever.note}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Negotiation script */}
            <div className="mt-4">
              <p className="text-lg font-bold text-amber-400">Negotiation Script (Copy-ready)</p>
              <div className="rounded-lg border border-amber-500/50 bg-amber-900/10 p-4 mt-2">
                <pre className="whitespace-pre-wrap text-base text-slate-200 font-mono leading-relaxed">
                  {report.offer_strategy?.script}
                </pre>
              </div>
            </div>
          </section>
        </div>
      );
    
    case 'provenance':
      return (
        <div className="space-y-6">
          <section>
            <h2 className="text-2xl font-black text-blue-400">Provenance & Citations</h2>
            <p className="text-base text-slate-400 mt-1">Backend-validated sources used in this Guide</p>
            
            {report.provenance?.entries && report.provenance.entries.length > 0 ? (
              <table className="w-full mt-3 text-base">
                <thead className="border-b border-slate-700">
                  <tr>
                    <th className="text-left text-slate-400 pb-2">Source</th>
                    <th className="text-left text-slate-400 pb-2">Date</th>
                    <th className="text-left text-slate-400 pb-2">Status</th>
                    <th className="text-left text-slate-400 pb-2">Kind</th>
                  </tr>
                </thead>
                <tbody>
                  {report.provenance.entries.map((entry, i) => (
                    <tr key={i} className="border-b border-slate-800">
                      <td className="py-2">
                        {entry.url ? (
                          <a href={entry.url} target="_blank" rel="noopener" className="text-blue-400 underline">
                            {entry.label}
                          </a>
                        ) : (
                          <span className="text-slate-300">{entry.label}</span>
                        )}
                      </td>
                      <td className="text-slate-400">{entry.date}</td>
                      <td>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          entry.status === 'valid' ? 'bg-emerald-500/20 text-emerald-400' :
                          entry.status === 'invalid' ? 'bg-red-500/20 text-red-400' :
                          'bg-slate-700 text-slate-400'
                        }`}>
                          {entry.status}
                        </span>
                      </td>
                      <td className="text-slate-400">{entry.kind}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-base text-slate-500 italic mt-3">No provenance entries available.</p>
            )}
          </section>
        </div>
      );
    
    default:
      return null;
  }
}
```

**UI 決策總結**:
- ✅ **Top horizontal nav** (非左側 sidebar) — 5 tabs: Snapshot · Hiring · Interview · Salary · Provenance
- ✅ **Snapshot tab 第一頁** — 嵌入完整 `LiteReportDashboard` (embedded mode)
- ✅ **10 interview questions** — 5 behavioral + 5 technical (2-column layout)
- ✅ **STAR templates 展開卡片** — 3-4 個，每個顯示完整 S/T/A/R + resume_anchor
- ✅ **Provenance table** — 顯示後端已驗證的 URL status (valid/invalid/unverified)
- ✅ **next_title_1_3yr 必顯示** — 加上 career_path_basis 說明來源
- ✅ **company_truth.competitors** — 顯示真實公司名 + strengths/weaknesses
- ✅ **TC breakdown table** — Base + Equity/RSU + Sign-on + Total

---

## 四、關鍵發現 & 重構建議

### ✅ 架構優勢

1. **Type-safe end-to-end** — TypeScript interfaces + Gemini structured output schema 強制對齊
2. **單一資料契約** — `FullReport = LiteReport + StrategyIntelFields` (組合而非繼承)
3. **Prompt 與 Schema 分離** — 易於獨立調整 (但目前有重複定義問題)
4. **雙層 normalization** — `parseJsonResponse` → `normalizeLiteReport` / `normalizeFullReport` → UI
5. **Career Context 注入** — 全域影響 `target_gap` + `next_title` 推估邏輯
6. **先扣點，失敗退點** — 防止 concurrent requests 超額消費
7. **Structured output 強制契約** — Gemini `responseSchema` 保證 JSON 結構

---

### ⚠️ 技術債 & 重構風險點

#### 1. Deprecated fields 遍布 (P0 清理)

**現況**:  
`types.ts` 中至少 **10+ deprecated fields** 仍在 interface 中「向下相容」，但 UI/Prompt 已不使用:

```typescript
// LiteReport 中的 deprecated
match_score: number;                           // 被 fit_score.score 取代
recruiter_verdict?: string;                    // 被 sharp_verdict 取代
one_sentence_sharp_critique?: string;          // 被 sharp_verdict_points 取代
dog_breed_archetype?: string;                  // 被 Beagle tier 名稱取代
flsa_status?: FlsaStatus;                      // 產品決策移除
radford_2026_compensation_matrix?: ...;        // 被 expected_offer 取代

// StrategyIntelFields 中的 deprecated
online_intel_warning?: string;                 // 被 hiring_context 取代
corporate_culture_blackbox?: string;           // 被 validate_before_join 取代
custom_star_interview_bank?: string[];         // 被 star_templates 取代
salary_negotiation_script?: string;            // 被 offer_strategy.script 取代
```

**風險**:
- UI 元件同時讀取新舊欄位 (fallback chain: `report.fit_score?.score ?? report.match_score`)
- 新 Prompt 可能意外產生 deprecated 欄位 (schema 未禁止)
- DB migration 未清理舊欄位，佔用空間

**建議**: 
- **Phase 1**: 審計所有 UI/Prompt，確認不再使用 deprecated
- **Phase 2**: 從 TypeScript interfaces 移除 deprecated
- **Phase 3**: DB migration 標記舊欄位 `deprecated_at` timestamp

---

#### 2. Prompt 中的 UI 指令混雜業務邏輯 (P0 分離)

**現況**:  
System Prompt 包含大量「EXACTLY 3」、「minItems: 3, maxItems: 4」等 UI 層級約束:

```
- fit_score.sharp_verdict_points: EXACTLY 3 short bullets
- concerns_defenses: EXACTLY 3 recruiter concerns
- proof_map.strengths: return 3 or 4 strongest (never fewer than 3)
- star_templates: EXACTLY 3–4
- interview_playbook: EXACTLY 5 behavioral + EXACTLY 5 technical
```

**問題**:
- **UI 變更需要修改 Prompt** — 如果產品決策改為 5 concerns，必須同步改 Prompt + Schema
- **Schema 約束與 Prompt 文字重複** — `minItems: 3` 出現在 schema，「never fewer than 3」又在 prompt 文字中
- **難以 A/B test UI variants** — UI 想顯示 4 concerns，但 Prompt 硬編碼 3

**建議**:
- **將數量約束移入 JSON Schema** — Prompt 只寫「return concerns for THIS candidate」，數量由 schema `minItems`/`maxItems` 強制
- **UI 可以獨立調整顯示** — e.g. Prompt 回傳 5 concerns，UI 只顯示前 3 個 (truncate)
- **Prompt 專注語意要求** — e.g. 「直接、基於事實、respectful」而非「exactly 3 items」

---

#### 3. Gemini schema 重複定義 (P1 統一)

**現況**:  
兩處獨立維護相同 schema:

1. `/lib/prompts/lite.ts` → `LITE_JSON_SCHEMA` (舊版，已標記 deprecated)
2. `/lib/gemini-analyze.ts` → `LITE_RESPONSE_SCHEMA` (實際使用)

**問題**:
- **容易不同步** — 改 `gemini-analyze.ts` 的 schema 但忘記同步 `prompts/lite.ts`
- **維護成本雙倍** — 任何欄位新增/移除都要改兩處

**建議**:
- **單一 source of truth** — schema 定義在 `lib/schemas/` 資料夾
- **Prompt 檔案只包含文字** — import schema from `@/lib/schemas/lite-schema.ts`
- **考慮 code generation** — 從 TypeScript interfaces 自動生成 Gemini schema (e.g. `ts-to-zod` → Zod schema → Gemini `Type`)

---

#### 4. 策略層欄位無 tier 分級 (P1 語意增強)

**現況**:  
`role_team_insights`, `company_truth` 等欄位全為 **required**，但 Prompt 允許降級內容:

```typescript
export interface RoleTeamInsights {
  team_sample_insufficient: boolean;         // TRUE → 「公開樣本不足」
  department_fallback_note?: string;         // 降級為部門整體風向
  // ...但 role_content_refined 仍為 required，即使 sample thin
}

export interface CompanyTruth {
  forum_sample_thin: boolean;                // TRUE → 「論壇聲量較少」
  // ...但 insider_voice 仍為 required array，即使 thin
}
```

**問題**:
- **Type 無法表達「降級」語意** — `team_sample_insufficient=true` 時，`role_content_refined` 仍然 required，但內容品質已降級
- **UI 難以呈現 confidence** — 無法告訴使用者「這段是推估，非公司真實資料」
- **Prompt 規則與 Type 不一致** — Prompt 說「thin sample → 降級」，但 Type 沒有 optional / tier 欄位

**建議**:
- **增加 confidence / tier 元資料**:
  ```typescript
  export interface RoleTeamInsights {
    confidence: 'high' | 'medium' | 'low';   // high = 公司真實資料, low = 市場推估
    next_title_1_3yr: string;
    career_path_basis: string;
    // ...
  }
  ```
- **UI 根據 confidence 調整顯示** — low confidence → 加上「推估自市場資料」badge

---

#### 5. UI 元件直接讀 raw report (P2 ViewModel 解耦)

**現況**:  
`LiteReportDashboard` / `GuideStrategyPages` 直接讀取 `report.fit_score?.sharp_verdict_points`:

```tsx
const summaryPoints = scoreSummaryPoints(
  report.fit_score?.sharp_verdict
    || report.recruiter_verdict          // deprecated fallback
    || report.one_sentence_sharp_critique  // deprecated fallback
    || scoreInfo.description,
  report.fit_score?.sharp_verdict_points,
);
```

**問題**:
- **UI 與資料欄位強耦合** — Prompt 改變 `sharp_verdict_points` 語意，UI 會失效
- **多重 fallback 難以測試** — 4 層 fallback (`sharp_verdict` → `recruiter_verdict` → `one_sentence_sharp_critique` → `scoreInfo.description`)
- **難以 A/B test UI variants** — 想顯示不同格式的 summary，必須修改 UI 邏輯

**建議**:
- **引入 ViewModel 層**:
  ```typescript
  // lib/viewmodels/lite-report-vm.ts
  export function toLiteReportViewModel(report: LiteReport): LiteReportVM {
    return {
      jobTitle: report.job_title,
      fitScore: {
        value: report.fit_score.score,
        tier: getScoreTier(report.fit_score.score),
        summaryPoints: report.fit_score.sharp_verdict_points || fallbackSummary(report),
        breakdown: report.fit_score.breakdown.map(normalizeBreakdown),
      },
      // ...
    };
  }
  ```
- **UI 只讀 ViewModel** — 與 raw report 解耦，易於測試
- **ViewModel 負責 fallback / normalization** — UI 邏輯更乾淨

---

#### 6. Provenance 驗證外包，前端無法 re-validate (P2 增強)

**現況**:  
後端驗證 URL 後僅回傳 `status: 'valid' | 'invalid' | 'unverified'`，前端只能顯示 badge:

```typescript
export interface ProvenanceEntry {
  label: string;
  url: string;
  date: string;
  status: ProvenanceStatus;  // 'valid' | 'invalid' | 'unverified'
  kind: 'offer' | 'hiring' | 'interview';
}
```

**問題**:
- **無法顯示失敗原因** — URL invalid 但不知道為什麼 (404? timeout? paywall?)
- **前端無法 re-validate** — 使用者點擊 invalid URL 時，無法觸發 retry
- **無法手動覆蓋** — 如果後端驗證錯誤 (false negative)，前端無法修正

**建議**:
- **增加 validation_error 欄位**:
  ```typescript
  export interface ProvenanceEntry {
    status: ProvenanceStatus;
    validation_error?: string;  // e.g. "HTTP 404", "Paywall detected", "Timeout"
    validated_at: string;        // ISO timestamp
  }
  ```
- **前端提供 re-validate 按鈕** — 呼叫 `/api/provenance/validate?url=...` 重新檢查
- **允許手動標記 valid** — Admin 工具可以 override backend 驗證結果

---

### 💡 重構優先級建議

| 優先級 | 項目 | 影響範圍 | 預估工時 |
|-------|-----|---------|---------|
| **P0** | 清理 deprecated fields，統一 types.ts 與實際使用欄位 | Types, UI, DB schema | 2 days |
| **P0** | 將 Prompt 中的 UI 指令（如「EXACTLY 3」）抽離為 Schema constraint | Prompts, Schema | 1 day |
| **P1** | 統一 JSON Schema 定義來源（考慮 code generation） | Schema, Prompts | 2 days |
| **P1** | 策略層欄位增加 `confidence` / `tier` 元資料 | Types, Prompt, UI | 3 days |
| **P2** | UI 元件改為讀 normalized ViewModel 而非直接讀 raw report | UI refactor | 5 days |
| **P2** | Provenance 增加 validation_error + re-validate API | Backend, UI | 2 days |
| **P1** | 建立 Prompt ↔ Schema ↔ UI 的 **contract tests** | Tests | 3 days |

**Total 預估**: 18 days (3 週 sprint)

---

## 五、檔案清單總覽

### Types & Schema
- **`/types.ts`** (680 lines) — 所有 TypeScript interfaces (LiteReport, FullReport, 子結構)
- **`/lib/prompts/lite.ts`** (242 lines) — Snapshot system prompt + deprecated JSON schema
- **`/lib/prompts/full.ts`** (386 lines) — Guide system prompt + deprecated JSON schema
- **`/lib/gemini-analyze.ts`** (600+ lines) — 實際使用的 Gemini response schemas + 呼叫邏輯

### API & Logic
- **`/app/api/analyze/route.ts`** (450 lines) — POST endpoint (auth, rate limit, deduct credit, call Gemini, save report)
- **`/lib/gemini-analyze.ts`** — executeLiteAnalysis / executeFullAnalysis 封裝
- **`/lib/normalize-lite-report.ts`** — 後處理正規化 (deprecated fallback, score bounds)
- **`/lib/career-context.ts`** — Career Context 注入邏輯 (target_tc floors)
- **`/lib/profiles.ts`** — Profile CRUD, credit deduct/refund, Sybil checks
- **`/constants/models.ts`** — Model names + token limits

### UI Components
- **`/components/LiteReportDashboard.tsx`** (550+ lines) — Snapshot 單頁 slide 渲染
- **`/components/FullReportDashboard.tsx`** (180 lines) — Guide 外殼 + top horizontal nav
- **`/components/guide/GuideStrategyPages.tsx`** (800+ lines) — Guide 5 tab 內容 (Hiring / Interview / Salary / Provenance)
- **`/components/PredictedLandSquircle.tsx`** — Salary predicted land 圓框元件
- **`/components/guide/GuideSlideChrome.tsx`** — Guide 報告框架 (已移除，改用 FullReportDashboard)

### Utilities
- **`/lib/payload.ts`** — Extension handoff 解析 (decodeExtensionPayload, payloadToPreFlightData)
- **`/lib/prompt-injection-guard.ts`** — 反 prompt injection (withUntrustedContentPolicy, wrapUntrusted)
- **`/lib/offer-display.ts`** — Salary formatting (formatOfferRange, formatPredictedOffer)
- **`/lib/beagle-tiers.ts`** — Score → Beagle tier 映射 (Diamond/Gold/Silver/Copper)
- **`/lib/report-ui-copy.ts`** — 多語系 UI 文案 (getSnapshotUiCopy, getGuideUiCopy)

---

## 六、總結

### 現有架構的核心設計

1. **雙產品單 codebase** — Snapshot (Flash-Lite, closed-book) + Guide (Pro, grounding) 共享 types + 大部分 UI
2. **Structured output 強制契約** — Gemini `responseSchema` 保證 JSON 結構，減少 parsing 錯誤
3. **先扣點機制** — 防止 concurrent overspend，失敗退點
4. **Career Context 全域注入** — 影響 `target_gap` (薪資評估) + `next_title` 推估

### 重構前必須回答的問題

1. **Deprecated fields 何時移除？** — 需要確認所有歷史報告 (DB `analysis_reports` table) 是否仍依賴舊欄位
2. **UI 數量約束是否固定？** — 如果產品決策可能改變「3 concerns」→「5 concerns」，架構需支援動態配置
3. **Prompt 與 Schema 誰是 source of truth？** — 目前兩者都有約束，需統一
4. **ViewModel 層是否必要？** — 如果 UI variants 很多 (A/B test, 多語系 layout)，ViewModel 可解耦；否則可能 over-engineering
5. **Provenance 驗證是否需要前端可控？** — 如果使用者可以「回報錯誤」，需要更強的驗證 API

### 建議的重構步驟

1. **Phase 1: Contract Alignment** (1 週)
   - 清理 deprecated fields
   - 統一 Schema 定義來源
   - 建立 contract tests (Prompt ↔ Schema ↔ UI)

2. **Phase 2: Separation of Concerns** (1 週)
   - 將 Prompt UI 指令移入 Schema
   - 策略層增加 confidence 元資料
   - Provenance 增加 validation_error

3. **Phase 3: ViewModel Layer (Optional)** (1 週)
   - 引入 ViewModel 解耦 UI 與 raw report
   - 重構 UI 元件讀取 ViewModel

**Total**: 2–3 週可完成核心重構，第 3 週可選擇性執行 ViewModel 層。

---

**報告完畢**。以上完整架構現況可直接交付架構師評估重構範圍與風險。
