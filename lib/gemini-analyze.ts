import { GoogleGenAI, Type } from '@google/genai';
import type { CareerContext, LiteReport, FullReport } from '@/types';
import { normalizeLiteReport, normalizeFullReport } from '@/lib/normalize-lite-report';
import { parseJsonResponse } from '@/lib/parse-gemini-json';
import {
  GEMINI_LITE_MODEL,
  GEMINI_FULL_MODEL,
  GEMINI_TOKEN_COUNT_MODEL,
  MAX_COMBINED_TOKENS,
} from '@/constants/models';
import { LITE_SYSTEM_PROMPT } from '@/lib/prompts/lite';
import { runPaidGuideModules } from '@/lib/gemini-guide-pipeline';
import { overlayGuideModules } from '@/lib/guide-modules';
import { formatCareerContextForPrompt } from '@/lib/career-context';
import { jobSourceFromUrl } from '@/lib/job-source';
import {
  assembleAnalysisDocuments,
  withUntrustedContentPolicy,
} from '@/lib/prompt-injection-guard';
import {
  geminiLanguageDirective,
  normalizeReportLanguage,
  type AppLanguage,
} from '@/lib/report-language';
import {
  autoCorrectFullReport,
  autoCorrectLiteReport,
  formatQualityRetryHint,
  needsQualityRetry,
} from '@/lib/report-auto-correct';

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY not configured');
  return key;
}

function getAI(): GoogleGenAI {
  return new GoogleGenAI({ apiKey: getApiKey() });
}

export { parseJsonResponse } from '@/lib/parse-gemini-json';

/** Zero-cost token gate before LLM call */
export async function countCombinedTokens(
  jd: string,
  resume: string,
): Promise<number> {
  const ai = getAI();
  try {
    const res = await ai.models.countTokens({
      model: GEMINI_TOKEN_COUNT_MODEL,
      contents: `${jd}\n\n${resume}`,
    });
    return res.totalTokens ?? 0;
  } catch {
    return Math.ceil((jd.length + resume.length) / 4);
  }
}

export function isTokenLimitExceeded(tokenCount: number): boolean {
  return tokenCount > MAX_COMBINED_TOKENS;
}

export interface PdfInlineAttachment {
  data: string;
  mimeType: string;
}

function buildUserParts(
  rawJd: string,
  resumeText: string,
  pdfInline?: PdfInlineAttachment,
  careerContext?: CareerContext | null,
  pageUrl?: string | null,
): Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> {
  const careerBlock = formatCareerContextForPrompt(careerContext);
  const sourceHint = jobSourceFromUrl(pageUrl);
  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
    {
      text: assembleAnalysisDocuments({
        careerContextBlock: careerBlock || undefined,
        pageUrl,
        sourceHint,
        rawJd,
        resumeText,
        resumeIsPdf: Boolean(pdfInline),
      }),
    },
  ];
  if (pdfInline) {
    parts.push({
      inlineData: {
        mimeType: pdfInline.mimeType,
        data: pdfInline.data,
      },
    });
  }
  return parts;
}

const pointDescItem = {
  type: Type.OBJECT,
  properties: {
    point: { type: Type.STRING },
    description: { type: Type.STRING },
  },
  required: ['point', 'description'],
};

const gapDescItem = {
  type: Type.OBJECT,
  properties: {
    gap: { type: Type.STRING },
    description: { type: Type.STRING },
  },
  required: ['gap', 'description'],
};

