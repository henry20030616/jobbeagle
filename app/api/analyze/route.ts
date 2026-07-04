import { NextRequest, NextResponse } from 'next/server';
import { InterviewReport, UserInputs } from '@/types';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import mammoth from 'mammoth';
import { createHash } from 'crypto';
import { GEMINI_ANALYSIS_MODEL } from '@/constants/models';
import {
  isReportPremiumUnlocked,
  maskPremiumReportFields,
} from '@/lib/report-masking';

const GUEST_DAILY_LIMIT = 2;
const USER_DAILY_LIMIT = 2;

type QuotaSource = 'daily' | 'bonus';

function getAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !supabaseUrl) return null;
  return createAdminClient(supabaseUrl, serviceKey);
}

function paymentRequiredMessage(
  reportLanguage: string,
  isLoggedIn: boolean,
): string {
  const loginHint =
    reportLanguage === 'zh-TW'
      ? '登入可永久保存報告，或付費解鎖進階分析。'
      : reportLanguage === 'zh-CN'
        ? '登录可永久保存报告，或付费解锁进阶分析。'
        : reportLanguage === 'es'
          ? 'Inicia sesión para guardar informes o paga para desbloquear análisis avanzado.'
          : reportLanguage === 'hi'
            ? 'रिपोर्ट सहेजने या उन्नत विश्लेषण के लिए लॉग इन करें या भुगतान करें।'
            : reportLanguage === 'ar'
              ? 'سجّل الدخول لحفظ التقارير أو ادفع لفتح التحليل المتقدم.'
              : 'Log in to save reports or pay to unlock advanced analysis.';

  if (reportLanguage === 'zh-TW') {
    return isLoggedIn
      ? '今日免費額度與獎勵額度皆已用完。請付費解鎖或明天再試。'
      : `今日 ${GUEST_DAILY_LIMIT} 次免費分析已用完。${loginHint}`;
  }
  if (reportLanguage === 'zh-CN') {
    return isLoggedIn
      ? '今日免费额度与奖励额度皆已用完。请付费解锁或明天再试。'
      : `今日 ${GUEST_DAILY_LIMIT} 次免费分析已用完。${loginHint}`;
  }
  if (reportLanguage === 'es') {
    return isLoggedIn
      ? 'Has agotado el límite diario y los créditos de bonificación. Paga para desbloquear o inténtalo mañana.'
      : `Has usado los ${GUEST_DAILY_LIMIT} análisis gratuitos de hoy. ${loginHint}`;
  }
  if (reportLanguage === 'hi') {
    return isLoggedIn
      ? 'दैनिक सीमा और बोनस क्रेडिट समाप्त। अनलॉक के लिए भुगतान करें या कल पुनः प्रयास करें।'
      : `आज के ${GUEST_DAILY_LIMIT} मुफ़्त विश्लेषण समाप्त। ${loginHint}`;
  }
  if (reportLanguage === 'ar') {
    return isLoggedIn
      ? 'لقد استنفدت الحد اليومي وائتمانات المكافأة. ادفع للفتح أو حاول غدًا.'
      : `لقد استخدمت كل ${GUEST_DAILY_LIMIT} تحليلات مجانية لليوم. ${loginHint}`;
  }
  return isLoggedIn
    ? 'Daily free limit and bonus credits exhausted. Pay to unlock or try again tomorrow.'
    : `You have used all ${GUEST_DAILY_LIMIT} free analyses for today. ${loginHint}`;
}

async function getBonusCredits(userId: string): Promise<number> {
  const admin = getAdminClient();
  if (!admin) return 0;

  const { data, error } = await admin
    .from('user_rewards')
    .select('bonus_credits')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('⚠️ [Quota] bonus_credits read error:', error.message);
    return 0;
  }
  return data?.bonus_credits ?? 0;
}

/** Returns remaining bonus credits, or -1 on failure. */
async function decrementBonusCredit(userId: string): Promise<number> {
  const admin = getAdminClient();
  if (!admin) return -1;

  const { data, error } = await admin.rpc('decrement_bonus_credit', {
    p_user_id: userId,
  });

  if (error) {
    console.error('⚠️ [Quota] bonus_credits decrement error:', error.message);
    return -1;
  }
  return typeof data === 'number' ? data : -1;
}

function hashIP(ip: string): string {
  return createHash('sha256').update(ip + 'jb_rl_salt').digest('hex').substring(0, 24);
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}

/** 只檢查額度，不扣計數（避免 AI 失敗也消耗免費次數） */
async function checkUsage(
  limitKey: string,
  dailyLimit: number,
): Promise<{ allowed: boolean; remaining: number; currentCount: number; configError?: boolean; dbError?: boolean }> {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !supabaseUrl) {
    console.error('❌ [RateLimit] SUPABASE_SERVICE_ROLE_KEY not set — cannot enforce quota');
    return { allowed: false, remaining: 0, currentCount: dailyLimit, configError: true };
  }

  const admin = createAdminClient(supabaseUrl, serviceKey);
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await admin
    .from('usage_limits')
    .select('count')
    .eq('ip_hash', limitKey)
    .eq('date', today)
    .maybeSingle();

  if (error) {
    console.error('❌ [RateLimit] DB read error:', error.message);
    return { allowed: false, remaining: 0, currentCount: 0, dbError: true };
  }

  const currentCount = data?.count ?? 0;
  if (currentCount >= dailyLimit) {
    return { allowed: false, remaining: 0, currentCount };
  }
  return { allowed: true, remaining: dailyLimit - currentCount, currentCount };
}

