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
import { FULL_SYSTEM_PROMPT } from '@/lib/prompts/full';
import { formatCareerContextForPrompt } from '@/lib/career-context';

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
): Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> {
  const careerBlock = formatCareerContextForPrompt(careerContext);
  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
    {
      text: [
        careerBlock,
        `=== JOB DESCRIPTION ===\n${rawJd}`,
        `=== RESUME ===\n${
          pdfInline
            ? 'The candidate resume is attached as a PDF document below. Read it fully before scoring.'
            : resumeText
        }`,
      ]
        .filter(Boolean)
        .join('\n\n'),
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
        responsibilities: { type: Type.ARRAY, items: { type: Type.STRING } },
        hiring_signals: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ['mission', 'responsibilities', 'hiring_signals'],
    },
    interview_starters: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: [
    'job_title',
    'company_name',
    'job_posted_date',
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

/** Strategy-layer properties merged into the single-pass Guide schema */
const FULL_STRATEGY_PROPERTIES = {
  strategy_fit_salary: {
    type: Type.OBJECT,
    properties: {
      score_implications: { type: Type.STRING },
      offer_implications: { type: Type.STRING },
      validate_with_recruiter: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: ['score_implications', 'offer_implications', 'validate_with_recruiter'],
  },
  hiring_context: {
    type: Type.OBJECT,
    properties: {
      insights: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            claim: { type: Type.STRING },
            why_it_matters: { type: Type.STRING },
            source_url: { type: Type.STRING },
            date: { type: Type.STRING },
          },
          required: ['claim', 'why_it_matters', 'source_url', 'date'],
        },
      },
      limitations: { type: Type.ARRAY, items: { type: Type.STRING } },
      validation_questions: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: ['insights', 'limitations', 'validation_questions'],
  },
  concerns_defenses: {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        concern: { type: Type.STRING },
        why: { type: Type.STRING },
        evidence: { type: Type.STRING },
        missing_proof: { type: Type.STRING },
        answer_guide: { type: Type.STRING },
        do_not_claim: { type: Type.STRING },
      },
      required: [
        'concern',
        'why',
        'evidence',
        'missing_proof',
        'answer_guide',
        'do_not_claim',
      ],
    },
  },
  interview_playbook: {
    type: Type.OBJECT,
    properties: {
      reported: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            source_url: { type: Type.STRING },
            source_date: { type: Type.STRING },
            evidence: { type: Type.STRING },
            star_outline: { type: Type.STRING },
          },
          required: ['question'],
        },
      },
      predicted: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            predicted: { type: Type.BOOLEAN },
            evidence: { type: Type.STRING },
            star_outline: { type: Type.STRING },
            missing_facts: { type: Type.STRING },
          },
          required: ['question'],
        },
      },
      star_templates: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            for_question: { type: Type.STRING },
            situation: { type: Type.STRING },
            task: { type: Type.STRING },
            action: { type: Type.STRING },
            result: { type: Type.STRING },
            resume_anchor: { type: Type.STRING },
          },
          required: [
            'title',
            'situation',
            'task',
            'action',
            'result',
            'resume_anchor',
          ],
        },
      },
      star_outlines: { type: Type.ARRAY, items: { type: Type.STRING } },
      reverse_questions: { type: Type.ARRAY, items: { type: Type.STRING } },
      validate_before_join: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: [
      'reported',
      'predicted',
      'star_templates',
      'reverse_questions',
      'validate_before_join',
    ],
  },
  offer_strategy: {
    type: Type.OBJECT,
    properties: {
      target: { type: Type.STRING },
      acceptable: { type: Type.STRING },
      walk_away: { type: Type.STRING },
      levers: { type: Type.ARRAY, items: { type: Type.STRING } },
      structured_levers: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            note: { type: Type.STRING },
          },
          required: ['name', 'note'],
        },
      },
      tc_breakdown: {
        type: Type.OBJECT,
        properties: {
          base: { type: Type.STRING, nullable: true },
          bonus: { type: Type.STRING, nullable: true },
          equity: { type: Type.STRING, nullable: true },
          total: { type: Type.STRING, nullable: true },
        },
      },
      script: { type: Type.STRING },
      discovery_questions: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: [
      'target',
      'acceptable',
      'walk_away',
      'levers',
      'script',
      'discovery_questions',
    ],
  },
  candidate_case: {
    type: Type.OBJECT,
    properties: {
      hire_thesis: { type: Type.STRING },
      top_facts: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: ['hire_thesis', 'top_facts'],
  },
};