const LITE_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    job_title: { type: Type.STRING },
    company_name: { type: Type.STRING },
    job_posted_date: { type: Type.STRING },
    job_source: { type: Type.STRING },
    data_completeness: {
      type: Type.OBJECT,
      properties: {
        level: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] },
        missing_inputs: { type: Type.ARRAY, items: { type: Type.STRING } },
        confidence_notes: { type: Type.STRING },
      },
      required: ['level', 'missing_inputs', 'confidence_notes'],
    },
    hard_filter: {
      type: Type.OBJECT,
      properties: {
        status: { type: Type.STRING, enum: ['Pass', 'Risk', 'Blocked', 'Unknown'] },
        items: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              requirement: { type: Type.STRING },
              status: { type: Type.STRING },
              evidence: { type: Type.STRING },
            },
            required: ['requirement', 'status', 'evidence'],
          },
        },
      },
      required: ['status', 'items'],
    },
    fit_score: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.INTEGER },
        band: { type: Type.STRING, enum: ['Strong', 'Viable', 'Stretch', 'Mismatch'] },
        evidence_coverage: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] },
        sharp_verdict: { type: Type.STRING },
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
        dog_type: { type: Type.STRING, enum: ['Diamond', 'Gold', 'Silver', 'Bronze'] },
      },
      required: [
        'score',
        'band',
        'evidence_coverage',
        'sharp_verdict',
        'sharp_verdict_points',
        'breakdown',
      ],
    },
    proof_map: {
      type: Type.OBJECT,
      properties: {
        strengths: { type: Type.ARRAY, minItems: 3, maxItems: 4, items: pointDescItem },
        gaps: { type: Type.ARRAY, minItems: 3, maxItems: 4, items: gapDescItem },
        resume_actions: { type: Type.ARRAY, items: { type: Type.STRING } },
        screenability_note: { type: Type.STRING },
      },
      required: ['strengths', 'gaps', 'resume_actions', 'screenability_note'],
    },
    expected_offer: {
      type: Type.OBJECT,
      properties: {
        posted_range: { type: Type.STRING, nullable: true },
        p25: { type: Type.STRING, nullable: true },
        p50: { type: Type.STRING, nullable: true },
        p75: { type: Type.STRING, nullable: true },
        currency: { type: Type.STRING },
        region: { type: Type.STRING },
        target_gap: { type: Type.STRING },
        evidence_tier: { type: Type.STRING, enum: ['A', 'B', 'C', 'D'] },
        sources: { type: Type.ARRAY, items: { type: Type.STRING } },
        candidate_predicted_offer: { type: Type.STRING, nullable: true },
        candidate_position_label: { type: Type.STRING },
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
      required: [
        'posted_range',
        'p25',
        'p50',
        'p75',
        'currency',
        'region',
        'target_gap',
        'evidence_tier',
        'sources',
        'candidate_predicted_offer',
      ],
    },
    apply_decision: {
      type: Type.OBJECT,
      properties: {
        label: {
          type: Type.STRING,
          enum: ['Apply now', 'Apply after fixes', 'Clarify first', 'Skip'],
        },
        reason: { type: Type.STRING },
        next_best_action: { type: Type.STRING },
      },
      required: ['label', 'reason', 'next_best_action'],
    },
    role_read: {
      type: Type.OBJECT,
      properties: {
        mission: { type: Type.STRING },
        responsibilities: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description:
            '3–5 "Deliverable: who + named system/rail/metric" lines. Lead with the work-product keyword. No generic duties.',
        },
        hiring_signals: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description:
            '3–5 "Kind: fact" lines. Kind = Years, Skill, License, Domain, Degree, or System (report-language equivalent OK). Fact names the JD keyword, years, license, system, or domain. No vague paraphrases.',
        },
      },
      required: ['mission', 'responsibilities', 'hiring_signals'],
    },
    interview_starters: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    // Executive layer — optional in the schema; normalizeLiteReport enforces integrity.
    competency_map: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          competency: { type: Type.STRING },
          weight: { type: Type.STRING, description: 'core | supporting' },
          proficiency: { type: Type.STRING, description: 'demonstrated | adjacent | absent' },
          resume_evidence: { type: Type.STRING },
        },
      },
    },
    market_positioning: {
      type: Type.OBJECT,
      properties: {
        seniority_alignment: {
          type: Type.STRING,
          description: 'under_level | at_level | over_level | unclear',
        },
        rationale: { type: Type.STRING },
        differentiator: { type: Type.STRING },
      },
    },
    risk_assessment: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: {
            type: Type.STRING,
            description: 'competency | seniority | compensation | eligibility | role_stability',
          },
          severity: { type: Type.STRING, description: 'low | medium | high' },
          statement: { type: Type.STRING },
          basis: { type: Type.STRING, description: 'resume | jd | inferred' },
          source_url: { type: Type.STRING },
        },
      },
    },
  },
  required: [
    'job_title',
    'company_name',
    'job_posted_date',
    'job_source',
    'data_completeness',
    'hard_filter',
    'fit_score',
    'proof_map',
    'expected_offer',
    'apply_decision',
    'role_read',
    'interview_starters',
  ],
};