/** AI 成功回應後才呼叫，真正扣計數 */
async function incrementUsage(limitKey: string, currentCount: number): Promise<boolean> {
  const admin = getAdminClient();
  if (!admin) {
    console.error('❌ [RateLimit] increment skipped — no admin client');
    return false;
  }
  const today = new Date().toISOString().split('T')[0];

  const { error: upsertError } = await admin
    .from('usage_limits')
    .upsert(
      { ip_hash: limitKey, date: today, count: currentCount + 1, updated_at: new Date().toISOString() },
      { onConflict: 'ip_hash,date' }
    );

  if (upsertError) {
    console.error('❌ [RateLimit] DB write error:', upsertError.message, upsertError.details);
    return false;
  }
  return true;
}

// 設定最大執行時間（雖然 Vercel 免費版由平台控制，但這行可以提醒 Next.js 不要太早斷開）
export const maxDuration = 60; 

const SYSTEM_INSTRUCTION = `
# Role: Global VP of HR & JobBeagle Tier Integration
You combine: (1) Global Headhunter / Senior HR Director rigor, (2) Career & industry expertise. You do NOT inflate scores. Most real candidates land **55–72**; **85+** is rare.

# Task
Analyze the Job Description (JD) and Resume. Produce a **Winning Strategy Report** JSON. Be concise except **market_analysis.industry_trends** (may be detailed).

**CRITICAL SEARCH**: Use Google Search for interview intel, salary benchmarks, company news (last ~24 months where relevant).

---

# JobBeagle Match Score — MANDATORY FORMULA (50–100 only)

**Total score = base + S + E + I + F** (integer). **Must equal** the sum exactly.

| Component | Max pts | Definition |
|-----------|---------|------------|
| **base** | **50** (fixed) | Starting point — everyone starts at 50. |
| **S** (hard_skills_S) | **0–15** | ATS / keyword & hard-skill overlap between JD and resume (tools, stack, certifications). |
| **E** (experience_E) | **0–15** | Depth of relevant roles, progression, scope vs JD seniority. |
| **I** (impact_metrics_I) | **0–10** | **MUST be 0** if the resume has **no verifiable quantified outcomes** (%, revenue, users, headcount, timeline metrics, etc.). Only award points when numbers/metrics are explicit. |
| **F** (culture_fit_F) | **0–10** | Industry + culture/values alignment signals from resume vs JD. |

**Calibration (strict HR)**  
- Default conservative: do not cluster scores at 80–95.  
- Weak overlap → total often **50–62**. Solid but not exceptional → **63–78**. Strong → **79–88**. Exceptional, evidence-heavy → **89–100**.

---

# dog_type & recruiter_insight (MANDATORY)

After computing \`score\`, set \`dog_type\` and \`recruiter_insight\` from **score** (use output language for tier names and insight text):

**If output is Traditional Chinese:**  
- **90–100** → \`dog_type\`: **鑽石米格魯** — HR: Immediate Fit, ready now / leadership signal. Insight: **極度肯定**；點出「萬中選一」級別的依據（具體對應 JD 與履歷證據）。  
- **75–89** → \`dog_type\`: **黃金米格魯** — Strong candidate, interview shortlist. Insight: **專業認可** + 綠旗 + **一條**可畫龍點睛的優化建議。  
- **60–74** → \`dog_type\`: **白銀米格魯** — Potential match; ATS 看來平庸、亮點不足。Insight: **中肯**指出「技術/經歷有基礎但缺數據或差異化」。  
- **<60** (50–59) → \`dog_type\`: **青銅米格魯** — Significant gap. Insight: **痛點分析**；明說在 HR **約 6 秒**掃描下會被刷掉的原因（具體、不客套）。

**If output is English:** use tier names: **Diamond Beagle**, **Gold Beagle**, **Silver Beagle**, **Bronze Beagle** — same HR logic, same tone rules.

\`recruiter_insight\`: **2–4 sentences**, senior-recruiter voice — **not** generic cheerleading. Must reference concrete JD vs resume evidence.

---

# Match narrative (concise)

1. **matching_points**: 3–5 brief items (strengths tied to S/E/F).  
2. **skill_gaps**: 3–5 brief gaps (what blocks a higher score).  
3. Align narrative **strictly** with \`score_components\` (no contradiction).

---

# Other sections (brief except industry_trends)

- **Salary**: MUST give a numeric range (no 面議-only).  
- **Moat, competition, reviews**: follow depth rules above.

---

# Interview Preparation — **MANDATORY: EXACTLY 10 QUESTIONS**

\`interview_preparation.questions\` MUST be a JSON array of **exactly 10** objects — **not 2, not 5, not 9 — ten (10)**. Incomplete lists are INVALID output.

**Order & labeling (use output language for prefixes):**
- **Questions 1–5 (index 0–4):** Technical / role-competency / domain-specific.  
  - Chinese: prefix each \`question\` string with \`[技術面]\`.  
  - English: prefix with \`[Technical]\`.
- **Questions 6–10 (index 5–9):** Behavioral / leadership / situational.  
  - Chinese: prefix with \`[行為面]\`.  
  - English: prefix with \`[Behavioral]\`.

**Each object MUST include:**
- \`question\`: realistic, JD-aligned, personalized to the candidate's resume (companies, roles, metrics when present).
- \`source\`: one sentence — why this question matters for this role.
- \`answer_guide\`: **must** personalize; Traditional Chinese answers start with \`回答建議：\`; English with \`Answer suggestion:\` or equivalent; reference resume specifics.

Keep each \`answer_guide\` to **2–4 sentences** so all **10** items fit; do not skip questions to save length.

# Output Format (JSON) — include ALL fields

{
  "basic_analysis": {
    "job_title": "Full Professional Job Title",
    "company_overview": "BRIEF analysis. 2-3 bullet points maximum.",
    "business_scope": "CONCISE breakdown. 2-3 bullet points maximum.",
    "company_trends": "BRIEF strategic shifts. 2-3 bullet points maximum.",
    "job_summary": "CONCISE decoding of JD demands. 2-3 bullet points maximum.",
    "hard_requirements": ["Mandatory technical or certification requirements"]
  },
  "salary_analysis": {
    "estimated_range": "MUST be specific numbers. E.g., '1.8M - 2.5M TWD (年薪)' or '80K - 120K TWD (月薪)'. NEVER use '面議' or vague terms.",
    "market_position": "BRIEF objective ranking (1 sentence).",
    "negotiation_tip": "CONCISE tactics. 2-3 bullet points maximum.",
    "rationale": "BRIEF data-driven logic explaining how you calculated the salary range. 2-3 bullet points maximum."
  },
  "market_analysis": {
    "industry_trends": "簡介: [DETAILED allowed] \\n 現況與趨勢: [DETAILED allowed]",
    "positioning": "BRIEF strategic assessment (1 sentence).",
    "competition_table": [
       {"name": "Competitor (Include Target Co)", "strengths": "BRIEF (1 sentence)", "weaknesses": "BRIEF (1 sentence)"}
    ],
    "key_advantages": [{"point": "Advantage", "description": "BRIEF (1-2 sentences maximum)"}],
    "potential_risks": [{"point": "Risk", "description": "BRIEF (1-2 sentences maximum)"}]
  },
  "reviews_analysis": {
    "company_reviews": { "summary": "CONCISE cultural analysis. 3-4 bullet points maximum.", "pros": [], "cons": [] },
    "job_reviews": { "summary": "CONCISE process/difficulty breakdown. 3-4 bullet points maximum.", "pros": [], "cons": [] },
    "real_interview_questions": [
      {
         "question": "Actual question text",
         "job_title": "Format: [Company] [Position]",
         "year": "Format: [[Source] YYYY.MM]",
         "source_url": "URL"
      }
    ]
  },
  "match_analysis": {
    "score": 72,
    "score_components": {
      "base": 50,
      "hard_skills_S": 8,
      "experience_E": 7,
      "impact_metrics_I": 4,
      "culture_fit_F": 3
    },
    "dog_type": "白銀米格魯",
    "recruiter_insight": "2-4 sentences, senior HR tone, evidence-based.",
    "matching_points": [{"point": "Fit", "description": "BRIEF (1-2 sentences)"}],
    "skill_gaps": [{"gap": "Gap", "description": "BRIEF (1-2 sentences)"}]
  },
  "interview_preparation": {
    "questions": [
      {"question": "[技術面] or [Technical] Q1 …", "source": "Why this question (1 sentence).", "answer_guide": "回答建議：…"},
      {"question": "[技術面] Q2 …", "source": "…", "answer_guide": "回答建議：…"},
      {"question": "[技術面] Q3 …", "source": "…", "answer_guide": "回答建議：…"},
      {"question": "[技術面] Q4 …", "source": "…", "answer_guide": "回答建議：…"},
      {"question": "[技術面] Q5 …", "source": "…", "answer_guide": "回答建議：…"},
      {"question": "[行為面] or [Behavioral] Q6 …", "source": "…", "answer_guide": "回答建議：…"},
      {"question": "[行為面] Q7 …", "source": "…", "answer_guide": "回答建議：…"},
      {"question": "[行為面] Q8 …", "source": "…", "answer_guide": "回答建議：…"},
      {"question": "[行為面] Q9 …", "source": "…", "answer_guide": "回答建議：…"},
      {"question": "[行為面] Q10 …", "source": "…", "answer_guide": "回答建議：…"}
    ]
  },
  "references": {
    "deep_research": [{"title": "Title", "url": "URL"}],
    "data_citations": [{"title": "Source", "url": "URL"}]
  }
}

# CRITICAL JSON FORMAT REQUIREMENTS
1. Valid JSON only. No markdown fences. No trailing commas.
2. **match_analysis.score** MUST equal **50 + hard_skills_S + experience_E + impact_metrics_I + culture_fit_F**.
3. **impact_metrics_I = 0** when no quantified resume evidence.
4. **market_analysis** must use the key **potential_risks** (exact spelling).
5. **interview_preparation.questions** MUST have length **exactly 10** (ten array elements).
6. Complete structure with ALL required fields.
`;