/** Single-pass Guide: Snapshot fields + strategy intel (Pro only) */
const FULL_REPORT_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    ...LITE_RESPONSE_SCHEMA.properties,
    ...FULL_STRATEGY_PROPERTIES,
  },
  required: [
    ...LITE_RESPONSE_SCHEMA.required,
    'strategy_fit_salary',
    'hiring_context',
    'concerns_defenses',
    'interview_playbook',
    'offer_strategy',
    'candidate_case',
  ],
};

export async function executeLiteAnalysis(
  resumeText: string,
  rawJd: string,
  pdfInline?: PdfInlineAttachment,
  careerContext?: CareerContext | null,
): Promise<{ report: LiteReport; model: string }> {
  const ai = getAI();
  const model = GEMINI_LITE_MODEL;
  const opts = { careerContext };

  const response = await ai.models.generateContent({
    model,
    contents: [{ parts: buildUserParts(rawJd, resumeText, pdfInline, careerContext) }],
    config: {
      systemInstruction: LITE_SYSTEM_PROMPT,
      temperature: 0.3,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
      responseSchema: LITE_RESPONSE_SCHEMA,
    },
  });

  const text = response.text;
  if (!text) throw new Error('Lite analysis returned empty response');

  let report: LiteReport;
  try {
    report = normalizeLiteReport(parseJsonResponse<LiteReport>(text), opts);
  } catch (firstErr) {
    const retry = await ai.models.generateContent({
      model,
      contents: [{ parts: buildUserParts(rawJd, resumeText, pdfInline, careerContext) }],
      config: {
        systemInstruction:
          `${LITE_SYSTEM_PROMPT}\n\nCRITICAL: Return COMPLETE valid JSON only. Keep string fields concise (1–2 sentences each). Do not truncate. Tier D → null salary numbers.`,
        temperature: 0.2,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
        responseSchema: LITE_RESPONSE_SCHEMA,
      },
    });
    const retryText = retry.text;
    if (!retryText) throw firstErr;
    report = normalizeLiteReport(parseJsonResponse<LiteReport>(retryText), opts);
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
): Promise<{ report: FullReport; model: string }> {
  const ai = getAI();
  const model = GEMINI_FULL_MODEL;
  const opts = { careerContext };

  const intro = [
    companyName ? `Target Company hint: ${companyName}` : null,
    jobTitle ? `Job Title hint: ${jobTitle}` : null,
    'Produce the complete Interview Strategy Guide (Snapshot layer + strategy layer) in one JSON object.',
    'Use public web sources when citing hiring_context or reported interview questions.',
    'If public sources are thin, return limitations + validation_questions — that is success, not failure.',
    'Include candidate_case (hire_thesis + top_facts) and offer_strategy.tc_breakdown when estimable.',
  ]
    .filter(Boolean)
    .join('\n');

  const parts = buildUserParts(rawJd, resumeText, pdfInline, careerContext);
  parts[0] = {
    text: `${intro}\n\n${(parts[0] as { text: string }).text}`,
  };

  const run = async (withSearch: boolean, systemExtra = '') => {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts }],
      config: {
        systemInstruction: systemExtra
          ? `${FULL_SYSTEM_PROMPT}\n\n${systemExtra}`
          : FULL_SYSTEM_PROMPT,
        temperature: 0.35,
        maxOutputTokens: 16384,
        responseMimeType: 'application/json',
        ...(withSearch ? { tools: [{ googleSearch: {} }] } : {}),
        responseSchema: FULL_REPORT_RESPONSE_SCHEMA,
      },
    });
    const text = response.text;
    if (!text) throw new Error('Interview Strategy Guide returned empty response');
    return normalizeFullReport(parseJsonResponse<FullReport>(text), opts);
  };

  let report: FullReport;
  try {
    report = await run(true);
  } catch (firstErr) {
    console.warn(
      '[Full] Single-pass Pro+Search failed, retrying:',
      firstErr instanceof Error ? firstErr.message : firstErr,
    );
    try {
      report = await run(
        true,
        'CRITICAL: Return COMPLETE valid JSON only covering Snapshot + strategy fields. Keep strings concise. Do not truncate.',
      );
    } catch (secondErr) {
      console.warn(
        '[Full] Search retry failed, retrying Pro without Search tools:',
        secondErr instanceof Error ? secondErr.message : secondErr,
      );
      report = await run(
        false,
        'CRITICAL: Return COMPLETE valid JSON only. Search tools unavailable — set hiring_context.insights=[] and explain in limitations + validation_questions. Do not invent citations.',
      );
    }
  }

  return { report, model };
}