function applyJobSourceFallback(
  report: LiteReport,
  pageUrl?: string | null,
): LiteReport {
  if (report.job_source?.trim()) return report;
  const fromUrl = jobSourceFromUrl(pageUrl);
  return fromUrl ? { ...report, job_source: fromUrl } : report;
}

export async function executeLiteAnalysis(
  resumeText: string,
  rawJd: string,
  pdfInline?: PdfInlineAttachment,
  careerContext?: CareerContext | null,
  pageUrl?: string | null,
  language: AppLanguage | string = 'en',
): Promise<{ report: LiteReport; model: string }> {
  const ai = getAI();
  const model = GEMINI_LITE_MODEL;
  const opts = { careerContext };
  const lang = normalizeReportLanguage(language);
  const systemBase = withUntrustedContentPolicy(
    `${LITE_SYSTEM_PROMPT}\n\n${geminiLanguageDirective(lang)}`,
  );

  const response = await ai.models.generateContent({
    model,
    contents: [{ parts: buildUserParts(rawJd, resumeText, pdfInline, careerContext, pageUrl) }],
    config: {
      systemInstruction: systemBase,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
      responseSchema: LITE_RESPONSE_SCHEMA,
    },
  });

  const text = response.text;
  if (!text) throw new Error('Lite analysis returned empty response');

  let report: LiteReport;
  try {
    report = applyJobSourceFallback(
      normalizeLiteReport(parseJsonResponse<LiteReport>(text), opts),
      pageUrl,
    );
  } catch (firstErr) {
    const retry = await ai.models.generateContent({
      model,
      contents: [{ parts: buildUserParts(rawJd, resumeText, pdfInline, careerContext, pageUrl) }],
      config: {
        systemInstruction:
          `${systemBase}\n\nCRITICAL: Return COMPLETE valid JSON only. Keep string fields concise (1–2 sentences each). Do not truncate. Tier D → null salary numbers.`,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
        responseSchema: LITE_RESPONSE_SCHEMA,
      },
    });
    const retryText = retry.text;
    if (!retryText) throw firstErr;
    report = applyJobSourceFallback(
      normalizeLiteReport(parseJsonResponse<LiteReport>(retryText), opts),
      pageUrl,
    );
  }

  const firstPass = autoCorrectLiteReport(report);
  report = firstPass.report;
  if (needsQualityRetry(firstPass.corrections)) {
    const retry = await ai.models.generateContent({
      model,
      contents: [{ parts: buildUserParts(rawJd, resumeText, pdfInline, careerContext, pageUrl) }],
      config: {
        systemInstruction: `${systemBase}\n\n${formatQualityRetryHint(firstPass.corrections)}`,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
        responseSchema: LITE_RESPONSE_SCHEMA,
      },
    });
    if (retry.text) {
      report = autoCorrectLiteReport(
        applyJobSourceFallback(
          normalizeLiteReport(parseJsonResponse<LiteReport>(retry.text), opts),
          pageUrl,
        ),
      ).report;
    }
  } else {
    report = firstPass.report;
  }

  return { report, model };
}

export async function executeFullAnalysis(
  resumeText: string,
  rawJd: string,
  companyName: string,
  jobTitle: string,
  pdfInline?: PdfInlineAttachment,
  careerContext?: CareerContext | null,
  pageUrl?: string | null,
  language: AppLanguage | string = 'en',
): Promise<{ report: FullReport; model: string }> {
  const opts = { careerContext };
  const snapshot = await executeLiteAnalysis(
    resumeText,
    rawJd,
    pdfInline,
    careerContext,
    pageUrl,
    language,
  );
  const modules = await runPaidGuideModules({
    parts: buildUserParts(rawJd, resumeText, pdfInline, careerContext, pageUrl),
    language,
    companyName,
    jobTitle,
  });
  const merged = overlayGuideModules(
    applyJobSourceFallback(snapshot.report, pageUrl),
    modules,
  );
  const report = autoCorrectFullReport(
    normalizeFullReport(merged, opts),
  ).report;

  return { report, model: `${snapshot.model}+${GEMINI_FULL_MODEL}` };
}