function clampInt(n: unknown, lo: number, hi: number): number {
  const x = Math.round(Number(n));
  if (Number.isNaN(x)) return lo;
  return Math.max(lo, Math.min(hi, x));
}

/** Allocate bonus (0–50) into S/E/I/F caps: 15+15+10+10 */
function allocateBonusToComponents(bonus: number): { S: number; E: number; I: number; F: number } {
  let rem = clampInt(bonus, 0, 50);
  const S = Math.min(15, rem);
  rem -= S;
  const E = Math.min(15, rem);
  rem -= E;
  const I = Math.min(10, rem);
  rem -= I;
  const F = Math.min(10, rem);
  return { S, E, I, F };
}

function dogTypeFromScore(score: number, lang: 'zh' | 'en'): string {
  if (lang === 'en') {
    if (score >= 90) return 'Diamond Beagle';
    if (score >= 75) return 'Gold Beagle';
    if (score >= 60) return 'Silver Beagle';
    return 'Bronze Beagle';
  }
  if (score >= 90) return '鑽石米格魯';
  if (score >= 75) return '黃金米格魯';
  if (score >= 60) return '白銀米格魯';
  return '青銅米格魯';
}

/** Enforce 50–100 formula, score_components, dog_type, recruiter_insight; fix common JSON key typos */
function normalizeReport(report: any, lang: 'zh' | 'en'): void {
  if (report?.market_analysis?.potential_risis && !report.market_analysis.potential_risks) {
    report.market_analysis.potential_risks = report.market_analysis.potential_risis;
    delete report.market_analysis.potential_risis;
  }

  const ma = report?.match_analysis;
  if (!ma) return;

  const base = 50;
  let S = clampInt(ma.score_components?.hard_skills_S, 0, 15);
  let E = clampInt(ma.score_components?.experience_E, 0, 15);
  let I = clampInt(ma.score_components?.impact_metrics_I, 0, 10);
  let F = clampInt(ma.score_components?.culture_fit_F, 0, 10);

  const hasNumericComponents =
    ma.score_components &&
    typeof ma.score_components.hard_skills_S === 'number' &&
    typeof ma.score_components.experience_E === 'number' &&
    typeof ma.score_components.impact_metrics_I === 'number' &&
    typeof ma.score_components.culture_fit_F === 'number';

  if (!hasNumericComponents) {
    const rawScore = clampInt(ma.score, 50, 100);
    const bonus = rawScore - base;
    const a = allocateBonusToComponents(bonus);
    S = a.S;
    E = a.E;
    I = a.I;
    F = a.F;
  }

  ma.score_components = {
    base,
    hard_skills_S: S,
    experience_E: E,
    impact_metrics_I: I,
    culture_fit_F: F,
  };
  ma.score = clampInt(base + S + E + I + F, 50, 100);

  const s = ma.score as number;
  if (!ma.dog_type || typeof ma.dog_type !== 'string' || !String(ma.dog_type).trim()) {
    ma.dog_type = dogTypeFromScore(s, lang);
  }
  if (!ma.recruiter_insight || String(ma.recruiter_insight).trim().length < 8) {
    ma.recruiter_insight =
      lang === 'en'
        ? `Tier ${ma.dog_type} (${s}/100): Alignment follows the JobBeagle formula (base 50 + skills + experience + quantified impact + fit). See matching_points and skill_gaps for evidence.`
        : `等級 ${ma.dog_type}（${s}/100 分）：依 JobBeagle 公式（底分 50 + 硬技能 S + 經驗 E + 量化 I + 契合 F）評定，細節見優勢與缺口。`;
  }
  if (!Array.isArray(ma.matching_points)) ma.matching_points = [];
  if (!Array.isArray(ma.skill_gaps)) ma.skill_gaps = [];

  const ip = report.interview_preparation;
  if (ip && Array.isArray(ip.questions) && ip.questions.length !== 10) {
    console.warn(
      `[normalizeReport] interview_preparation.questions length=${ip.questions.length}, expected 10 — model may have truncated; check maxOutputTokens / prompt.`,
    );
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('🚀 [API Start] 開始處理分析請求');

  try {
    const body: UserInputs = await request.json();
    const { jobDescription, resume, language: reportLanguage = 'en' } = body;

    console.log(`📦 [Data Received] JD 長度: ${jobDescription?.length}, Resume 類型: ${resume?.type}, 報告語言: ${reportLanguage}`);

    // 依介面選擇的語言強制報告產出語言（與輸入的 JD/履歷語言無關）
    const LANG_INSTRUCTIONS: Record<string, string> = {
      en:    `\n\n# OUTPUT LANGUAGE (MANDATORY)\nYou MUST write the ENTIRE report in English only. All JSON field values must be in English. Ignore input language.\nFor match_analysis.dog_type use: **Diamond Beagle**, **Gold Beagle**, **Silver Beagle**, **Bronze Beagle**.\n`,
      'zh-TW': `\n\n# OUTPUT LANGUAGE (MANDATORY)\nYou MUST write the ENTIRE report in Traditional Chinese (繁體中文) only. All JSON field values must be in 繁體中文. Ignore input language.\nFor match_analysis.dog_type use: **鑽石米格魯** / **黃金米格魯** / **白銀米格魯** / **青銅米格魯**.\n`,
      'zh-CN': `\n\n# OUTPUT LANGUAGE (MANDATORY)\nYou MUST write the ENTIRE report in Simplified Chinese (简体中文) only. All JSON field values must be in 简体中文. Ignore input language.\nFor match_analysis.dog_type use: **钻石猎犬** / **黄金猎犬** / **白银猎犬** / **青铜猎犬**.\n`,
      es:    `\n\n# OUTPUT LANGUAGE (MANDATORY)\nYou MUST write the ENTIRE report in Spanish (Español) only. All JSON field values must be in Spanish. Ignore input language.\nFor match_analysis.dog_type use: **Beagle Diamante**, **Beagle Dorado**, **Beagle Plateado**, **Beagle Bronce**.\n`,
      hi:    `\n\n# OUTPUT LANGUAGE (MANDATORY)\nYou MUST write the ENTIRE report in Hindi (हिन्दी) only. All JSON field values must be in Hindi. Ignore input language.\nFor match_analysis.dog_type use: **डायमंड बीगल**, **गोल्ड बीगल**, **सिल्वर बीगल**, **ब्रॉन्ज़ बीगल**.\n`,
      ar:    `\n\n# OUTPUT LANGUAGE (MANDATORY)\nYou MUST write the ENTIRE report in Arabic (العربية) only. All JSON field values must be in Arabic. Ignore input language.\nFor match_analysis.dog_type use: **بيغل ماسي**, **بيغل ذهبي**, **بيغل فضي**, **بيغل برونزي**.\n`,
    };
    const OUTPUT_LANGUAGE_INSTRUCTION = LANG_INSTRUCTIONS[reportLanguage] ?? LANG_INSTRUCTIONS['en'];

    if (!jobDescription || !resume) {
      return NextResponse.json(
        { error: 'Missing required fields: jobDescription and resume' },
        { status: 400 }
      );
    }

    // ── Rate Limiting & Quota ─────────────────────────────────────────────────
    const supabase = await createClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    const isLoggedIn = !!currentUser;
    const dailyLimit = isLoggedIn ? USER_DAILY_LIMIT : GUEST_DAILY_LIMIT;
    const limitKey = isLoggedIn
      ? hashIP(`user_${currentUser!.id}`)
      : hashIP(getClientIP(request));

    let rateLimitCurrentCount = 0;
    let quotaSource: QuotaSource = 'daily';
    let bonusCredits = 0;

    console.log(`🔒 [RateLimit] ${isLoggedIn ? '已登入用戶' : 'Guest'} limit=${dailyLimit}, key=${limitKey.substring(0, 8)}...`);

    const { allowed, remaining, currentCount, configError, dbError } = await checkUsage(limitKey, dailyLimit);
    rateLimitCurrentCount = currentCount;

    if (configError || dbError) {
      return NextResponse.json(
        {
          error: 'Server configuration error: quota service unavailable',
          errorCode: 'SERVER_CONFIG',
        },
        { status: 503 },
      );
    }

    if (!allowed) {
      if (isLoggedIn) {
        bonusCredits = await getBonusCredits(currentUser!.id);
        if (bonusCredits > 0) {
          quotaSource = 'bonus';
          console.log(`🎁 [Quota] Daily exhausted; using bonus_credits (${bonusCredits} left)`);
        } else {
          console.warn(`🚫 [Quota] Payment required: ${limitKey.substring(0, 8)}...`);
          return NextResponse.json(
            {
              error: paymentRequiredMessage(reportLanguage, true),
              errorCode: 'PAYMENT_REQUIRED',
              bonusCredits: 0,
              resetTime: 'tomorrow',
            },
            { status: 402 },
          );
        }
      } else {
        console.warn(`🚫 [Quota] Guest payment required: ${limitKey.substring(0, 8)}...`);
        return NextResponse.json(
          {
            error: paymentRequiredMessage(reportLanguage, false),
            errorCode: 'PAYMENT_REQUIRED',
            resetTime: 'tomorrow',
          },
          { status: 402 },
        );
      }
    } else {
      console.log(`✅ [RateLimit] Allowed via daily quota. Remaining today: ${remaining}`);
    }
    // ── End Rate Limiting ─────────────────────────────────────────────────────

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      console.error('❌ [Config Error] 找不到 GEMINI_API_KEY');
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }
    console.log('🔑 [Config] API Key 存在 (已遮罩)');
    console.log('🔑 [Config] API Key 長度:', apiKey.length);
    console.log('🔑 [Config] API Key 前綴:', apiKey.substring(0, 10) + '...');

    let baseJD = jobDescription.trim();
    const match104 = baseJD.match(/104\.com\.tw\/job\/(\w+)/);
    const matchLinkedIn = baseJD.match(/linkedin\.com\/.*currentJobId=(\d+)/) || baseJD.match(/linkedin\.com\/jobs\/view\/(\d+)/);

    let systemHint = "";
    if (match104) systemHint = `\n[SYSTEM_HINT]: 104 Job ID: ${match104[1]}`;
    else if (matchLinkedIn) systemHint = `\n[SYSTEM_HINT]: LinkedIn Job ID: ${matchLinkedIn[1]}`;

    const userParts: any[] = [
      { text: `[CONTEXT: JD ANALYSIS]\n\n${baseJD}${systemHint}` }
    ];

    // Word (.doc/.docx) 無法作為 inlineData 送給 Gemini（會回傳 "The document has no pages"），改為先轉成純文字
    const isWordMime = resume.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      resume.mimeType === 'application/msword';
    const isWordFile = resume.type === 'file' && (isWordMime || resume.fileName?.toLowerCase().endsWith('.docx') || resume.fileName?.toLowerCase().endsWith('.doc'));

    if (resume.type === 'file' && isWordFile && typeof resume.content === 'string') {
      try {
        const buffer = Buffer.from(resume.content, 'base64');
        const { value: resumeText } = await mammoth.extractRawText({ buffer });
        const text = (resumeText || '').trim();
        if (!text) {
          console.warn('⚠️ [Docx] 提取到的文字為空');
          return NextResponse.json(
            { error: '無法從 Word 檔案中讀取到文字，請改為上傳 PDF 或貼上履歷文字。' },
            { status: 400 }
          );
        }
        console.log(`📄 [Docx] 已從 Word 提取文字，長度: ${text.length}`);
        userParts.push({ text: `=== RESUME ===\n${text}` });
      } catch (docxError: any) {
        console.error('❌ [Docx] 解析失敗:', docxError);
        return NextResponse.json(
          { error: '無法解析 Word 檔案，請改為上傳 PDF 或貼上履歷文字。' },
          { status: 400 }
        );
      }
    } else if (resume.type === 'file' && resume.mimeType === 'application/pdf') {
      userParts.push({ inlineData: { data: resume.content, mimeType: resume.mimeType } });
    } else {
      userParts.push({ text: `=== RESUME ===\n${resume.content}` });
    }

    // 使用全域配置的 Gemini 模型
    const model = GEMINI_ANALYSIS_MODEL;
    console.log(`📋 [Gemini] 使用模型: ${model}`);

    // 使用 response_mime_type 確保返回純 JSON（付費帳號支援）；依介面語言附加輸出語言指示
    const requestBodyTemplate: any = {
      system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION + OUTPUT_LANGUAGE_INSTRUCTION }] },
      contents: [{ parts: userParts }],
      generationConfig: { 
        temperature: 0.3,
        maxOutputTokens: 8192,
        response_mime_type: "application/json", // 確保返回純 JSON，避免解析問題
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      ],
    };

    let text = "";

    // 使用 v1beta API
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    console.log(`🤖 [Gemini] 使用模型: ${model} (v1beta API)`);
    console.log(`🔗 [Gemini] URL: ${url.replace(apiKey, 'API_KEY_HIDDEN')}`);

    const fetchStartTime = Date.now();
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBodyTemplate),
    });

    const fetchDuration = (Date.now() - fetchStartTime) / 1000;
    console.log(`⏱️ [Gemini] ${model} 回應時間: ${fetchDuration}秒, Status: ${response.status}`);

    // 如果是 401，说明 API Key 有问题
    if (response.status === 401) {
      console.error(`❌ [Gemini] API Key 無效或過期 (401)`);
      throw new Error('Gemini API Key 無效或過期，請檢查環境變數 GEMINI_API_KEY');
    }

    // 如果是 403，说明权限不足
    if (response.status === 403) {
      console.error(`❌ [Gemini] 權限不足 (403)`);
      throw new Error('Gemini API 權限不足，請檢查 API Key 權限或帳號限制');
    }

    // 如果是 429，配額用盡，使用指數退避重試
    if (response.status === 429) {
      const errorText = await response.text();
      console.warn(`⚠️ [Gemini 429] 配額用盡，嘗試指數退避重試...`);
      
      // 指數退避：5秒、10秒、20秒，最多重試3次
      const maxRetries = 3;
      let retryDelay = 5000; // 5秒
      let lastError: Error | null = null;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        console.log(`🔄 [Gemini 429] 第 ${attempt}/${maxRetries} 次重試，等待 ${retryDelay/1000} 秒...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        
        try {
          const retryResponse = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBodyTemplate),
          });

          if (retryResponse.ok) {
            const retryData = await retryResponse.json();
            if (retryData.candidates && retryData.candidates[0] && retryData.candidates[0].content) {
              const parts = retryData.candidates[0].content.parts || [];
              text = parts.map((part: any) => part.text || '').join('');
              console.log(`✅ [Gemini] ${model} 重試成功（第 ${attempt} 次），回應長度: ${text.length}`);
              break; // 成功，跳出循環
            }
          } else if (retryResponse.status !== 429) {
            // 如果不是 429，可能是其他錯誤，直接拋出
            const retryErrorText = await retryResponse.text();
            throw new Error(`Gemini API Error: ${retryResponse.status} - ${retryErrorText.substring(0, 200)}`);
          }
          
          // 如果還是 429，繼續下一次重試
          if (attempt < maxRetries) {
            retryDelay *= 2; // 指數退避：5秒 -> 10秒 -> 20秒
          }
        } catch (err: any) {
          lastError = err;
          if (attempt === maxRetries) {
            throw err;
          }
        }
      }
      
      // 如果所有重試都失敗
      if (!text) {
        // 優雅地顯示配額用盡訊息（符合指南建議）
        const errorMsg = `今日額度已滿，請明天再來。我們已自動重試 ${maxRetries} 次，但 API 配額已用盡。即使付費帳號也可能有配額限制，請稍後再試。`;
        throw new Error(errorMsg);
      }
    }

    // 如果是 503，等待后重试
    if (response.status === 503) {
      const errorText = await response.text();
      console.warn(`⚠️ [Gemini 503] 伺服器過載，等待 2 秒後重試...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 重试一次
      const retryResponse = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBodyTemplate),
      });

      if (!retryResponse.ok) {
        const retryErrorText = await retryResponse.text();
        throw new Error(`Gemini API Error: ${retryResponse.status} - ${retryErrorText.substring(0, 200)}`);
      }

      const retryData = await retryResponse.json();
      if (retryData.candidates && retryData.candidates[0] && retryData.candidates[0].content) {
        const parts = retryData.candidates[0].content.parts || [];
        text = parts.map((part: any) => part.text || '').join('');
        console.log(`✅ [Gemini] ${model} 重試成功，回應長度: ${text.length}`);
      } else {
        throw new Error('Gemini API 回應格式異常');
      }
    } else if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [Gemini Error] ${model} API 回應錯誤: ${response.status} ${response.statusText}`);
      console.error(`❌ [Gemini Error] 詳細錯誤: ${errorText.substring(0, 300)}`);
      throw new Error(`Gemini API Error: ${response.status} ${response.statusText} - ${errorText.substring(0, 100)}`);
    } else {
      const data = await response.json();
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const parts = data.candidates[0].content.parts || [];
        text = parts.map((part: any) => part.text || '').join('');
        console.log(`✅ [Gemini] ${model} 成功取得回應，長度: ${text.length}`);
      } else {
        console.error(`❌ [Gemini] ${model} 回應格式異常:`, JSON.stringify(data).substring(0, 200));
        throw new Error('Gemini API 回應格式異常');
      }
    }

    if (!text) {
      throw new Error('Gemini API 未返回有效回應');
    }

    // AI 成功回應才扣額度（避免 API 故障消耗使用者次數）
    if (quotaSource === 'daily') {
      const incremented = await incrementUsage(limitKey, rateLimitCurrentCount);
      if (incremented) {
        console.log(`✅ [RateLimit] Daily usage incremented for ${limitKey.substring(0, 8)}...`);
      } else {
        console.error(`❌ [RateLimit] Failed to increment usage for ${limitKey.substring(0, 8)}...`);
      }
    } else if (currentUser) {
      const remainingBonus = await decrementBonusCredit(currentUser.id);
      console.log(`✅ [Quota] Bonus credit decremented; remaining=${remainingBonus}`);
    }

    console.log(`🎉 [Gemini] 使用模型: ${model}`);
    
    // ==========================================
    // 🛡️ 強化的 JSON 解析防護罩
    // ==========================================
    const fullResponseText = text;
    let report: InterviewReport;

    try {
      console.log('🔍 [Parsing] 開始解析 JSON...');
      console.log('📏 [Parsing] 原始文字長度:', text.length);
      
      // 步驟 1: 移除 Markdown 代碼塊標記
      let cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      
      // 步驟 2: 移除可能的開頭說明文字（直到第一個 {）
      const firstBraceIndex = cleanText.indexOf('{');
      if (firstBraceIndex > 0) {
        console.log(`⚠️ [Parsing] 發現 ${firstBraceIndex} 個字符的前綴文字，已移除`);
        cleanText = cleanText.substring(firstBraceIndex);
      }
      
      // 步驟 3: 找到最後一個 } 的位置（處理可能的後綴文字）
      const lastBraceIndex = cleanText.lastIndexOf('}');
      if (lastBraceIndex > 0 && lastBraceIndex < cleanText.length - 1) {
        console.log(`⚠️ [Parsing] 發現後綴文字，已移除`);
        cleanText = cleanText.substring(0, lastBraceIndex + 1);
      }
      
      // 步驟 4: 嘗試找到完整的 JSON 對象（使用括號匹配）
      let jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanText = jsonMatch[0];
      }
      
      // 步驟 5: 修復常見的 JSON 格式問題
      // 移除尾隨逗號
      cleanText = cleanText.replace(/,(\s*[}\]])/g, '$1');
      
      // 步驟 6: 驗證 JSON 結構完整性
      const openBraces = (cleanText.match(/\{/g) || []).length;
      const closeBraces = (cleanText.match(/\}/g) || []).length;
      if (openBraces !== closeBraces) {
        console.warn(`⚠️ [Parsing] 括號不匹配: { ${openBraces} vs } ${closeBraces}`);
        // 嘗試修復：如果缺少閉合括號，添加它們
        if (openBraces > closeBraces) {
          cleanText += '}'.repeat(openBraces - closeBraces);
          console.log('🔧 [Parsing] 已自動添加缺失的閉合括號');
        }
      }
      
      // 步驟 7: 解析 JSON
      report = JSON.parse(cleanText);
      console.log('✅ [Parsing] JSON 解析成功');
      
      // 步驟 8: 驗證必要字段
      if (!report.basic_analysis || !report.match_analysis) {
        throw new Error('JSON 結構不完整：缺少必要字段 (basic_analysis 或 match_analysis)');
      }
      
    } catch (e: any) {
      console.error('❌ [Parsing Error] JSON 解析失敗！');
      console.error('錯誤訊息:', e.message);
      console.error('--- 原始文字開頭 (前 500 字符) ---');
      console.error(text.substring(0, 500));
      console.error('--- 原始文字結尾 (後 500 字符) ---');
      console.error(text.substring(Math.max(0, text.length - 500)));
      
      // 容錯：最後嘗試手動修復
      try {
        console.log('🔧 [Parsing] 嘗試容錯修復...');
        let fixedText = text;
        
        // 移除所有標記
        fixedText = fixedText.replace(/```[\w]*\s*/g, '');
        fixedText = fixedText.replace(/`/g, '');
        fixedText = fixedText.trim();
        
        // 提取 JSON
        const match = fixedText.match(/\{[\s\S]*\}/);
        if (match) {
          fixedText = match[0];
          fixedText = fixedText.replace(/,(\s*[}\]])/g, '$1');
          
          // 修復括號
          const open = (fixedText.match(/\{/g) || []).length;
          const close = (fixedText.match(/\}/g) || []).length;
          if (open > close) {
            fixedText += '}'.repeat(open - close);
          }
          
          report = JSON.parse(fixedText);
          console.log('✅ [Parsing] 容錯修復成功！');
        } else {
          throw new Error('無法找到有效的 JSON 結構');
        }
      } catch (fixError: any) {
        console.error('❌ [Parsing] 容錯修復也失敗:', fixError);
        console.error('------------------');
        
        return NextResponse.json(
          { 
              error: 'AI Generated Invalid JSON', 
              details: e.message,
              rawText: text.substring(0, 1000),
              hint: 'AI 返回的內容不是有效的 JSON 格式。請重試或檢查 API 設定。'
          },
          { status: 500 }
        );
      }
    }

    normalizeReport(report, reportLanguage === 'zh-TW' ? 'zh' : 'en');

    // 先返回報告給用戶，提升響應速度
    const totalDuration = (Date.now() - startTime) / 1000;
    console.log(`🏁 [API End] AI 分析完成，耗時: ${totalDuration}秒`);

    // 儲存完整報告（登入用戶強制沉澱資產；訪客不寫入）
    let saveStatus: 'skipped_not_logged_in' | 'success' | 'failed' = 'skipped_not_logged_in';
    let saveErrorMsg: string | null = null;
    let reportId: string | null = null;
    const isPremium = false;

    if (currentUser) {
      try {
        const insertPayload = {
          user_id: currentUser.id,
          job_title: report.basic_analysis?.job_title || '未知職缺',
          job_description_preview: jobDescription.substring(0, 300),
          score: typeof report.match_analysis?.score === 'number' ? report.match_analysis.score : null,
          report: report as any,
          language: reportLanguage || 'en',
          is_premium: isPremium,
        };
        const { data: inserted, error: dbError } = await supabase
          .from('analysis_reports')
          .insert(insertPayload)
          .select('id')
          .single();
        if (dbError) {
          saveStatus = 'failed';
          saveErrorMsg = dbError.message;
          console.warn('⚠️ [DB] 報告儲存失敗（不影響回傳）:', dbError.message);
        } else {
          saveStatus = 'success';
          reportId = inserted?.id ?? null;
          console.log('✅ [DB] 分析報告已儲存');
        }
      } catch (e: any) {
        saveStatus = 'failed';
        saveErrorMsg = e?.message;
        console.warn('⚠️ [DB] 報告儲存異常（不影響回傳）:', e?.message);
      }
    } else {
      console.warn('⚠️ [DB] 跳過儲存：server 端 currentUser 為 null（未認證）');
    }

    const clientReport = isReportPremiumUnlocked(isPremium)
      ? report
      : maskPremiumReportFields(report);

    return NextResponse.json({
      report: clientReport,
      isPremium,
      reportId,
      modelUsed: model,
      saved: saveStatus === 'success',
      saveStatus,
      saveError: saveErrorMsg,
    });

  } catch (error: any) {
    console.error('❌ [Critical Error] API 全局錯誤:', error);
    console.error('❌ [Critical Error] 錯誤堆疊:', error.stack);
    
    // 提供更詳細的錯誤訊息
    let errorMessage = error.message || 'Failed to generate analysis';
    let errorCode = 'UNKNOWN_ERROR';
    
    // 根據錯誤類型提供更友善的訊息
    if (errorMessage.includes('配額用盡') || errorMessage.includes('429')) {
      errorMessage = '今日額度已滿，請明天再來。API 配額已用盡，請稍後再試。';
      errorCode = 'QUOTA_EXCEEDED';
    } else if (errorMessage.includes('AI Generated Invalid JSON') || errorMessage.includes('JSON')) {
      errorMessage = 'AI 生成格式異常，請重試。如果問題持續，請檢查輸入內容是否過長或格式不正確。';
      errorCode = 'JSON_PARSE_ERROR';
    } else if (errorMessage.includes('API Key') || errorMessage.includes('401') || errorMessage.includes('403')) {
      errorMessage = 'API 認證失敗，請檢查 API Key 設定。';
      errorCode = 'AUTH_ERROR';
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        errorCode: errorCode,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}